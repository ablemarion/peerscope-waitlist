import { useState, useEffect } from 'react'

const STORAGE_KEY = 'peerscope_urgency_banner_v1'
const FOUNDING_CAP = 100
const DEADLINE = '15 April'

export function FoundingBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { count: number } | null) => {
        if (data && typeof data.count === 'number') {
          const remaining = Math.max(0, FOUNDING_CAP - data.count)
          setSpotsLeft(remaining)
        }
      })
      .catch(() => {})
  }, [])

  if (dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
    setDismissed(true)
  }

  const spotsFragment =
    spotsLeft !== null && spotsLeft > 0
      ? ` — ${spotsLeft} founding spot${spotsLeft === 1 ? '' : 's'} left`
      : ''

  return (
    <div
      role="banner"
      className="relative flex items-center justify-center px-10 py-2.5"
      style={{
        minHeight: '40px',
        background: 'linear-gradient(90deg, #7C2D0E 0%, #92350F 50%, #7C2D0E 100%)',
        borderBottom: '1px solid rgba(240,124,53,0.25)',
      }}
    >
      <p className="text-center text-xs sm:text-sm leading-snug text-white">
        <strong className="font-semibold">Waitlist closes {DEADLINE}</strong>
        <span className="opacity-90">{spotsFragment}</span>
        <span className="opacity-70 hidden sm:inline"> · Founding rate $49/mo locked for life</span>
        <span className="opacity-70 sm:hidden"> · $49/mo for life</span>
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss waitlist deadline banner"
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded opacity-50 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#92350F]"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
