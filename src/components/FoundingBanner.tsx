import { useState } from 'react'

const STORAGE_KEY = 'peerscope_founding_banner_dismissed'

function useVariant(): 'a' | 'b' {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('variant')?.toLowerCase()
  return v === 'a' ? 'a' : 'b'
}

export function FoundingBanner() {
  const variant = useVariant()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  if (variant === 'a' || dismissed) return null

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
    setDismissed(true)
  }

  return (
    <div
      role="banner"
      className="relative flex items-center justify-center bg-[#B8622A] text-white text-xs sm:text-sm font-medium px-10 py-2.5"
      style={{ minHeight: '40px' }}
    >
      <p className="text-center leading-snug">
        <strong className="font-semibold">Founding member pricing:</strong>
        {' '}$49/mo locked for life.{' '}
        <span className="opacity-85">First 100 signups only.</span>
      </p>
      <button
        onClick={dismiss}
        aria-label="Dismiss founding member offer banner"
        className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-[#B8622A]"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
