import { useState, useEffect } from 'react'
import { Logo } from './shared'

function emailToRefCode(email: string): string {
  // Deterministic, human-safe ref code from email — no crypto needed
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36).padStart(6, '0').slice(0, 8)
}

const BASE_URL = 'https://peerscope-waitlist.pages.dev'

export default function ThankYouPage() {
  const params = new URLSearchParams(window.location.search)
  const email = decodeURIComponent(params.get('email') ?? '')
  const refCode = email ? emailToRefCode(email) : 'share'
  const shareUrl = `${BASE_URL}?ref=${refCode}`
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Stop tracking competitors in spreadsheets. @PeerscopeHQ monitors pricing, features, and jobs 24/7 — on the waitlist for founding price: ${shareUrl}`
  )}`

  const [position, setPosition] = useState<number | null>(null)
  const [displayedPosition, setDisplayedPosition] = useState<number | null>(null)
  const [glowing, setGlowing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!email) return
    fetch(`/api/waitlist/position?email=${encodeURIComponent(email)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { position?: number } | null) => {
        if (data && typeof data.position === 'number') setPosition(data.position)
      })
      .catch(() => {/* silent */})
  }, [email])

  // Count-up animation: fires when position arrives from API
  useEffect(() => {
    if (position === null) return

    const steps = Math.min(position, 20)
    const start = position - steps
    let current = start

    const interval = setInterval(() => {
      current++
      setDisplayedPosition(current)
      // Amber text-shadow pulse: instant on, 60ms fade off (managed via glowing state)
      setGlowing(true)
      setTimeout(() => setGlowing(false), 60)
      if (current >= position) clearInterval(interval)
    }, 80)

    return () => clearInterval(interval)
  }, [position])

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Peerscope — competitive intelligence for SMBs',
          text: 'Stop tracking competitors in spreadsheets. Peerscope monitors pricing, features, and jobs 24/7.',
          url: shareUrl,
        })
        return
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    await copyToClipboard()
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {/* ignore */}
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0F1A', color: '#FAFAF6' }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(13,15,26,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'rgba(184,98,42,0.12)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <a href="/" aria-label="Peerscope home">
            <Logo dark />
          </a>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1">
        {/* Visually hidden h1 for accessibility — number is the visual headline */}
        <h1 className="sr-only">Waitlist confirmed</h1>

        {/* Hero: position number — full width, no max-w constraint */}
        <div className="relative w-full text-center pt-24 pb-12 overflow-hidden">
          {/* Radial glow centred behind the number */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle 600px at 50% 50%, rgba(184,98,42,0.05) 0%, transparent 70%)' }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <p className="text-sm text-white/40 tracking-widest uppercase mb-4">
              You're number
            </p>

            <p
              aria-live="polite"
              className="font-bold text-[#B8622A] leading-none tracking-tight text-[96px] sm:text-[120px]"
              style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                textShadow: glowing ? '0 0 20px rgba(184,98,42,0.6)' : '0 0 0px rgba(184,98,42,0)',
                transition: glowing ? 'none' : 'text-shadow 60ms ease-out',
              }}
            >
              {displayedPosition !== null ? displayedPosition : '—'}
            </p>

            <p className="text-lg text-white/50 mt-2">
              in line — founding price locked
            </p>
          </div>
        </div>

        {/* Divider: full-width amber rule */}
        <div className="w-full h-px" style={{ background: 'rgba(184,98,42,0.15)' }} />

        {/* Share section: constrained width */}
        <div className="max-w-sm mx-auto px-4 pt-10 pb-16 text-center">
          <p
            className="text-[18px] font-semibold text-white/80 mb-6 leading-snug"
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          >
            Know a founder who tracks competitors<br />in spreadsheets?
          </p>

          {/* Primary CTA — amber filled, full width, native share */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-lg py-4 text-base font-bold text-white bg-[#B8622A] hover:bg-[#F07C35] transition-colors"
          >
            Share with a founder →
          </button>

          {/* Secondary links */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Post on X
            </a>
            <span className="text-white/20" aria-hidden="true">·</span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
