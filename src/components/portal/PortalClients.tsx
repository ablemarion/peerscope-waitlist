import { useState, useEffect, useCallback } from 'react'
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

export function PortalClients() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="max-w-5xl space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage your agency clients and their portal access.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors duration-150">
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
          <div className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Client</span>
            <span>Email</span>
            <span>Status</span>
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
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors duration-150">
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
              <div key={client.id} className="grid grid-cols-[1fr_1fr_120px_120px] gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-100">
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
