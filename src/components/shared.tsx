import { useState } from 'react'
import type { FormEvent } from 'react'

export function Logo({ dark = false }: { dark?: boolean }) {
  const navy = dark ? '#FAFAF6' : '#111320'
  const blue = dark ? '#F07C35' : '#B8622A'
  const teal = dark ? '#34D6B7' : '#1A7A6E'
  return (
    <svg width="140" height="28" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="peerscope">
      <circle cx="14" cy="14" r="12" stroke={navy} strokeWidth="2" fill="none" />
      <circle cx="14" cy="14" r="4" fill={teal} />
      <line x1="14" y1="2" x2="14" y2="8" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="20" x2="14" y2="26" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="14" x2="8" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="14" x2="26" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="19" fontFamily="'Syne', 'Plus Jakarta Sans', system-ui, sans-serif" fontSize="16" fontWeight="400" fill={navy}>peer</text>
      <text x="64" y="19" fontFamily="'Syne', 'Plus Jakarta Sans', system-ui, sans-serif" fontSize="16" fontWeight="700" fill={blue}>scope</text>
    </svg>
  )
}

interface EmailFormProps {
  placeholder?: string
  buttonText?: string
  size?: 'default' | 'large'
  variant?: 'light' | 'dark'
  onSuccess?: () => void
}

export function EmailForm({
  placeholder = 'Enter your work email',
  buttonText = 'Join waitlist',
  size = 'default',
  variant = 'light',
  onSuccess,
}: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')

    const params = new URLSearchParams(window.location.search)
    const source = params.get('utm_source') || params.get('ref') || 'direct'
    const sessionId = sessionStorage.getItem('ps_sid') ?? undefined
    const variant = params.get('variant') ?? 'b'

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, session_id: sessionId, variant }),
      })
      if (res.ok) {
        setStatus('success')
        setEmail('')
        onSuccess?.()
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg((data as { error?: string }).error || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    const SHARE_URL = 'https://peerscope-waitlist.pages.dev'
    const SHARE_TEXT = `I just claimed founding pricing for @Peerscope — competitive intel for SMBs at $49/mo. Closes April 15: ${SHARE_URL}`

    async function handleShare() {
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Peerscope', text: SHARE_TEXT, url: SHARE_URL })
          return
        } catch {
          // User cancelled or share failed — fall through to Twitter
        }
      }
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}`
      window.open(twitterUrl, '_blank', 'noopener,noreferrer')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    const textColor = variant === 'dark' ? 'text-white' : 'text-[#111320]'
    const mutedColor = variant === 'dark' ? 'text-white/60' : 'text-gray-500'

    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative flex items-center justify-center w-14 h-14">
          <span className="scope-ping absolute inset-0 rounded-full border-2 border-[#B8622A]/50" />
          <span className="scope-ping scope-ping-delay absolute inset-0 rounded-full border-2 border-[#B8622A]/30" />
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="12" stroke="#B8622A" strokeWidth="2" fill="none" />
            <circle cx="14" cy="14" r="4" fill="#1A7A6E" />
            <line x1="14" y1="2" x2="14" y2="8" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="20" x2="14" y2="26" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="14" x2="8" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="14" x2="26" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className={`font-bold text-lg leading-tight ${textColor}`} style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}>You're in.</p>
          <p className={`text-sm mt-1 ${mutedColor}`}>Founding price locked. We'll email you when Peerscope launches.</p>
        </div>
        <div className="w-full flex flex-col items-center gap-2">
          <p className={`text-xs font-medium ${variant === 'dark' ? 'text-white/45' : 'text-gray-400'}`}>
            Know a founder who tracks competitors manually?
          </p>
          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-lg font-semibold text-sm transition min-h-[44px] px-4 py-2.5 flex items-center justify-center gap-2"
            style={{
              background: variant === 'dark' ? 'rgba(184,98,42,0.15)' : 'rgba(184,98,42,0.08)',
              border: '1px solid rgba(184,98,42,0.35)',
              color: copied ? '#34D6B7' : '#F07C35',
            }}
          >
            {copied
              ? <><span>✓</span> Shared — thanks!</>
              : <>Tell them about Peerscope <span aria-hidden="true">↗</span></>
            }
          </button>
        </div>
      </div>
    )
  }

  const inputClass = variant === 'dark'
    ? `flex-1 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#B8622A]/50 focus:bg-white/15 focus:border-white/40 transition ${size === 'large' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}`
    : `flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent transition ${size === 'large' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}`

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${size === 'large' ? 'flex-col sm:flex-row' : 'flex-row'}`}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-label="Email address"
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`whitespace-nowrap rounded-lg bg-[#B8622A] text-white font-semibold hover:bg-[#F07C35] hover:shadow-lg hover:shadow-[#B8622A]/30 hover:-translate-y-px active:bg-[#9E5223] active:translate-y-0 active:shadow-none focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${size === 'large' ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
        >
          {status === 'loading' ? 'Joining…' : buttonText}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      )}
    </form>
  )
}
