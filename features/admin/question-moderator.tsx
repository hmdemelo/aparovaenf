'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Search,
} from 'lucide-react'

type SubjectOption = {
  id: string
  name: string
  career_id: string
}

type BoardOption = {
  id: string
  name: string
}

type QuestionRow = {
  id: string
  statement: string
  status: string
  difficulty: string | null
  author: string | null
  subject: string | null
  board?: string | null
  createdAt: string
}

type QuestionPagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type QuestionModeratorProps = {
  initialQuestions: QuestionRow[]
  initialPagination: QuestionPagination
  subjects: SubjectOption[]
  boards: BoardOption[]
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  published: 'Publicada',
  unpublished: 'Despublicada',
  archived: 'Arquivada',
}

function StatusBadge({ status }: { status: string }) {
  const published = status === 'published'

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        published
          ? 'bg-[var(--teal-light)] text-[var(--teal-ink)] border border-[rgba(0,84,64,0.12)]'
          : 'bg-[var(--warn-bg)] text-[var(--warn)] border border-[rgba(133,79,11,0.12)]'
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export function QuestionModerator({
  initialQuestions,
  initialPagination,
  subjects,
  boards,
}: QuestionModeratorProps) {
  const [questions, setQuestions] = useState<QuestionRow[]>(initialQuestions)
  const [pagination, setPagination] =
    useState<QuestionPagination>(initialPagination)
  const [page, setPage] = useState(initialPagination.page)
  const didMount = useRef(false)

  // Filter Inputs (Local State)
  const [searchInput, setSearchInput] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedBoardId, setSelectedBoardId] = useState('')

  // Active Query Values
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('')
  const [activeSubjectId, setActiveSubjectId] = useState('')
  const [activeBoardId, setActiveBoardId] = useState('')

  // Sorting State
  const [sortColumn, setSortColumn] = useState<
    'statement' | 'author' | 'subject' | 'board' | 'status' | 'createdAt' | null
  >(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // UI States
  const [loading, setLoading] = useState(false)
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch Questions from API
  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '30') // Always limit to 30 items
      if (searchQuery) params.set('q', searchQuery)
      if (activeStatus) params.set('status', activeStatus)
      if (activeSubjectId) params.set('subject_id', activeSubjectId)
      if (activeBoardId) params.set('board_id', activeBoardId)
      params.set('page', String(page))

      const res = await fetch(`/api/admin/questions?${params.toString()}`)
      if (!res.ok) throw new Error('Não foi possível carregar as questões.')
      const json = await res.json()
      if (json.success) {
        setQuestions(json.data.questions || [])
        if (json.data.pagination) {
          setPagination(json.data.pagination)
        }
      } else {
        setError(json.error?.message || 'Erro ao carregar questões.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar busca.')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeStatus, activeSubjectId, activeBoardId, page])

  // Explicit Trigger on Filter Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setActiveStatus(selectedStatus)
    setActiveSubjectId(selectedSubjectId)
    setActiveBoardId(selectedBoardId)
    setPage(1)
  }

  // Reload when active query values change
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
    fetchQuestions()
  }, [fetchQuestions])

  // Clear Filters
  const handleResetFilters = () => {
    setSearchInput('')
    setSelectedStatus('')
    setSelectedSubjectId('')
    setSelectedBoardId('')

    setSearchQuery('')
    setActiveStatus('')
    setActiveSubjectId('')
    setActiveBoardId('')

    setSortColumn(null)
    setPage(1)
  }

  // Handle Dynamic Column Sorting
  const handleSort = (
    column:
      | 'statement'
      | 'author'
      | 'subject'
      | 'board'
      | 'status'
      | 'createdAt',
  ) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Unpublish question logic
  const handleUnpublish = async (questionId: string) => {
    setUnpublishingId(questionId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/unpublish`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Erro ao despublicar a questão.')

      // Update state locally
      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, status: 'unpublished' } : q))
      )
      setSuccess('Questão despublicada com sucesso!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao despublicar.')
    } finally {
      setUnpublishingId(null)
    }
  }

  // Perform Client-Side sorting on current 30 questions
  const sortedQuestions = [...questions].sort((a, b) => {
    if (!sortColumn) return 0

    const dir = sortDirection === 'asc' ? 1 : -1

    if (sortColumn === 'createdAt') {
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      )
    }

    const valA = String(a[sortColumn] || '').toLowerCase()
    const valB = String(b[sortColumn] || '').toLowerCase()
    return valA.localeCompare(valB) * dir
  })

  const renderSortIcon = (
    column:
      | 'statement'
      | 'author'
      | 'subject'
      | 'board'
      | 'status'
      | 'createdAt',
  ) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="ml-1 text-[var(--hint)]" />
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="ml-1 text-[var(--teal)]" />
    ) : (
      <ArrowDown size={14} className="ml-1 text-[var(--teal)]" />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Form */}
      <form onSubmit={handleSearchSubmit} className="rounded-[22px] border border-[color:var(--line)] bg-white/82 p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Text Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[var(--muted)]">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Pesquisar enunciado..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={160}
              className="aprova-field pl-10 py-2.5 text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="aprova-field py-2.5 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="published">Publicada</option>
            <option value="unpublished">Despublicada</option>
            <option value="archived">Arquivada</option>
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="aprova-field py-2.5 text-sm"
          >
            <option value="">Todas as disciplinas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Board Filter */}
          <select
            value={selectedBoardId}
            onChange={(e) => setSelectedBoardId(e.target.value)}
            className="aprova-field py-2.5 text-sm"
          >
            <option value="">Todas as bancas</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="aprova-button aprova-button-ghost py-2 px-5 text-sm"
          >
            Limpar Filtros
          </button>
          <button
            type="submit"
            className="aprova-button py-2 px-6 text-sm"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* Messages */}
      {error && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)] border border-[rgba(178,58,46,0.15)]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--teal-light)] p-4 text-sm text-[var(--teal-ink)] border border-[rgba(0,84,64,0.15)]">
          {success}
        </div>
      )}

      {/* Questions Table Container */}
      <section className="rounded-[22px] border border-[color:var(--line)] bg-white/82 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--teal)]" />
          <h2 className="text-[21px] font-semibold text-[var(--ink)]">
            Questões da Plataforma
          </h2>
          <span className="ml-auto text-xs font-medium text-[var(--muted)]">
            {pagination.total} resultados
          </span>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center text-[var(--muted)]">
            <span className="animate-pulse">Carregando questões...</span>
          </div>
        ) : sortedQuestions.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[var(--muted)] text-sm">
            Nenhuma questão encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto" data-testid="admin-questions">
            <table className="aprova-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('statement')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Enunciado {renderSortIcon('statement')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('author')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Autor {renderSortIcon('author')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('subject')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Assunto {renderSortIcon('subject')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('board')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Banca {renderSortIcon('board')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('status')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Status {renderSortIcon('status')}
                    </div>
                  </th>
                  <th onClick={() => handleSort('createdAt')} className="cursor-pointer select-none">
                    <div className="flex items-center">
                      Data {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuestions.map((q) => (
                  <tr key={q.id}>
                    <td className="min-w-72 max-w-[360px]">
                      <p className="line-clamp-1 text-[var(--ink)]">
                        {q.statement}
                      </p>
                    </td>
                    <td className="text-[var(--muted)]">
                      {q.author ?? 'sem autor'}
                    </td>
                    <td className="text-[var(--muted)]">
                      {q.subject ?? 'sem assunto'}
                    </td>
                    <td className="text-[var(--muted)]">
                      {q.board ?? 'sem banca'}
                    </td>
                    <td>
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="text-[var(--muted)] text-xs">
                      {new Date(q.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      {q.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(q.id)}
                          disabled={unpublishingId === q.id}
                          data-testid={`unpublish-${q.id}`}
                          className="rounded-lg border border-[color:var(--line)] px-3 py-1 text-xs font-medium text-[var(--danger)] transition hover:border-[color:var(--danger)] hover:bg-[var(--danger-bg)] disabled:opacity-50"
                        >
                          {unpublishingId === q.id ? 'Despublicando...' : 'Despublicar'}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--hint)] font-semibold">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Página anterior"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-full border border-[color:var(--line-2)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-paper)] disabled:opacity-40"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            type="button"
            aria-label="Próxima página"
            disabled={page >= pagination.totalPages || loading}
            onClick={() =>
              setPage((current) =>
                Math.min(current + 1, pagination.totalPages),
              )
            }
            className="rounded-full border border-[color:var(--line-2)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-paper)] disabled:opacity-40"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
