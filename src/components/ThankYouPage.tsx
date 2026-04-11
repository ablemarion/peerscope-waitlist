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
  const tweetText = `Stop tracking competitors in spreadsheets. @PeerscopeHQ monitors pricing, features, and jobs 24/7 — on the waitlist for founding price: ${shareUrl}`

  const [position, setPosition] = useState<number | null>(null)
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
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Scope icon with ping */}
          <div className="flex justify-center mb-8">
            <div className="relative flex items-center justify-center w-20 h-20">
              <span className="scope-ping absolute inset-0 rounded-full border-2 border-[#B8622A]/50" />
              <span className="scope-ping scope-ping-delay absolute inset-0 rounded-full border-2 border-[#B8622A]/30" />
              <svg width="44" height="44" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="14" cy="14" r="12" stroke="#B8622A" strokeWidth="2" fill="none" />
                <circle cx="14" cy="14" r="4" fill="rgba(200,220,232,0.5)" />
                <line x1="14" y1="2" x2="14" y2="8" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
                <line x1="14" y1="20" x2="14" y2="26" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="14" x2="8" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
                <line x1="20" y1="14" x2="26" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Confirmation */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-3"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif", letterSpacing: '-0.02em' }}
            >
              You're on the waitlist.
            </h1>
            {position !== null && (
              <p className="text-white/60 text-sm">
                You're{' '}
                <span className="text-[#B8622A] font-semibold">#{position}</span>
                {' '}in line — founding price locked at $49/mo for life.
              </p>
            )}
            {position === null && (
              <p className="text-white/60 text-sm">
                Founding price locked at $49/mo for life.
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t mb-8" style={{ borderColor: 'rgba(184,98,42,0.15)' }} />

          {/* Share section */}
          <div className="text-center mb-6">
            <p
              className="text-sm font-medium text-white/70 mb-5"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              Know a founder who tracks competitors in spreadsheets? Send them this:
            </p>

            {/* Referral link display */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4 text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="flex-1 text-xs text-white/50 truncate font-mono">{shareUrl}</span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="shrink-0 text-xs font-semibold rounded-md px-3 py-1.5 transition-colors"
                style={{
                  background: copied ? 'rgba(184,98,42,0.2)' : 'rgba(255,255,255,0.06)',
                  color: copied ? '#B8622A' : 'rgba(250,250,246,0.7)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                aria-label="Copy referral link"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {/* Share buttons */}
            <div className="flex gap-3">
              {/* Tweet button */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FAFAF6' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.738-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Post on X
              </a>

              {/* Native share / copy fallback */}
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(184,98,42,0.15)', border: '1px solid rgba(184,98,42,0.3)', color: '#F07C35' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-sm text-white/35 hover:text-white/60 transition-colors"
            >
              Back to Peerscope
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
