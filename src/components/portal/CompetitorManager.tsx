/**
 * CompetitorManager — design reference component for SPA-400 (Lead Engineer)
 *
 * Provides the full add / edit / delete UI for competitor targets in the agency portal.
 * Replace the inline competitor section in PortalProjectDetail with this component.
 *
 * Data shape expected from /api/portal/competitor-targets:
 *   id, project_id, domain, name, notes, status ('active'|'paused'),
 *   track_pricing, track_jobs, track_reviews, track_features
 *
 * Lead Engineer: wire onAdd / onEdit / onDelete to the real API.
 * The component accepts optional async handlers so it can be used standalone
 * with mock data during development.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { portalFetch } from '../../lib/portalApi'

// ─── Data types ────────────────────────────────────────────────────────────────

export interface CompetitorTarget {
  id: string
  project_id: string
  domain: string
  name: string
  notes: string | null
  /** API default: 'active' */
  status: 'active' | 'paused'
  track_pricing: number
  track_jobs: number
  track_reviews: number
  track_features: number
}

// ─── Shared helpers ─────────────────────────────────────────────────────────────

function stripProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

function isValidDomain(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const TRACK_FIELDS = [
  { key: 'track_pricing', label: 'Pricing' },
  { key: 'track_jobs', label: 'Jobs' },
  { key: 'track_reviews', label: 'Reviews' },
  { key: 'track_features', label: 'Features' },
] as const
type TrackKey = (typeof TRACK_FIELDS)[number]['key']

// ─── StatusBadge ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'paused' }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
      Paused
    </span>
  )
}

// ─── TrackPip ───────────────────────────────────────────────────────────────────

function TrackBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
        active
          ? 'bg-[#B8622A]/8 text-[#B8622A] ring-1 ring-inset ring-[#B8622A]/20'
          : 'bg-gray-100 text-gray-400'
      }`}
    >
      {label}
    </span>
  )
}

// ─── CompetitorAvatar ────────────────────────────────────────────────────────────

function CompetitorAvatar({ domain, name }: { domain: string; name: string }) {
  const [imgError, setImgError] = useState(false)
  const faviconSrc = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`

  if (!imgError) {
    return (
      <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img
          src={faviconSrc}
          alt=""
          aria-hidden="true"
          width={16}
          height={16}
          className="w-4 h-4"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div className="w-8 h-8 rounded-lg bg-[#B8622A]/12 flex items-center justify-center flex-shrink-0">
      <span className="text-[11px] font-semibold text-[#B8622A]" aria-hidden="true">
        {initials(name)}
      </span>
    </div>
  )
}

// ─── DeleteButton ────────────────────────────────────────────────────────────────

function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
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
        <path
          d="M2 3.5h10M5.5 3.5V2h3v1.5M3.5 3.5l.7 8h5.6l.7-8"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

// ─── EditCompetitorForm ──────────────────────────────────────────────────────────

interface EditFormProps {
  target: CompetitorTarget
  onSave: (updated: Partial<CompetitorTarget>) => Promise<void>
  onCancel: () => void
}

