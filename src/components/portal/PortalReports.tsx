import { useState, useEffect, useCallback } from 'react'
import { EmptyState } from './PortalDashboard'
import { portalFetch } from '../../lib/portalApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportRow {
  id: string
  project_id: string
  agency_id: string
  title: string
  status: 'draft' | 'published'
  r2_key: string | null
  generated_at: string | null
  published_at: string | null
  created_at: string
}

interface TrackingField {
  status: 'pending_crawl' | 'populated'
  data: unknown | null
}

interface CompetitorInSnapshot {
  domain: string
  name: string
  tracking: {
    pricing: boolean
    jobs: boolean
    reviews: boolean
    features: boolean
  }
  pricing: TrackingField | null
  jobs: TrackingField | null
  reviews: TrackingField | null
  features: TrackingField | null
}

interface ReportSnapshot {
  reportId: string
  projectId: string
  projectName: string
  generatedAt: string
  competitors: CompetitorInSnapshot[]
  status: 'draft' | 'published'
}

interface ReportWithSnapshot extends ReportRow {
  snapshot: ReportSnapshot | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
          <div className="h-5 w-16 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Draft
    </span>
  )
}

// ─── Competitor card ──────────────────────────────────────────────────────────

function TrackingCell({ field, label }: { field: TrackingField | null; label: string }) {
  if (!field) {
    return (
      <div className="text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <span className="text-xs text-gray-300">—</span>
      </div>
    )
  }

  if (field.status === 'pending_crawl') {
    return (
      <div className="text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <div className="mx-auto h-3 bg-gray-200 rounded animate-pulse w-12" />
        <p className="text-[10px] text-gray-400 mt-0.5">Crawling…</p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Ready
      </span>
    </div>
  )
}

function CompetitorCard({ competitor }: { competitor: CompetitorInSnapshot }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{competitor.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{competitor.domain}</p>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
          {competitor.name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <TrackingCell field={competitor.pricing} label="Pricing" />
        <TrackingCell field={competitor.jobs} label="Jobs" />
        <TrackingCell field={competitor.reviews} label="Reviews" />
        <TrackingCell field={competitor.features} label="Features" />
      </div>
    </div>
  )
}

// ─── Report detail view ───────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-1/3" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-28" />
        ))}
      </div>
    </div>
  )
}

interface PublishButtonProps {
  reportId: string
  onPublished: () => void
}

function PublishButton({ reportId, onPublished }: PublishButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handlePublish() {
    setState('loading')
    try {
      const res = await portalFetch(`/api/portal/reports/${reportId}/publish`, {
        method: 'PATCH',
      })
      if (!res.ok) throw new Error('Failed')
      setState('done')
      onPublished()
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Published
      </span>
    )
  }

  return (
    <button
      onClick={handlePublish}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 10" />
          </svg>
          Publishing…
        </>
      ) : state === 'error' ? (
        'Failed — retry?'
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Publish Report
        </>
      )}
    </button>
  )
}

interface ReportDetailProps {
  report: ReportRow
  onBack: () => void
}

function ReportDetail({ report, onBack }: ReportDetailProps) {
  const [detail, setDetail] = useState<ReportWithSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState(report.status)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await portalFetch(`/api/portal/reports/${report.id}`)
        const json = await res.json() as { data: ReportWithSnapshot | null; error: string | null }
        if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load report')
        setDetail(json.data)
        setCurrentStatus(json.data?.status ?? report.status)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [report.id, report.status])

  const competitors = detail?.snapshot?.competitors ?? []

  return (
    <div className="max-w-5xl space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="mt-0.5 flex-shrink-0 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{report.title}</h2>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Generated {formatDate(report.generated_at)}
            {report.published_at ? ` · Published ${formatDate(report.published_at)}` : ''}
          </p>
        </div>
        {/* Publish button — only for draft reports */}
        {currentStatus === 'draft' && !loading && (
          <div className="flex-shrink-0">
            <PublishButton
              reportId={report.id}
              onPublished={() => setCurrentStatus('published')}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Failed to load report</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300 mb-3">
              <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M10 16h12M16 10v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium text-gray-700">No competitor data</p>
            <p className="text-xs text-gray-400 mt-1">
              No competitor targets were tracked when this report was generated.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                {competitors.length} competitor{competitors.length !== 1 ? 's' : ''} tracked
              </p>
              {detail?.snapshot?.projectName && (
                <p className="text-xs text-gray-400">{detail.snapshot.projectName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {competitors.map((c) => (
                <CompetitorCard key={c.domain} competitor={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Report list ──────────────────────────────────────────────────────────────

export function PortalReports() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await portalFetch('/api/portal/reports')
      const json = await res.json() as { data: ReportRow[] | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load reports')
      setReports(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadReports() }, [loadReports])

  if (selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    )
  }

  return (
    <div className="max-w-5xl space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Generated competitive intelligence reports for your clients.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-[1fr_130px_130px_90px] gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <span>Report</span>
            <span>Generated</span>
            <span>Published</span>
            <span>Status</span>
          </div>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Failed to load reports</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button
              onClick={() => void loadReports()}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300">
                <rect x="4" y="3" width="24" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="No reports yet"
            description="Reports will appear here after you generate them from a project."
            action={
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/portal/projects')
                  window.dispatchEvent(new PopStateEvent('popstate'))
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150"
              >
                Go to Projects
              </button>
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className="w-full grid grid-cols-[1fr_130px_130px_90px] gap-4 items-center px-5 py-4 hover:bg-gray-50 transition-colors duration-100 text-left"
              >
                <span className="text-sm font-medium text-gray-900 truncate">{report.title}</span>
                <span className="text-xs text-gray-500">{formatDate(report.generated_at)}</span>
                <span className="text-xs text-gray-500">{formatDate(report.published_at)}</span>
                <StatusBadge status={report.status} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
