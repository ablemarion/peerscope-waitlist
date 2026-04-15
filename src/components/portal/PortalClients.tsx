import { useState, useEffect, useCallback, useRef } from 'react'
import { EmptyState } from './PortalDashboard'
import { portalFetch } from '../../lib/portalApi'

interface ClientRow {
  id: string
  agency_id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  created_at: string
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

interface AddClientModalProps {
  onClose: () => void
  onCreated: (client: ClientRow) => void
}

function AddClientModal({ onClose, onCreated }: AddClientModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName) { setFieldError('Client name is required.'); return }
    if (!trimmedEmail) { setFieldError('Contact email is required.'); return }

    setSubmitting(true)
    try {
      const res = await portalFetch('/api/portal/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
      })
      const json = await res.json() as { data: ClientRow | null; error: string | null }
      if (!res.ok || json.error) {
        setFieldError(json.error ?? 'Failed to create client.')
        return
      }
      onCreated(json.data!)
    } catch {
      setFieldError('Network error — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-client-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 id="add-client-title" className="text-base font-semibold text-gray-900">Add Client</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-xs font-medium text-gray-700 mb-1.5">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
              maxLength={100}
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8622A]/30 focus:border-[#B8622A] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label htmlFor="client-email" className="block text-xs font-medium text-gray-700 mb-1.5">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              id="client-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. hello@acmecorp.com"
              required
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B8622A]/30 focus:border-[#B8622A] placeholder:text-gray-400"
            />
          </div>

          {fieldError && (
            <p role="alert" className="text-xs text-red-600">{fieldError}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 10" />
                  </svg>
                  Adding…
                </>
              ) : (
                'Add Client'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-lg"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-emerald-400 flex-shrink-0">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" fill="none" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  )
}

function StatusBadge({ status }: { status: 'active' | 'inactive' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Inactive
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
          <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

interface InviteButtonProps {
  clientId: string
}

function InviteButton({ clientId }: InviteButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleInvite() {
    setState('loading')
    try {
      const res = await portalFetch(`/api/portal/clients/${clientId}/invite`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed')
      setState('sent')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 3000)
  }

  if (state === 'sent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Invite sent
      </span>
    )
  }

  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-600 font-medium">
        Failed — retry?
      </span>
    )
  }

  return (
    <button
      onClick={handleInvite}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#B8622A]/8 text-[#B8622A] border border-[#B8622A]/20 hover:bg-[#B8622A]/15 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <>
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
          </svg>
          Sending…
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6h8M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Invite Client
        </>
      )}
    </button>
  )
}

function navigate(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function PortalClients() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await portalFetch('/api/portal/clients')
      const json = await res.json() as { data: ClientRow[] | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load clients')
      setClients(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadClients() }, [loadClients])

  function handleClientCreated(client: ClientRow) {
    setClients((prev) => [client, ...prev])
    setShowModal(false)
    setToast(`${client.name} added successfully.`)
  }

  return (
    <div className="max-w-5xl space-y-5">
      {showModal && (
        <AddClientModal
          onClose={() => setShowModal(false)}
          onCreated={handleClientCreated}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your agency clients and their portal access.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Client</span>
            <span>Email</span>
            <span>Status</span>
            <span>Competitors</span>
            <span>Action</span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Failed to load clients</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button
              onClick={() => void loadClients()}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300">
                <circle cx="16" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M5 28c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <path d="M22 8v6M19 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="No clients yet"
            description="Add your first client and send them a portal invite to get started."
            action={
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add Your First Client
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {clients.map((client) => (
              <div key={client.id} className="grid grid-cols-[1fr_1fr_120px_120px_120px] gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-100">
                {/* Client name + avatar */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#B8622A]/15 flex items-center justify-center text-[#B8622A] text-xs font-semibold flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate">{client.name}</span>
                </div>
                {/* Email */}
                <span className="text-sm text-gray-500 truncate">{client.email}</span>
                {/* Status badge */}
                <StatusBadge status={client.status} />
                {/* Competitors link */}
                <button
                  onClick={() => navigate(`/portal/clients/${client.id}/competitors`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:border-[#B8622A]/40 hover:text-[#B8622A] hover:bg-[#B8622A]/5 transition-colors duration-150"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    <circle cx="6" cy="6" r="0.75" fill="currentColor" />
                  </svg>
                  Competitors
                </button>
                {/* Invite action */}
                <InviteButton clientId={client.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
