import { useState, useEffect } from 'react'
import { portalFetch } from '../../lib/portalApi'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  loading?: boolean
}

function StatCard({ label, value, trend, trendUp, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 border-l-2 border-l-[#B8622A]/40 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-8 bg-gray-200 rounded w-12 animate-pulse" />
      ) : (
        <p className="mt-1.5 text-2xl font-semibold text-gray-900">
          {typeof value === 'number' && value === 0 ? '—' : value}
        </p>
      )}
      {trend && !loading && (
        <p className={`mt-1 text-xs ${trendUp ? 'text-emerald-600' : 'text-gray-400'}`}>
          {trend}
        </p>
      )}
    </div>
  )
}

interface DashboardStats {
  clientCount: number
  projectCount: number
  reportCount: number
}

export function PortalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({ clientCount: 0, projectCount: 0, reportCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [clientsRes, projectsRes, reportsRes] = await Promise.all([
          portalFetch('/api/portal/clients'),
          portalFetch('/api/portal/projects'),
          portalFetch('/api/portal/reports'),
        ])
        const [clientsJson, projectsJson, reportsJson] = await Promise.all([
          clientsRes.json() as Promise<{ data: unknown[] | null }>,
          projectsRes.json() as Promise<{ data: unknown[] | null }>,
          reportsRes.json() as Promise<{ data: unknown[] | null }>,
        ])
        setStats({
          clientCount: clientsJson.data?.length ?? 0,
          projectCount: projectsJson.data?.length ?? 0,
          reportCount: reportsJson.data?.length ?? 0,
        })
      } catch {
        // Non-critical — leave at 0
      } finally {
        setLoading(false)
      }
    }
    void loadStats()
  }, [])

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back. Here's what's happening across your clients.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Clients"
          value={stats.clientCount}
          trend={stats.clientCount === 0 ? 'No clients yet' : undefined}
          loading={loading}
        />
        <StatCard
          label="Active Projects"
          value={stats.projectCount}
          trend={stats.projectCount === 0 ? 'No projects yet' : undefined}
          loading={loading}
        />
        <StatCard
          label="Reports Generated"
          value={stats.reportCount}
          trend={stats.reportCount === 0 ? 'Get started below' : undefined}
          loading={loading}
        />
      </div>

      {stats.clientCount === 0 && stats.projectCount === 0 && stats.reportCount === 0 && !loading ? (
        <GettingStarted onAddClient={() => { window.history.pushState({}, '', '/portal/clients'); window.dispatchEvent(new PopStateEvent('popstate')) }} />
      ) : (
        <>
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 border-l-2 border-l-[#B8622A]/40 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAction
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
                    <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M14 4v6M11 7h6" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
                label="Invite a Client"
                description="Add a new client to your portal"
                onClick={() => {
                  window.history.pushState({}, '', '/portal/clients')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              />
              <QuickAction
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#F59E0B" strokeWidth="1.5" fill="none" />
                    <path d="M7 7h6M7 10h6M7 13h4" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
                label="New Project"
                description="Set up competitor tracking for a client"
                onClick={() => {
                  window.history.pushState({}, '', '/portal/projects')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              />
              <QuickAction
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2v10M7 9l3 3 3-3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                }
                label="Generate Report"
                description="Export competitive intelligence for a client"
                onClick={() => {
                  window.history.pushState({}, '', '/portal/projects')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
              />
            </div>
          </div>

          {/* Recent activity — empty state */}
          <div className="bg-white rounded-xl border border-gray-200 border-l-2 border-l-[#B8622A]/40 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <EmptyState
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300">
                  <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M16 9v7l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
              title="No activity yet"
              description="Reports generated, clients added, and projects created will appear here."
            />
          </div>
        </>
      )}
    </div>
  )
}

function GettingStarted({ onAddClient }: { onAddClient: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Hero band */}
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center border-b border-gray-100 bg-gradient-to-b from-[#B8622A]/5 to-white">
        {/* Peerscope scope icon */}
        <div className="mb-4 relative">
          <div className="w-14 h-14 rounded-full bg-[#B8622A]/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="7.5" stroke="#B8622A" strokeWidth="1.5" fill="none" />
              <circle cx="12" cy="12" r="3" fill="#B8622A" fillOpacity="0.35" />
              <path d="M17.5 17.5L24 24" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 4.5V6M12 18v1.5M4.5 12H6M18 12h1.5" stroke="#B8622A" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full ring-4 ring-[#B8622A]/10 animate-ping [animation-duration:2.5s]" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Add your first client to get started</h3>
        <p className="text-xs text-gray-500 max-w-xs">Each client gets their own competitive intelligence report.</p>
        <button
          onClick={onAddClient}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] active:bg-[#8A4820] transition-colors shadow-sm"
        >
          Add client
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Steps */}
      <div className="px-6 py-5 space-y-4">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">How it works</p>
        <div className="space-y-4">
          {/* Step 1 - active */}
          <div className="flex items-start gap-3.5">
            <div className="w-5 h-5 rounded-full bg-[#B8622A] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add a client</p>
              <p className="text-xs text-gray-500 mt-0.5">Invite them to their own read-only portal view.</p>
            </div>
          </div>
          {/* Step 2 - pending */}
          <div className="flex items-start gap-3.5">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
            <div>
              <p className="text-sm font-medium text-gray-400">Track competitors</p>
              <p className="text-xs text-gray-400 mt-0.5">Define which competitors to watch for each client.</p>
            </div>
          </div>
          {/* Step 3 - pending */}
          <div className="flex items-start gap-3.5">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
            <div>
              <p className="text-sm font-medium text-gray-400">Receive weekly reports</p>
              <p className="text-xs text-gray-400 mt-0.5">Intelligence reports land every Monday at 6am.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickAction({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-[#B8622A]/30 hover:bg-[#B8622A]/5 transition-all duration-150 text-left group"
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-[#B8622A]">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
