'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PencilLine,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

type CareerOption = {
  id: string
  name: string
}

type CatalogItem = {
  id: string
  name: string
  created_at: string
  career?: { id: string; name: string } | null
  discipline?: { id: string; name: string } | null
  created_by?: { label: string; is_current_user: boolean }
}

type CatalogResponse = {
  items: CatalogItem[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

type CatalogManagerProps = {
  careers: CareerOption[]
}

type CatalogType = 'discipline' | 'topic' | 'board'

export function CatalogManager({ careers }: CatalogManagerProps) {
  const router = useRouter()

  // Tabs: 'discipline' (Disciplinas), 'topic' (Assuntos), 'board' (Bancas)
  const [activeTab, setActiveTab] = useState<CatalogType>('discipline')

  // Search and Pagination
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  // Data State
  const [items, setItems] = useState<CatalogItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)

  // Global message alerts
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null)

  // Form values
  const [name, setName] = useState('')
  const [selectedCareerId, setSelectedCareerId] = useState('')
  const [selectedDisciplineId, setSelectedDisciplineId] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Reference data for topic creation (we need subjects/disciplines)
  const [allDisciplines, setAllDisciplines] = useState<{ id: string; name: string }[]>([])

  // Load disciplines helper for the Assuntos dropdown
  const loadAllDisciplines = useCallback(async () => {
    try {
      const res = await fetch('/api/author/disciplines?page_size=200')
      if (res.ok) {
        const json = await res.json()
        if (json.success) {
          setAllDisciplines(json.data.items || [])
        }
      }
    } catch (err) {
      console.error('Erro ao carregar lista de disciplinas para o dropdown', err)
    }
  }, [])

  // Fetch catalog data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let endpoint = ''
      if (activeTab === 'discipline') {
        endpoint = `/api/author/disciplines?page=${page}&q=${encodeURIComponent(searchQuery)}`
      } else if (activeTab === 'topic') {
        endpoint = `/api/author/topics?page=${page}&q=${encodeURIComponent(searchQuery)}`
      } else {
        endpoint = `/api/author/boards?page=${page}&q=${encodeURIComponent(searchQuery)}`
      }

      const res = await fetch(endpoint)
      if (!res.ok) throw new Error('Não foi possível carregar os dados.')
      const json = await res.json()

      if (json.success) {
        const data = json.data as CatalogResponse
        setItems(data.items || [])
        setTotalPages(data.pagination.total_pages || 1)
        setTotalItems(data.pagination.total || 0)
      } else {
        setError(json.error?.message || 'Erro ao carregar catálogo.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de rede ao carregar catálogo.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, searchQuery])

  // Reload when tab, page, or search changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  // Load options depending on modal requirements
  useEffect(() => {
    if (activeTab === 'topic' || isCreateOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadAllDisciplines()
    }
  }, [activeTab, isCreateOpen, loadAllDisciplines])

  // Handle tab switch
  const handleTabChange = (tab: CatalogType) => {
    setActiveTab(tab)
    setPage(1)
    setSearchInput('')
    setSearchQuery('')
    setError(null)
    setSuccess(null)
  }

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
    setPage(1)
  }

  // Handle Item Creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let endpoint = ''
      const payload: Record<string, string> = { name }

      if (activeTab === 'discipline') {
        endpoint = '/api/author/disciplines'
        payload.career_id = selectedCareerId
      } else if (activeTab === 'topic') {
        endpoint = '/api/author/topics'
        payload.discipline_id = selectedDisciplineId
      } else {
        endpoint = '/api/author/boards'
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erro ao cadastrar item.')
      }

      setSuccess('Item cadastrado com sucesso!')
      setIsCreateOpen(false)
      setName('')
      setSelectedCareerId('')
      setSelectedDisciplineId('')
      setPage(1)
      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao realizar cadastro.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Edit Submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload: Record<string, string> = { name }
      if (activeTab === 'discipline') {
        payload.career_id = selectedCareerId
      } else if (activeTab === 'topic') {
        payload.discipline_id = selectedDisciplineId
      }

      const res = await fetch(`/api/admin/classifications/${activeTab}/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Erro ao editar o item.')
      }

      setSuccess('Item atualizado com sucesso!')
      setEditingItem(null)
      setName('')
      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar alterações.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle Delete Confirmation
  const handleDeleteSubmit = async () => {
    if (!deletingItem) return
    setActionLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/classifications/${activeTab}/${deletingItem.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Não foi possível excluir o item.')
      }

      setSuccess('Item excluído com sucesso!')
      setDeletingItem(null)
      fetchData()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item.')
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (item: CatalogItem) => {
    setEditingItem(item)
    setName(item.name)
    setSelectedCareerId(item.career?.id ?? '')
    setSelectedDisciplineId(item.discipline?.id ?? '')
  }

  const getTabLabel = (type: CatalogType) => {
    if (type === 'discipline') return 'Disciplina'
    if (type === 'topic') return 'Assunto'
    return 'Banca'
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Nav & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-lg bg-[var(--surface-paper)] p-1 border border-[color:var(--line)]">
          <button
            type="button"
            onClick={() => handleTabChange('discipline')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'discipline'
                ? 'bg-white text-[var(--teal-ink)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Disciplinas
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('topic')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'topic'
                ? 'bg-white text-[var(--teal-ink)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Assuntos
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('board')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'board'
                ? 'bg-white text-[var(--teal-ink)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Bancas
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setName('')
            setSelectedCareerId('')
            setSelectedDisciplineId('')
            setIsCreateOpen(true)
          }}
          className="aprova-button text-sm"
        >
          <Plus size={17} />
          Nova {getTabLabel(activeTab)}
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-[var(--muted)]">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder={`Pesquisar ${activeTab === 'discipline' ? 'disciplina' : activeTab === 'topic' ? 'assunto' : 'banca'}...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="aprova-field pl-10"
          />
        </div>
        <button type="submit" className="aprova-button py-3 px-6">
          Buscar
        </button>
      </form>

      {/* Error and Success Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--danger-bg)] p-4 text-sm text-[var(--danger)] border border-[rgba(178,58,46,0.15)]">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--teal-light)] p-4 text-sm text-[var(--teal-ink)] border border-[rgba(0,84,64,0.15)]">
          {success}
        </div>
      )}

      {/* Catalog List */}
      <section className="relative">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-[var(--muted)]">
            <span className="animate-pulse">Carregando itens...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-[22px] border border-dashed border-[color:var(--line)] bg-white/40 text-[var(--muted)] text-sm">
            Nenhum item encontrado.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
              {totalItems} {totalItems === 1 ? getTabLabel(activeTab).toLowerCase() : getTabLabel(activeTab).toLowerCase() + 's'}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-[18px] border border-[color:var(--line)] bg-white/82 px-4 py-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {item.name}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {item.career && `Carreira: ${item.career.name}`}
                      {item.discipline && `Disciplina: ${item.discipline.name}`}
                      {!item.career && !item.discipline && `Criado por: ${item.created_by?.label || 'Sistema'}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-[color:var(--line-2)] px-3 py-1 text-xs font-semibold text-[var(--teal)] transition hover:bg-[rgba(160,243,212,0.24)]"
                    >
                      <PencilLine size={13} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="inline-flex items-center gap-1 rounded-full border border-[rgba(178,58,46,0.2)] px-3 py-1 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-bg)]"
                    >
                      <Trash2 size={13} />
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 mt-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="rounded-full border border-[color:var(--line-2)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-paper)] disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-[var(--muted)]">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="rounded-full border border-[color:var(--line-2)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-paper)] disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Dialog: Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,31,26,0.46)] px-4 py-6" role="presentation">
          <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[22px] border border-[color:var(--line)] bg-white p-6 shadow-[0_30px_70px_-34px_rgba(14,31,26,0.55)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-display text-[21px] font-semibold text-[var(--ink)]">
                Nova {getTabLabel(activeTab)}
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Fechar cadastro"
                className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface-paper)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--muted)]">Nome</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="aprova-field"
                  placeholder={`Ex: ${activeTab === 'discipline' ? 'Saúde Coletiva' : activeTab === 'topic' ? 'Calendário Vacinal' : 'CESPE'}`}
                />
              </label>

              {activeTab === 'discipline' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Carreira Relacionada</span>
                  <select
                    required
                    value={selectedCareerId}
                    onChange={(e) => setSelectedCareerId(e.target.value)}
                    className="aprova-field"
                  >
                    <option value="" disabled>Selecione uma carreira</option>
                    {careers.map((career) => (
                      <option key={career.id} value={career.id}>
                        {career.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {activeTab === 'topic' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">Disciplina Relacionada</span>
                  <select
                    required
                    value={selectedDisciplineId}
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    className="aprova-field"
                  >
                    <option value="" disabled>Selecione uma disciplina</option>
                    {allDisciplines.map((disc) => (
                      <option key={disc.id} value={disc.id}>
                        {disc.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="aprova-button w-full py-3 disabled:bg-[var(--hint)] mt-2"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,31,26,0.46)] px-4 py-6" role="presentation">
          <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[22px] border border-[color:var(--line)] bg-white p-6 shadow-[0_30px_70px_-34px_rgba(14,31,26,0.55)]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="font-display text-[21px] font-semibold text-[var(--ink)]">
                Editar {getTabLabel(activeTab)}
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                aria-label="Fechar edição"
                className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--surface-paper)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[var(--muted)]">Nome</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="aprova-field"
                />
              </label>

              {activeTab === 'discipline' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">
                    Carreira Relacionada
                  </span>
                  <select
                    required
                    value={selectedCareerId}
                    onChange={(e) => setSelectedCareerId(e.target.value)}
                    className="aprova-field"
                  >
                    <option value="" disabled>
                      Selecione uma carreira
                    </option>
                    {careers.map((career) => (
                      <option key={career.id} value={career.id}>
                        {career.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {activeTab === 'topic' && (
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-[var(--muted)]">
                    Disciplina Relacionada
                  </span>
                  <select
                    required
                    value={selectedDisciplineId}
                    onChange={(e) => setSelectedDisciplineId(e.target.value)}
                    className="aprova-field"
                  >
                    <option value="" disabled>
                      Selecione uma disciplina
                    </option>
                    {allDisciplines.map((discipline) => (
                      <option key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="aprova-button w-full py-3 disabled:bg-[var(--hint)] mt-2"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dialog: Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(14,31,26,0.46)] px-4 py-6" role="presentation">
          <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[22px] border border-[color:var(--line)] bg-white p-6 shadow-[0_30px_70px_-34px_rgba(14,31,26,0.55)]">
            <h3 className="font-display text-[21px] font-semibold text-[var(--ink)] mb-2">
              Excluir {getTabLabel(activeTab)}?
            </h3>
            <p className="text-sm text-[var(--muted)] mb-6">
              Tem certeza de que deseja excluir permanentemente o item <strong>{deletingItem.name}</strong>? Esta ação não poderá ser desfeita.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setDeletingItem(null)}
                className="aprova-button aprova-button-ghost py-2.5 px-4 text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteSubmit}
                className="aprova-button bg-[var(--danger)] text-white py-2.5 px-4 text-sm hover:bg-[#962f25]"
              >
                {actionLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