function EditCompetitorForm({ target, onSave, onCancel }: EditFormProps) {
  const [domain, setDomain] = useState(target.domain)
  const [name, setName] = useState(target.name)
  const [notes, setNotes] = useState(target.notes ?? '')
  const [status, setStatus] = useState<'active' | 'paused'>(target.status)
  const [tracks, setTracks] = useState<Record<TrackKey, boolean>>({
    track_pricing: target.track_pricing === 1,
    track_jobs: target.track_jobs === 1,
    track_reviews: target.track_reviews === 1,
    track_features: target.track_features === 1,
  })
  const [domainError, setDomainError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function validateDomain(value: string): string | null {
    const clean = stripProtocol(value.trim())
    if (!clean) return 'Domain is required.'
    if (!isValidDomain(clean)) return 'Enter a valid domain, e.g. competitor.com'
    return null
  }

  function handleDomainBlur() {
    setDomainError(validateDomain(domain))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dErr = validateDomain(domain)
    const nErr = name.trim() ? null : 'Display name is required.'
    setDomainError(dErr)
    setNameError(nErr)
    if (dErr || nErr) return

    setBusy(true)
    await onSave({
      domain: stripProtocol(domain.trim()),
      name: name.trim(),
      notes: notes.trim() || null,
      status,
      track_pricing: tracks.track_pricing ? 1 : 0,
      track_jobs: tracks.track_jobs ? 1 : 0,
      track_reviews: tracks.track_reviews ? 1 : 0,
      track_features: tracks.track_features ? 1 : 0,
    })
    setBusy(false)
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="px-5 py-4 bg-[#B8622A]/3 border-b border-[#B8622A]/10"
      noValidate
    >
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Edit competitor
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {/* Name */}
        <div>
          <label htmlFor="edit-ct-name" className="block text-xs font-medium text-gray-600 mb-1">
            Display name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="edit-ct-name"
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null) }}
            placeholder="Competitor Inc."
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              nameError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-[#B8622A]'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{nameError}</p>
          )}
        </div>

        {/* Domain */}
        <div>
          <label htmlFor="edit-ct-domain" className="block text-xs font-medium text-gray-600 mb-1">
            Domain <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="edit-ct-domain"
            type="text"
            value={domain}
            onChange={(e) => { setDomain(e.target.value); if (domainError) setDomainError(null) }}
            onBlur={handleDomainBlur}
            placeholder="competitor.com"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              domainError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-[#B8622A]'
            }`}
          />
          {domainError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{domainError}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-3">
        <label htmlFor="edit-ct-notes" className="block text-xs font-medium text-gray-600 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="edit-ct-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. main direct competitor, strong on pricing page"
          rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent resize-none transition-colors"
        />
      </div>

      {/* Status toggle + Track */}
      <div className="flex flex-wrap items-start gap-4 mb-4">
        {/* Status */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Status</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatus('paused')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                status === 'paused'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Paused
            </button>
          </div>
        </div>

        {/* Track */}
        <fieldset>
          <legend className="text-xs font-medium text-gray-600 mb-2">Track</legend>
          <div className="flex flex-wrap gap-3">
            {TRACK_FIELDS.map(({ key, label }) => (
              <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tracks[key]}
                  onChange={() => setTracks((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-[#B8622A] focus:ring-[#B8622A]"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── CompetitorRow ───────────────────────────────────────────────────────────────

interface CompetitorRowProps {
  target: CompetitorTarget
  isEditing: boolean
  onEditStart: () => void
  onEditSave: (updated: Partial<CompetitorTarget>) => Promise<void>
  onEditCancel: () => void
  onDelete: () => Promise<void>
}

function CompetitorRow({
  target,
  isEditing,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
}: CompetitorRowProps) {
  if (isEditing) {
    return (
      <li>
        <EditCompetitorForm target={target} onSave={onEditSave} onCancel={onEditCancel} />
      </li>
    )
  }

  return (
    <li className="px-5 py-3.5 flex items-start gap-3 group hover:bg-gray-50/70 transition-colors">
      <CompetitorAvatar domain={target.domain} name={target.name} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 truncate">{target.name}</span>
          <span className="text-xs text-gray-400 font-mono truncate">{target.domain}</span>
          <StatusBadge status={target.status} />
        </div>

        {target.notes && (
          <p className="text-xs text-gray-500 truncate">{target.notes}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <TrackBadge label="Pricing" active={target.track_pricing === 1} />
          <TrackBadge label="Jobs" active={target.track_jobs === 1} />
          <TrackBadge label="Reviews" active={target.track_reviews === 1} />
          <TrackBadge label="Features" active={target.track_features === 1} />
        </div>
      </div>

      {/* Actions — visible on hover / focus-within, always visible on touch */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 sm:transition-opacity touch-device:opacity-100">
        <button
          onClick={onEditStart}
          className="p-1.5 rounded text-gray-400 hover:text-[#B8622A] hover:bg-[#B8622A]/8 transition-colors"
          aria-label={`Edit ${target.name}`}
          title="Edit competitor"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <DeleteButton onConfirm={onDelete} />
      </div>
    </li>
  )
}

// ─── AddCompetitorForm ───────────────────────────────────────────────────────────

interface AddCompetitorFormProps {
  projectId: string
  onAdded: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AddCompetitorForm({ projectId, onAdded, open, onOpenChange }: AddCompetitorFormProps) {
  const [domain, setDomain] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [tracks, setTracks] = useState<Record<TrackKey, boolean>>({
    track_pricing: true,
    track_jobs: true,
    track_reviews: true,
    track_features: true,
  })
  const [domainError, setDomainError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const domainRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) domainRef.current?.focus() }, [open])

  function validateDomain(value: string): string | null {
    const clean = stripProtocol(value.trim())
    if (!clean) return 'Domain is required.'
    if (!isValidDomain(clean)) return 'Enter a valid domain, e.g. competitor.com'
    return null
  }

  function handleDomainBlur() {
    if (domain) setDomainError(validateDomain(domain))
  }

  function reset() {
    setDomain('')
    setName('')
    setNotes('')
    setTracks({ track_pricing: true, track_jobs: true, track_reviews: true, track_features: true })
    setDomainError(null)
    setNameError(null)
    setServerError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const dErr = validateDomain(domain)
    const nErr = name.trim() ? null : 'Display name is required.'
    setDomainError(dErr)
    setNameError(nErr)
    setServerError(null)
    if (dErr || nErr) return

    setBusy(true)
    try {
      const res = await portalFetch('/api/portal/competitor-targets', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          domain: stripProtocol(domain.trim()),
          name: name.trim(),
          notes: notes.trim() || null,
          trackPricing: tracks.track_pricing,
          trackJobs: tracks.track_jobs,
          trackReviews: tracks.track_reviews,
          trackFeatures: tracks.track_features,
        }),
      })
      const json = (await res.json()) as { data: unknown; error: string | null }
      if (!res.ok || json.error) {
        setServerError(json.error ?? 'Failed to add competitor.')
        return
      }
      reset()
      onOpenChange(false)
      onAdded()
    } catch {
      setServerError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#B8622A]/40 hover:text-[#B8622A] hover:bg-[#B8622A]/5 transition-colors"
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
      <p className="text-sm font-semibold text-gray-800">Add competitor</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Domain — first so user pastes the URL */}
        <div>
          <label htmlFor="add-ct-domain" className="block text-xs font-medium text-gray-600 mb-1">
            Domain <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="add-ct-domain"
            ref={domainRef}
            type="text"
            value={domain}
            onChange={(e) => { setDomain(e.target.value); if (domainError) setDomainError(null) }}
            onBlur={handleDomainBlur}
            placeholder="competitor.com"
            autoComplete="off"
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              domainError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-[#B8622A]'
            }`}
          />
          {domainError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{domainError}</p>
          )}
        </div>

        {/* Name */}
        <div>
          <label htmlFor="add-ct-name" className="block text-xs font-medium text-gray-600 mb-1">
            Display name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="add-ct-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(null) }}
            placeholder="Competitor Inc."
            className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
              nameError
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:ring-[#B8622A]'
            }`}
          />
          {nameError && (
            <p className="mt-1 text-xs text-red-600" role="alert">{nameError}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="add-ct-notes" className="block text-xs font-medium text-gray-600 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="add-ct-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="E.g. main direct competitor, strong on pricing page"
          rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent resize-none transition-colors"
        />
      </div>

      {/* Track */}
      <fieldset>
        <legend className="text-xs font-medium text-gray-600 mb-2">Track</legend>
        <div className="flex flex-wrap gap-3">
          {TRACK_FIELDS.map(({ key, label }) => (
            <label key={key} className="inline-flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tracks[key]}
                onChange={() => setTracks((prev) => ({ ...prev, [key]: !prev[key] }))}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#B8622A] focus:ring-[#B8622A]"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {serverError && (
        <p className="text-xs text-red-600" role="alert">{serverError}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] active:bg-[#8A4820] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.5" />
                <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Adding…
            </span>
          ) : (
            'Add competitor'
          )}
        </button>
        <button
          type="button"
          onClick={() => { onOpenChange(false); reset() }}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── EmptyState ──────────────────────────────────────────────────────────────────

function EmptyState({ projectName, onAddClick }: { projectName: string; onAddClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center bg-gradient-to-b from-[#B8622A]/3 to-white">
      {/* Radar icon */}
      <div className="relative w-14 h-14 mb-5">
        {/* Pulse rings */}
        <span className="absolute inset-0 rounded-full bg-[#B8622A]/8 animate-ping" aria-hidden="true" style={{ animationDuration: '2.5s' }} />
        <span className="absolute inset-2 rounded-full bg-[#B8622A]/10" aria-hidden="true" />
        <div className="relative w-14 h-14 rounded-full bg-[#B8622A]/12 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="#B8622A" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3" fill="#B8622A" fillOpacity="0.4" />
            <path d="M15.5 15.5L20 20" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 3v1.5M10 15v1.5M3 10h1.5M15 10h1.5" stroke="#B8622A" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-1">
        No competitors tracked for{' '}
        <span className="text-[#B8622A]">{projectName}</span>
      </p>
      <p className="text-xs text-gray-500 max-w-[240px] mb-6 leading-relaxed">
        Add your competitors and we'll monitor their pricing, job listings, reviews, and feature changes.
      </p>

      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] active:bg-[#8A4820] transition-colors shadow-sm"
      >
        Add first competitor
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M2 6.5h9M7.5 3l3.5 3.5L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────────

export interface CompetitorManagerProps {
  projectId: string
  projectName: string
}

export function CompetitorManager({ projectId, projectName }: CompetitorManagerProps) {
  const [targets, setTargets] = useState<CompetitorTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadTargets = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await portalFetch(`/api/portal/competitor-targets?projectId=${projectId}`)
      const json = (await res.json()) as { data: CompetitorTarget[] | null; error: string | null }
      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load competitors')
      setTargets(json.data ?? [])
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load competitors')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { void loadTargets() }, [loadTargets])

  async function handleDelete(targetId: string) {
    const res = await portalFetch(`/api/portal/competitor-targets/${targetId}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setTargets((prev) => prev.filter((t) => t.id !== targetId))
    }
  }

  async function handleEditSave(targetId: string, updated: Partial<CompetitorTarget>) {
    const res = await portalFetch(`/api/portal/competitor-targets/${targetId}`, {
      method: 'PATCH',
      body: JSON.stringify(updated),
    })
    if (res.ok) {
      setTargets((prev) =>
        prev.map((t) => (t.id === targetId ? { ...t, ...updated } : t))
      )
      setEditingId(null)
    }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center gap-3 border-b border-gray-100 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="h-2.5 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Load error ──
  if (loadError) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-sm font-medium text-gray-700">{loadError}</p>
        <button
          onClick={() => void loadTargets()}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Competitors</h3>
          {targets.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {targets.length} competitor{targets.length !== 1 ? 's' : ''} tracked
            </p>
          )}
        </div>
        {targets.length > 0 && !formOpen && (
          <button
            onClick={() => { setFormOpen(true); setEditingId(null) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#B8622A] bg-[#B8622A]/8 hover:bg-[#B8622A]/15 transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add
          </button>
        )}
      </div>

      {/* Empty state */}
      {targets.length === 0 && !formOpen && (
        <EmptyState
          projectName={projectName}
          onAddClick={() => setFormOpen(true)}
        />
      )}

      {/* Competitor list */}
      {targets.length > 0 && (
        <ul className="divide-y divide-gray-100" role="list" aria-label="Tracked competitors">
          {targets.map((target) => (
            <CompetitorRow
              key={target.id}
              target={target}
              isEditing={editingId === target.id}
              onEditStart={() => { setEditingId(target.id); setFormOpen(false) }}
              onEditSave={(updated) => handleEditSave(target.id, updated)}
              onEditCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(target.id)}
            />
          ))}
        </ul>
      )}

      {/* Add form */}
      <div className={targets.length > 0 || formOpen ? 'px-5 py-4 border-t border-gray-100' : 'hidden'}>
        <AddCompetitorForm
          projectId={projectId}
          onAdded={() => void loadTargets()}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      </div>
    </div>
  )
}
