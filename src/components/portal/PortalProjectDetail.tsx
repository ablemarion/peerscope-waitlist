import { useState, useEffect, useCallback } from 'react'
import { portalFetch } from '../../lib/portalApi'

interface CompetitorTargetRow {
  id: string
  project_id: string
  domain: string
  name: string
  track_pricing: number
  track_jobs: number
  track_reviews: number
  track_features: number
}

interface ProjectRow {
  id: string
  agency_id: string
  client_id: string
  name: string
  description: string | null
  created_at: string
}

function TrackBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        active
          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200'
          : 'bg-gray-100 text-gray-400 line-through'
      }`}
    >
      {label}
    </span>
  )
}

interface DeleteButtonProps {
  onConfirm: () => Promise<void>
}

function DeleteButton({ onConfirm }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    setBusy(true)
    await onConfirm()
    setBusy(false)
    setConfirming(false)
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={() => setConfirming(false)}
          className="px-2.5 py-1 rounded text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => void handleConfirm()}
          disabled={busy}
          className="px-2.5 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {busy ? 'Removing…' : 'Remove'}
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      aria-label="Remove competitor"
      title="Remove competitor"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.7 8h5.6l.7-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

interface AddCompetitorFormProps {
  projectId: string
  onAdded: () => void
}

const TRACK_FIELDS = [
  { key: 'trackPricing', label: 'Pricing' },
  { key: 'trackJobs', label: 'Jobs' },
  { key: 'trackReviews', label: 'Reviews' },
  { key: 'trackFeatures', label: 'Features' },
] as const

type TrackKey = (typeof TRACK_FIELDS)[number]['key']

function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

function isValidDomain(value: string): boolean {
  // Basic check: at least one dot, no spaces, no protocol
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
}

function AddCompetitorForm({ projectId, onAdded }: AddCompetitorFormProps) {
  const [open, setOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  const [tracks, setTracks] = useState<Record<TrackKey, boolean>>({
    trackPricing: true,
    trackJobs: true,
    trackReviews: true,
    trackFeatures: true,
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function toggleTrack(key: TrackKey) {
    setTracks((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanDomain = stripProtocol(domain.trim())
    if (!cleanDomain) {
      setError('Domain is required.')
      return
    }
    if (!isValidDomain(cleanDomain)) {
      setError('Enter a valid domain, e.g. competitor.com')
      return
    }
    if (!name.trim()) {
      setError('Display name is required.')
      return
    }

    setBusy(true)
    try {
      const res = await portalFetch('/api/portal/competitor-targets', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          domain: cleanDomain,
          name: name.trim(),
          ...tracks,
        }),
      })
      const json = await res.json() as { data: unknown; error: string | null }
      if (!res.ok || json.error) {
        setError(json.error ?? 'Failed to add competitor.')
        return
      }
      setDomain('')
      setName('')
      setTracks({ trackPricing: true, trackJobs: true, trackReviews: true, trackFeatures: true })
      setOpen(false)
      onAdded()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Add competitor
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3"
      noValidate
    >
      <p className="text-sm font-medium text-gray-800">Add competitor</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="ct-domain" className="block text-xs font-medium text-gray-600 mb-1">
            Domain <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="ct-domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="competitor.com"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="ct-name" className="block text-xs font-medium text-gray-600 mb-1">
            Display name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="ct-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Competitor Inc."
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-gray-600 mb-2">Track</legend>
        <div className="flex flex-wrap gap-3">
          {TRACK_FIELDS.map(({ key, label }) => (
            <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tracks[key]}
                onChange={() => toggleTrack(key)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? 'Adding…' : 'Add competitor'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface Props {
  projectId: string
}

export function PortalProjectDetail({ projectId }: Props) {
  const [project, setProject] = useState<ProjectRow | null>(null)
  const [targets, setTargets] = useState<CompetitorTargetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [projectRes, targetsRes] = await Promise.all([
        portalFetch(`/api/portal/projects/${projectId}`),
        portalFetch(`/api/portal/competitor-targets?projectId=${projectId}`),
      ])

      const [projectJson, targetsJson] = await Promise.all([
        projectRes.json() as Promise<{ data: ProjectRow | null; error: string | null }>,
        targetsRes.json() as Promise<{ data: CompetitorTargetRow[] | null; error: string | null }>,
      ])

      if (!projectRes.ok || projectJson.error) {
        throw new Error(projectJson.error ?? 'Project not found')
      }

      setProject(projectJson.data)
      setTargets(targetsJson.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void loadData() }, [loadData])

  async function handleDelete(targetId: string) {
    const res = await portalFetch(`/api/portal/competitor-targets/${targetId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setTargets((prev) => prev.filter((t) => t.id !== targetId))
    }
  }

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
          <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm font-medium text-gray-700">{error}</p>
          <button
            onClick={() => void loadData()}
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

          {/* Competitors panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Competitors</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {targets.length === 0
                    ? 'No competitors tracked yet.'
                    : `${targets.length} competitor${targets.length !== 1 ? 's' : ''} tracked`}
                </p>
              </div>
            </div>

            {/* Competitor rows */}
            {targets.length > 0 && (
              <ul className="divide-y divide-gray-100" role="list" aria-label="Tracked competitors">
                {targets.map((target) => (
                  <li key={target.id} className="px-5 py-3.5 flex items-center gap-3 group">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">{target.name}</span>
                        <span className="text-xs text-gray-400 truncate">{target.domain}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <TrackBadge label="Pricing" active={target.track_pricing === 1} />
                        <TrackBadge label="Jobs" active={target.track_jobs === 1} />
                        <TrackBadge label="Reviews" active={target.track_reviews === 1} />
                        <TrackBadge label="Features" active={target.track_features === 1} />
                      </div>
                    </div>
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <DeleteButton onConfirm={() => handleDelete(target.id)} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Add form */}
            <div className="px-5 py-4 border-t border-gray-100">
              <AddCompetitorForm projectId={projectId} onAdded={() => void loadData()} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
