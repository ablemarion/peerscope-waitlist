import { useEffect, useState } from 'react'
import { Logo } from '../shared'
import { EmptyState } from './PortalDashboard'

interface Report {
  id: string
  title: string
  generated_at: string | null
  clientName?: string
}

interface ClientSession {
  agencyName?: string
  agencyLogoUrl?: string
  agencyColour?: string
  clientName?: string
}

function parseSession(): ClientSession {
  try {
    const raw = localStorage.getItem('peerscope_portal_jwt')
    if (!raw) return {}
    // JWT payload is base64url-encoded in the second segment
    const parts = raw.split('.')
    if (parts.length < 2) return {}
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>
    return {
      agencyName: typeof payload.agencyName === 'string' ? payload.agencyName : undefined,
      agencyLogoUrl: typeof payload.agencyLogoUrl === 'string' ? payload.agencyLogoUrl : undefined,
      agencyColour: typeof payload.agencyColour === 'string' ? payload.agencyColour : undefined,
      clientName: typeof payload.clientName === 'string' ? payload.clientName : undefined,
    }
  } catch {
    return {}
  }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function ClientPortal() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const session = parseSession()

  const accentColour = session.agencyColour ?? '#F59E0B'

  useEffect(() => {
    async function fetchReports() {
      try {
        const token = localStorage.getItem('peerscope_portal_jwt') ?? ''
        const res = await fetch('/api/portal/reports?publishedOnly=true', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`Failed to load reports (${res.status})`)
        const data = await res.json() as { data: Report[] | null }
        setReports(data.data ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load reports.')
      } finally {
        setLoading(false)
      }
    }

    void fetchReports()
  }, [])

  function viewReport(reportId: string) {
    window.history.pushState({}, '', `/portal/reports/${reportId}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Agency-branded header */}
      <header
        className="bg-[#0D0F1A] border-b border-white/5"
        style={{ borderBottomColor: `${accentColour}22` }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          {/* Agency logo or Peerscope fallback */}
          {session.agencyLogoUrl ? (
            <img
              src={session.agencyLogoUrl}
              alt={session.agencyName ?? 'Agency'}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <Logo dark />
          )}

          {session.agencyName && (
            <>
              <span className="text-white/20 text-sm">·</span>
              <span className="text-sm text-white/60 font-medium">{session.agencyName}</span>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white/80"
              style={{ backgroundColor: `${accentColour}22`, color: accentColour }}
            >
              Client Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {session.clientName ? `Welcome, ${session.clientName}` : 'Your Reports'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your competitive intelligence reports are ready to review.
          </p>
        </div>

        {/* Reports list */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#B8622A]/20 border-t-[#F07C35] animate-spin" />
            <p className="text-sm text-gray-400">Loading your reports…</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-xl border border-red-100 p-6 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <p className="text-xs text-gray-400 mt-1">Please refresh the page or contact support if this persists.</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 py-16">
            <EmptyState
              icon={
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300">
                  <rect x="4" y="3" width="24" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              }
              title="No reports yet"
              description="Your agency is preparing your competitive intelligence reports. Check back soon."
            />
          </div>
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((report) => (
              <article
                key={report.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-[#B8622A]/30 hover:shadow-sm transition-all duration-150"
              >
                {/* Report icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${accentColour}15` }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="1" width="14" height="16" rx="2" stroke={accentColour} strokeWidth="1.5" fill="none" />
                    <path d="M5 6h8M5 9h8M5 12h5" stroke={accentColour} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {report.generated_at ? `Generated ${formatDate(report.generated_at)}` : ''}
                    {report.clientName && ` · ${report.clientName}`}
                  </p>
                </div>

                {/* CTA */}
                <button
                  onClick={() => viewReport(report.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{ backgroundColor: accentColour, '--tw-ring-color': accentColour } as React.CSSProperties}
                  aria-label={`View report: ${report.title}`}
                >
                  View Report
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Powered-by footer */}
      <footer className="max-w-4xl mx-auto px-4 sm:px-6 pb-8 mt-12 text-center">
        <p className="text-xs text-gray-300">
          Powered by{' '}
          <span className="text-gray-400 font-medium">Peerscope</span>
        </p>
      </footer>
    </div>
  )
}
