import { useState, useEffect, useCallback } from 'react'
import { portalFetch } from '../../lib/portalApi'

interface CompetitorRow {
  id: string
  project_id: string
  name: string
  homepage_url: string | null
  domain: string
  notes: string | null
}

interface ProjectRow {
  id: string
  name: string
  client_id: string
}

interface ClientRow {
  id: string
  name: string
}

// ── Inline edit form ──────────────────────────────────────────────────────────

interface EditFormProps {
  competitor: CompetitorRow
  onSave: (updated: CompetitorRow) => void
  onCancel: () => void
}

function EditForm({ competitor, onSave, onCancel }: EditFormProps) {
  const [name, setName] = useState(competitor.name)
  const [url, setUrl] = useState(competitor.homepage_url ?? competitor.domain)
  const [notes, setNotes] = useState(competitor.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  async function handleSave() {
    if (!url.startsWith('https://')) {
      setUrlError('URL must start with https://')
      return
    }
    setUrlError(null)
    setSaving(true)
    try {
      const res = await portalFetch(`/api/portal/competitors/${competitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), homepageUrl: url.trim(), notes: notes.trim() || undefined }),
      })
      const json = await res.json() as { data: CompetitorRow | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to save')
      if (json.data) onSave(json.data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Competitor name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent"
            placeholder="e.g. Acme Corp"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Homepage URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError(null) }}
            className={[
              'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent',
              urlError ? 'border-red-300' : 'border-gray-200',
            ].join(' ')}
            placeholder="https://example.com"
          />
          {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent"
          placeholder="e.g. Main pricing competitor"
          maxLength={500}
        />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => void handleSave()}
          disabled={saving || !name.trim() || !url.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#B8622A] text-white hover:bg-[#9E5224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Add competitor form ───────────────────────────────────────────────────────

interface AddFormProps {
  clientId: string
  projects: ProjectRow[]
  onAdded: (c: CompetitorRow) => void
  onClose: () => void
}

function AddForm({ clientId, projects, onAdded, onClose }: AddFormProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; url?: string; project?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!url.trim()) e.url = 'URL is required'
    else if (!url.startsWith('https://')) e.url = 'URL must start with https://'
    if (!projectId) e.project = 'Project is required'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    setSaving(true)
    try {
      const res = await portalFetch(`/api/portal/clients/${clientId}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: name.trim(),
          homepageUrl: url.trim(),
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json() as { data: CompetitorRow | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to add competitor')
      if (json.data) { onAdded(json.data); onClose() }
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#B8622A]/25 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Add competitor</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <form onSubmit={(ev) => void handleSubmit(ev)} className="px-5 py-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label htmlFor="comp-name" className="block text-xs font-medium text-gray-700 mb-1.5">
              Competitor name <span className="text-red-400">*</span>
            </label>
            <input
              id="comp-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })) }}
              className={[
                'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent',
                errors.name ? 'border-red-300' : 'border-gray-200',
              ].join(' ')}
              placeholder="e.g. Acme Corp"
              maxLength={100}
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* URL */}
          <div>
            <label htmlFor="comp-url" className="block text-xs font-medium text-gray-700 mb-1.5">
              Homepage URL <span className="text-red-400">*</span>
            </label>
            <input
              id="comp-url"
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors((p) => ({ ...p, url: undefined })) }}
              className={[
                'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent',
                errors.url ? 'border-red-300' : 'border-gray-200',
              ].join(' ')}
              placeholder="https://competitor.com"
              maxLength={500}
            />
            {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url}</p>}
          </div>
        </div>

        {/* Project selector (only shown when client has >1 project) */}
        {projects.length > 1 && (
          <div>
            <label htmlFor="comp-project" className="block text-xs font-medium text-gray-700 mb-1.5">
              Project <span className="text-red-400">*</span>
            </label>
            <select
              id="comp-project"
              value={projectId}
              onChange={(e) => { setProjectId(e.target.value); setErrors((p) => ({ ...p, project: undefined })) }}
              className={[
                'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent bg-white',
                errors.project ? 'border-red-300' : 'border-gray-200',
              ].join(' ')}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project && <p className="text-xs text-red-500 mt-1">{errors.project}</p>}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="comp-notes" className="block text-xs font-medium text-gray-700 mb-1.5">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="comp-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent"
            placeholder="e.g. Direct pricing competitor in AU market"
            maxLength={500}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#B8622A] text-white hover:bg-[#9E5224] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 10" />
                </svg>
                Adding…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add competitor
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Competitor row ────────────────────────────────────────────────────────────

interface CompetitorItemProps {
  competitor: CompetitorRow
  projectName: string
  onUpdated: (c: CompetitorRow) => void
  onDeleted: (id: string) => void
}

function CompetitorItem({ competitor, projectName, onUpdated, onDeleted }: CompetitorItemProps) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const displayUrl = competitor.homepage_url ?? competitor.domain

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await portalFetch(`/api/portal/competitors/${competitor.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      onDeleted(competitor.id)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (editing) {
    return (
      <div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#B8622A]/10 flex items-center justify-center text-[#B8622A] text-xs font-semibold flex-shrink-0">
            {competitor.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{competitor.name}</p>
            <p className="text-xs text-gray-400 truncate">{displayUrl}</p>
          </div>
        </div>
        <EditForm
          competitor={competitor}
          onSave={(updated) => { onUpdated(updated); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-100">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-[#B8622A]/10 flex items-center justify-center text-[#B8622A] text-xs font-semibold flex-shrink-0">
        {competitor.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{competitor.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#B8622A] hover:underline truncate max-w-[240px]"
          >
            {displayUrl}
          </a>
          <span className="hidden sm:inline text-gray-200">·</span>
          <span className="hidden sm:inline text-xs text-gray-400">{projectName}</span>
        </div>
        {competitor.notes && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{competitor.notes}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {confirming ? (
          <>
            <span className="text-xs text-gray-500 mr-1">Remove?</span>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              aria-label="Confirm delete"
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              className="px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Cancel delete"
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label={`Edit ${competitor.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`Delete ${competitor.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.75 8h4.5L10 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  clientId: string
}

export function PortalClientCompetitors({ clientId }: Props) {
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [client, setClient] = useState<ClientRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cRes, pRes, tRes] = await Promise.all([
        portalFetch(`/api/portal/clients/${clientId}`),
        portalFetch(`/api/portal/projects?clientId=${clientId}`),
        portalFetch(`/api/portal/clients/${clientId}/competitors`),
      ])
      const [cJson, pJson, tJson] = await Promise.all([
        cRes.json() as Promise<{ data: ClientRow | null; error: string | null }>,
        pRes.json() as Promise<{ data: ProjectRow[] | null; error: string | null }>,
        tRes.json() as Promise<{ data: CompetitorRow[] | null; error: string | null }>,
      ])
      if (!cRes.ok || cJson.error) throw new Error(cJson.error ?? 'Failed to load client')
      if (!pRes.ok || pJson.error) throw new Error(pJson.error ?? 'Failed to load projects')
      if (!tRes.ok || tJson.error) throw new Error(tJson.error ?? 'Failed to load competitors')
      setClient(cJson.data)
      setProjects(pJson.data ?? [])
      setCompetitors(tJson.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { void load() }, [load])

  function navigate(path: string) {
    window.history.pushState({}, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  return (
    <div className="max-w-5xl space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/portal/clients')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Back to clients"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {client ? client.name : 'Competitors'}
            </h2>
            {competitors.length > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {competitors.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Competitor URLs tracked for this client.</p>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          disabled={projects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add competitor
        </button>
      </div>

      {/* Add form */}
      {formOpen && projects.length > 0 && (
        <AddForm
          clientId={clientId}
          projects={projects}
          onAdded={(c) => setCompetitors((prev) => [c, ...prev])}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* No projects warning */}
      {!loading && projects.length === 0 && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-medium text-amber-800">No projects yet</p>
          <p className="text-xs text-amber-600 mt-1">
            Create a project for this client before adding competitors.{' '}
            <button
              onClick={() => navigate('/portal/projects')}
              className="underline hover:no-underline"
            >
              Go to Projects
            </button>
          </p>
        </div>
      )}

      {/* Competitor list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Competitor</p>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:block">Actions</p>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-gray-700">Failed to load competitors</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button
              onClick={() => void load()}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : competitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center bg-gradient-to-b from-[#B8622A]/3 to-white">
            <div className="w-12 h-12 rounded-full bg-[#B8622A]/10 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="9" stroke="#B8622A" strokeWidth="1.5" fill="none" />
                <circle cx="11" cy="11" r="5" stroke="#B8622A" strokeWidth="1.5" fill="none" />
                <circle cx="11" cy="11" r="1.5" fill="#B8622A" />
                <path d="M11 2v2M11 18v2M2 11h2M18 11h2" stroke="#B8622A" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              No competitors tracked yet
            </p>
            <p className="text-xs text-gray-500 max-w-xs mb-5">
              Add competitor URLs to start monitoring pricing, features, and more.
            </p>
            {projects.length > 0 && (
              <button
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Add competitor URL
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {competitors.map((c) => (
              <CompetitorItem
                key={c.id}
                competitor={c}
                projectName={projectMap[c.project_id] ?? 'Unknown project'}
                onUpdated={(updated) =>
                  setCompetitors((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
                }
                onDeleted={(id) => setCompetitors((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
