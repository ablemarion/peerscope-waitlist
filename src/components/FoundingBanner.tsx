import { useState, useEffect } from 'react'

const STORAGE_KEY = 'peerscope_urgency_banner_v1'
const FOUNDING_CAP = 50
const DEADLINE = new Date('2026-04-15T23:59:59+08:00') // Perth AWST

export function FoundingBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false
      const { dismissed, ts } = JSON.parse(stored)
      // 24h TTL
      if (dismissed && Date.now() - ts < 24 * 60 * 60 * 1000) return true
      localStorage.removeItem(STORAGE_KEY)
      return false
    } catch {
      return false
    }
  })
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)
  const [past, setPast] = useState(() => Date.now() > DEADLINE.getTime())

  useEffect(() => {
    fetch('/api/public/stats')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { count: number; show_count: boolean } | null) => {
        if (data && data.show_count && typeof data.count === 'number') {
          setSpotsLeft(Math.max(0, FOUNDING_CAP - data.count))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (past) return
    const ms = DEADLINE.getTime() - Date.now()
    if (ms <= 0) { setPast(true); return }
    const t = setTimeout(() => setPast(true), Math.min(ms, 2_147_483_647))
    return () => clearTimeout(t)
  }, [past])

  if (dismissed || past) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true, ts: Date.now() }))
    } catch {
      // ignore
    }
    setDismissed(true)
  }

  const spotsFragment =
    spotsLeft !== null && spotsLeft > 0
      ? ` — ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`
      : ''

  return (
    <div
      role="banner"
      className="relative flex items-center justify-center px-10 py-2.5"
      style={{ minHeight: '40px', background: '#B8622A' }}
    >
      <p className="text-center leading-snug text-white" style={{ fontSize: '13px' }}>
        <span>⏰ Founding member pricing closes April 15</span>
        <span className="hidden sm:inline">{spotsFragment}</span>
        <span> · </span>
        <a
          href="#waitlist"
          className="font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          Sign up →
        </a>
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss founding pricing banner"
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1"
        style={{ color: 'white' }}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
