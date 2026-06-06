'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, Plus, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react'

export type CatalogItem = {
  id: string
  name: string
  career?: { id: string; name: string } | null
  discipline?: { id: string; name: string } | null
  created_by: { label: string; is_current_user: boolean }
  created_at: string
}

type TabType = 'disciplines' | 'topics' | 'boards'

type Props = {
  isOpen: boolean
  onClose: () => void
  initialTab?: TabType
  careers: { id: string; name: string }[]
  currentCareerId?: string
  currentDisciplineId?: string
  onSelectDiscipline: (discipline: { id: string; name: string }) => void
  onSelectBoard: (board: { id: string; name: string }) => void
  selectedTopicIds: string[]
  selectedTopics: { id: string; name: string; slug: string; subject_id: string | null }[]
  onConfirmTopics: (topicIds: string[], topics: { id: string; name: string; slug: string; subject_id: string | null }[]) => void
}

export function ClassificationCatalogDialog({
  isOpen,
  onClose,
  initialTab = 'disciplines',
  careers,
  currentCareerId = '',
  currentDisciplineId = '',
  onSelectDiscipline,
  onSelectBoard,
  selectedTopics,
  onConfirmTopics,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Creation form states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCareerId, setCreateCareerId] = useState(currentCareerId)
  const [createDisciplineId, setCreateDisciplineId] = useState(currentDisciplineId)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Multi-select state for topics (Assuntos)
  const [tempSelectedTopics, setTempSelectedTopics] = useState<{ id: string; name: string; slug: string; subject_id: string | null }[]>(selectedTopics)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Synced state on open/tab change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setSearchQuery('')
        setPage(1)
        setShowCreateForm(false)
        setCreateName('')
        setCreateError(null)
        setTempSelectedTopics(selectedTopics)
        if (activeTab === 'topics') {
          setCreateDisciplineId(currentDisciplineId)
        } else if (activeTab === 'disciplines') {
          setCreateCareerId(currentCareerId)
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [isOpen, activeTab, currentCareerId, currentDisciplineId, selectedTopics])

  // Fetch list when activeTab, searchQuery, or page changes
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let url = ''
      if (activeTab === 'disciplines') {
        url = `/api/author/disciplines?page=${page}&q=${encodeURIComponent(searchQuery)}`
        if (currentCareerId) url += `&career_id=${currentCareerId}`
      } else if (activeTab === 'topics') {
        url = `/api/author/topics?page=${page}&q=${encodeURIComponent(searchQuery)}`
        if (currentDisciplineId) url += `&discipline_id=${currentDisciplineId}`
      } else {
        url = `/api/author/boards?page=${page}&q=${encodeURIComponent(searchQuery)}`
      }

      const res = await fetch(url)
      const json = await res.json()
      if (!json.success) {
        setError(json.error.message)
        setItems([])
        return
      }

      setItems(json.data.items)
      setTotalItems(json.data.pagination.total)
      setTotalPages(json.data.pagination.total_pages)
    } catch {
      setError('Erro ao carregar dados do catálogo.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, searchQuery, currentCareerId, currentDisciplineId])

  // Effect to load items
  useEffect(() => {
    if (!isOpen) return

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    debounceTimer.current = setTimeout(() => {
      fetchItems()
    }, 200)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [isOpen, fetchItems])

  // Handle Tab Switch
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setSearchQuery('')
    setPage(1)
    setShowCreateForm(false)
    setCreateError(null)
  }

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setPage(1)
  }

  // Handle Item Selection (for disciplines/boards)
  const handleSelectItem = (item: CatalogItem) => {
    if (activeTab === 'disciplines') {
      onSelectDiscipline({ id: item.id, name: item.name })
      onClose()
    } else if (activeTab === 'boards') {
      onSelectBoard({ id: item.id, name: item.name })
      onClose()
    }
  }

  // Handle Topic Checkbox Toggle (for Assuntos)
  const handleToggleTopic = (item: CatalogItem) => {
    const isSelected = tempSelectedTopics.some((t) => t.id === item.id)
    if (isSelected) {
      setTempSelectedTopics(tempSelectedTopics.filter((t) => t.id !== item.id))
    } else {
      setTempSelectedTopics([...tempSelectedTopics, { id: item.id, name: item.name, slug: '', subject_id: item.discipline?.id ?? null }])
    }
  }

  // Handle Confirm Assuntos Selection
  const handleConfirmAssuntos = () => {
    const ids = tempSelectedTopics.map((t) => t.id)
    onConfirmTopics(ids, tempSelectedTopics)
    onClose()
  }

  // Handle Creation Form Submission
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    const trimmed = createName.trim()
    if (!trimmed) {
      setCreateError('O nome é obrigatório.')
      return
    }

    setCreating(true)
    try {
      let url = ''
      const payload: { name: string; career_id?: string; discipline_id?: string } = { name: trimmed }

      if (activeTab === 'disciplines') {
        url = '/api/author/disciplines'
        payload.career_id = createCareerId
        if (!createCareerId) {
          setCreateError('A carreira é obrigatória.')
          setCreating(false)
          return
        }
      } else if (activeTab === 'topics') {
        url = '/api/author/topics'
        payload.discipline_id = createDisciplineId
        if (!createDisciplineId) {
          setCreateError('A disciplina é obrigatória.')
          setCreating(false)
          return
        }
      } else {
        url = '/api/author/boards'
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        setCreateError(json.error.message)
        return
      }

      const createdItem = json.data.item
      // Auto-select or add to temp selection
      if (activeTab === 'disciplines') {
        onSelectDiscipline({ id: createdItem.id, name: createdItem.name })
        onClose()
      } else if (activeTab === 'boards') {
        onSelectBoard({ id: createdItem.id, name: createdItem.name })
        onClose()
      } else {
        // If it was already selected, do not duplicate
        if (!tempSelectedTopics.some((t) => t.id === createdItem.id)) {
          setTempSelectedTopics([...tempSelectedTopics, { id: createdItem.id, name: createdItem.name, slug: '', subject_id: createDisciplineId || null }])
        }
        // Refresh items and close create form
        setCreateName('')
        setShowCreateForm(false)
        fetchItems()
      }
    } catch {
      setCreateError('Erro ao realizar o cadastro.')
    } finally {
      setCreating(false)
    }
  }

  // Get active subjects/disciplines to display in topic create dropdown (if we don't have catalog options, we list what is fetched or just use currentDisciplineId)
  // Since we only create subjects for current career, we can fetch disciplines under current career
  const [careerDisciplines, setCareerDisciplines] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    if (isOpen && activeTab === 'topics' && currentCareerId) {
      fetch(`/api/author/disciplines?career_id=${currentCareerId}&page_size=20`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setCareerDisciplines(json.data.items)
          }
        })
        .catch(() => {})
    }
  }, [isOpen, activeTab, currentCareerId])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div 
        className="relative flex flex-col w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)] shadow-2xl transition-all duration-300 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-[var(--ink)]">
            Gerenciar classificações
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--line)] px-2 bg-[var(--surface)]">
          {(['disciplines', 'topics', 'boards'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-3 text-center text-sm font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-[var(--teal)] text-[var(--teal)] font-bold'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {tab === 'disciplines' ? 'Disciplinas' : tab === 'topics' ? 'Assuntos' : 'Bancas'}
            </button>
          ))}
        </div>

        {/* Content Wrapper */}
        <div className="flex flex-col flex-1 p-5 overflow-hidden gap-4">
          
          {/* Search bar & Create action */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-3 flex items-center text-[var(--muted)]">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Pesquisar ${activeTab === 'disciplines' ? 'disciplina' : activeTab === 'topics' ? 'assunto' : 'banca'}...`}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-hidden focus:border-[var(--teal)] focus:ring-1 focus:ring-[var(--teal)]"
              />
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              aria-label="Cadastrar novo item"
              title="Cadastrar novo item"
              className={`flex items-center justify-center p-2 rounded-lg border text-sm transition shrink-0 ${
                showCreateForm 
                  ? 'bg-[var(--warn-bg)] border-[var(--warn)] text-[var(--warn)]' 
                  : 'bg-[var(--teal)] border-[var(--teal)] text-white hover:opacity-90'
              }`}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Creation Form Block (collapsible) */}
          {showCreateForm && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Cadastrar {activeTab === 'disciplines' ? 'Disciplina' : activeTab === 'topics' ? 'Assunto' : 'Banca'}
              </h3>
              
              <div className="flex flex-col gap-1">
                <label htmlFor="create-name" className="text-xs font-semibold text-[var(--ink)]">
                  Nome
                </label>
                <input
                  id="create-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder={`Digite o nome...`}
                  className="px-3 py-2 text-sm rounded-md border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-hidden focus:border-[var(--teal)]"
                  required
                />
              </div>

              {/* If creating discipline, Career is required */}
              {activeTab === 'disciplines' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="create-career" className="text-xs font-semibold text-[var(--ink)]">
                    Carreira
                  </label>
                  <select
                    id="create-career"
                    value={createCareerId}
                    onChange={(e) => setCreateCareerId(e.target.value)}
                    className="px-3 py-2 text-sm rounded-md border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-hidden focus:border-[var(--teal)]"
                    required
                  >
                    <option value="">Selecione a Carreira</option>
                    {careers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If creating topic (Assunto), Discipline is required */}
              {activeTab === 'topics' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="create-discipline" className="text-xs font-semibold text-[var(--ink)]">
                    Disciplina
                  </label>
                  <select
                    id="create-discipline"
                    value={createDisciplineId}
                    onChange={(e) => setCreateDisciplineId(e.target.value)}
                    className="px-3 py-2 text-sm rounded-md border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] focus:outline-hidden focus:border-[var(--teal)]"
                    required
                  >
                    <option value="">Selecione a Disciplina</option>
                    {careerDisciplines.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {createError && (
                <p className="text-xs text-[var(--danger)] font-semibold">{createError}</p>
              )}

              <div className="flex gap-2 justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateError(null)
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--line)] hover:bg-[var(--surface)] text-[var(--ink)] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-1.5 text-xs font-semibold rounded-md bg-[var(--teal)] text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1 transition"
                >
                  {creating && <Loader2 size={12} className="animate-spin" />}
                  Cadastrar e Selecionar
                </button>
              </div>
            </form>
          )}

          {/* List Section */}
          <div className="flex-1 flex flex-col overflow-hidden border border-[var(--line)] rounded-xl relative min-h-64 h-72">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--paper)]/80 z-10">
                <Loader2 size={24} className="animate-spin text-[var(--teal)]" />
              </div>
            ) : null}

            {error ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm font-semibold text-[var(--danger)]">{error}</p>
                <button onClick={fetchItems} className="mt-2 text-xs font-bold text-[var(--teal)] underline hover:opacity-80">
                  Tentar novamente
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-sm text-[var(--muted)]">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <ul className="flex-1 overflow-y-auto divide-y divide-[var(--line)] bg-[var(--paper)]" data-testid="catalog-items-list">
                {items.map((item) => {
                  const isTopic = activeTab === 'topics'
                  const isChecked = isTopic && tempSelectedTopics.some((t) => t.id === item.id)

                  return (
                    <li
                      key={item.id}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-[var(--surface)] transition ${
                        isChecked ? 'bg-[var(--teal)]/5' : ''
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-sm font-semibold text-[var(--ink)] truncate">
                          {item.name}
                        </span>
                        
                        {/* Context label */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--muted)] mt-0.5">
                          {activeTab === 'disciplines' && item.career && (
                            <span>{item.career.name}</span>
                          )}
                          {activeTab === 'topics' && (
                            <span>{item.discipline?.name ?? 'Sem disciplina'}</span>
                          )}
                          <span className="text-[var(--line)]">•</span>
                          <span>Por: {item.created_by.label}</span>
                        </div>
                      </div>

                      {/* Selection Action */}
                      <div className="shrink-0">
                        {isTopic ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleTopic(item)}
                            className="w-4 h-4 rounded-sm border-[var(--line)] text-[var(--teal)] focus:ring-[var(--teal)] cursor-pointer"
                            aria-label={`Selecionar assunto ${item.name}`}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectItem(item)}
                            className="px-3 py-1.5 text-xs font-bold rounded-md border border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)] hover:text-white transition"
                          >
                            Selecionar
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Pagination and Multi-confirm */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-[var(--line)] pt-3">
            
            {/* Pagination controls */}
            {totalPages > 1 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 rounded-md border border-[var(--line)] hover:bg-[var(--surface)] disabled:opacity-50 transition"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Pág. {page} de {totalPages} ({totalItems} total)
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 rounded-md border border-[var(--line)] hover:bg-[var(--surface)] disabled:opacity-50 transition"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <span className="text-xs font-semibold text-[var(--muted)]">
                Total: {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            )}

            {/* Confirm button for topics (Assuntos) */}
            {activeTab === 'topics' && (
              <button
                type="button"
                onClick={handleConfirmAssuntos}
                className="w-full sm:w-auto px-4 py-2 text-sm font-bold rounded-lg bg-[var(--teal)] text-white hover:opacity-90 flex items-center justify-center gap-1.5 transition"
              >
                <Check size={16} />
                Confirmar Assuntos ({tempSelectedTopics.length})
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
