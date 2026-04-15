import { useState, useEffect, useCallback } from 'react'
import { portalFetch } from '../../lib/portalApi'
import { CompetitorManager } from './CompetitorManager'

interface ProjectRow {
  id: string
  agency_id: string
  client_id: string
  name: string
  description: string | null
  created_at: string
}

interface Props {
  projectId: string
}

export function PortalProjectDetail({ projectId }: Props) {
  const [project, setProject] = useState<ProjectRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProject = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await portalFetch(`/api/portal/projects/${projectId}`)
      const json = (await res.json()) as { data: ProjectRow | null; error: string | null }
      if (!res.ok || json.error) {
        throw new Error(json.error ?? 'Project not found')
      }
      setProject(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void loadProject() }, [loadProject])

  function goBack() {
    window.history.pushState({}, '', '/portal/projects')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Back nav */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Back to projects"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Projects
      </button>

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-[#B8622A]/20 border-t-[#F07C35] animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">{error}</p>
          <button
            onClick={() => void loadProject()}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && project && (
        <>
          {/* Page header */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
            )}
          </div>

          {/* Competitor management */}
          <CompetitorManager projectId={projectId} projectName={project.name} />
        </>
      )}
    </div>
  )
}
