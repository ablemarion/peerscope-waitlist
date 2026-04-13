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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <StatCard label="Pending Invites" value="—" trend="Coming soon" />
      </div>

      {stats.clientCount === 0 && stats.projectCount === 0 && stats.reportCount === 0 && !loading ? (
        <GettingStarted onAddClient={() => { window.history.pushState({}, '', '/portal/clients'); window.dispatchEvent(new PopStateEvent('popstate')) }} />
      ) : (
        <>
          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAction
                icon={
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="#6366f1" strokeWidth="1.5" fill="none" />
                    <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <path d="M14 4v6M11 7h6" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
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
                    <rect x="3" y="2" width="14" height="16" rx="2" stroke="#6366f1" strokeWidth="1.5" fill="none" />
                    <path d="M7 7h6M7 10h6M7 13h4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
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
                    <path d="M10 2v10M7 9l3 3 3-3" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 14v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" />
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Let's set up your first client</h3>
      <p className="text-xs text-gray-500 mb-6">Follow these steps to start generating intelligence reports.</p>
      <div className="space-y-5">
        {/* Step 1 - active */}
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5">1</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Add a client</p>
            <p className="text-xs text-gray-500 mt-0.5">Add your client and invite them to their own view.</p>
            <button onClick={onAddClient} className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors">Add your first client →</button>
          </div>
        </div>
        {/* Step 2 - pending */}
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0 mt-0.5">2</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400">Create a project</p>
            <p className="text-xs text-gray-400 mt-0.5">Define which competitors to track for this client.</p>
          </div>
        </div>
        {/* Step 3 - pending */}
        <div className="flex items-start gap-4">
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-semibold flex-shrink-0 mt-0.5">3</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400">Generate a report</p>
            <p className="text-xs text-gray-400 mt-0.5">Run competitive analysis and share it directly.</p>
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
      className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all duration-150 text-left group"
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{label}</p>
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
