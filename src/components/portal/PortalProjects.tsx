import { useState, useEffect, useCallback } from 'react'
import { EmptyState } from './PortalDashboard'
import { portalFetch } from '../../lib/portalApi'

interface ProjectRow {
  id: string
  agency_id: string
  client_id: string
  name: string
  description: string | null
  created_at: string
}

interface ClientRow {
  id: string
  name: string
}

interface ReportRow {
  id: string
  project_id: string
  generated_at: string | null
}

interface ProjectCardSkeleton_Props { _?: never }

function ProjectCardSkeleton(_: ProjectCardSkeleton_Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-6 w-10 bg-gray-200 rounded" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-24 mb-4" />
      <div className="h-8 bg-gray-200 rounded-lg" />
    </div>
  )
}

function GenerateReportButton({ projectId }: { projectId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleGenerate() {
    setState('loading')
    try {
      const res = await portalFetch('/api/portal/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ projectId }),
      })
      if (!res.ok) throw new Error('Failed')
      setState('done')
    } catch {
      setState('error')
    }
    setTimeout(() => setState('idle'), 4000)
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium justify-center py-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Report queued
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium justify-center py-2">
        Failed to generate — retry?
      </div>
    )
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={state === 'loading'}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {state === 'loading' ? (
        <>
          <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
          </svg>
          Generating…
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 10h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Generate Report
        </>
      )}
    </button>
  )
}

interface ProjectCardProps {
  project: ProjectRow
  clientName: string
  lastReportAt: string | null
}

function ProjectCard({ project, clientName, lastReportAt }: ProjectCardProps) {
  function navigate(path: string) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all duration-150 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            <span className="text-gray-400">Client:</span> {clientName}
          </p>
        </div>
        <button
          onClick={() => navigate(`/portal/projects/${project.id}`)}
          className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
          aria-label={`Manage competitors for ${project.name}`}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <circle cx="5.5" cy="5.5" r="1" fill="currentColor" />
            <circle cx="1.5" cy="5.5" r="1" fill="currentColor" />
            <circle cx="9.5" cy="5.5" r="1" fill="currentColor" />
          </svg>
          Manage
        </button>
      </div>

      {/* Last report */}
      <p className="text-xs text-gray-400">
        {lastReportAt
          ? `Last report: ${new Date(lastReportAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'No reports generated yet'}
      </p>

      {/* CTA */}
      <GenerateReportButton projectId={project.id} />
    </div>
  )
}

export function PortalProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [clientMap, setClientMap] = useState<Record<string, string>>({})
  const [lastReportMap, setLastReportMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectsRes, clientsRes, reportsRes] = await Promise.all([
        portalFetch('/api/portal/projects'),
        portalFetch('/api/portal/clients'),
        portalFetch('/api/portal/reports'),
      ])

      const [projectsJson, clientsJson, reportsJson] = await Promise.all([
        projectsRes.json() as Promise<{ data: ProjectRow[] | null; error: string | null }>,
        clientsRes.json() as Promise<{ data: ClientRow[] | null; error: string | null }>,
        reportsRes.json() as Promise<{ data: ReportRow[] | null; error: string | null }>,
      ])

      if (!projectsRes.ok || projectsJson.error) throw new Error(projectsJson.error ?? 'Failed to load projects')

      setProjects(projectsJson.data ?? [])

      // Build client name lookup
      const cm: Record<string, string> = {}
      for (const c of clientsJson.data ?? []) {
        cm[c.id] = c.name
      }
      setClientMap(cm)

      // Build last-report-per-project lookup
      const rm: Record<string, string> = {}
      for (const r of reportsJson.data ?? []) {
        if (r.generated_at) {
          const existing = rm[r.project_id]
          if (!existing || r.generated_at > existing) {
            rm[r.project_id] = r.generated_at
          }
        }
      }
      setLastReportMap(rm)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  return (
    <div className="max-w-5xl space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage competitive tracking projects for your clients.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          New Project
        </button>
      </div>

      {/* Card grid or states */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <ProjectCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-gray-700">Failed to load projects</p>
          <p className="text-xs text-gray-400 mt-1">{error}</p>
          <button
            onClick={() => void loadData()}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-gray-300">
                <rect x="4" y="3" width="24" height="26" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="23" cy="23" r="5" fill="white" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 23h4M23 21v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
            title="No projects yet"
            description="Create a project to start tracking competitors for a client. Each project maps to one client's competitive landscape."
            action={
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors duration-150">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Create First Project
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientName={clientMap[project.client_id] ?? 'Unknown client'}
              lastReportAt={lastReportMap[project.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}
