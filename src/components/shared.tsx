import { useState } from 'react'
import type { FormEvent } from 'react'

export function Logo({ dark = false }: { dark?: boolean }) {
  const navy = dark ? '#FAFAF6' : '#111320'
  const blue = dark ? '#F07C35' : '#B8622A'
  const teal = '#C8DCE8'
  return (
    <svg width="140" height="28" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="peerscope">
      <circle cx="14" cy="14" r="12" stroke={navy} strokeWidth="2" fill="none" />
      <circle cx="14" cy="14" r="4" fill={teal} />
      <line x1="14" y1="2" x2="14" y2="8" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="20" x2="14" y2="26" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="14" x2="8" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="14" x2="26" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="19" fontFamily="'Syne', system-ui, sans-serif" fontSize="16" fontWeight="400" fill={navy}>peer</text>
      <text x="64" y="19" fontFamily="'Syne', system-ui, sans-serif" fontSize="16" fontWeight="700" fill={blue}>scope</text>
    </svg>
  )
}

interface EmailFormProps {
  placeholder?: string
  buttonText?: string
  buttonVariant?: string
  size?: 'default' | 'large'
  variant?: 'light' | 'dark'
  onSuccess?: () => void
  defaultSource?: string
}

export function EmailForm({
  placeholder = 'Enter your work email',
  buttonText = 'Join waitlist',
  buttonVariant,
  size = 'default',
  variant = 'light',
  onSuccess,
  defaultSource,
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
    const utmSource = params.get('utm_source') || null
    const utmMedium = params.get('utm_medium') || null
    const utmCampaign = params.get('utm_campaign') || null
    const refCode = params.get('ref') || null
    const storedSource = (() => {
      try { return (JSON.parse(localStorage.getItem('tracking') || '{}') as Record<string, string>).source || null } catch { return null }
    })()
    const source = utmSource || refCode || storedSource || defaultSource || 'direct'
    const sessionId = sessionStorage.getItem('ps_sid') ?? undefined
    const variant = params.get('variant') ?? 'b'

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, session_id: sessionId, variant, button_variant: buttonVariant ?? null, utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign, ref_code: refCode }),
      })
      if (res.ok) {
        try { localStorage.setItem('ps_sub', '1') } catch { /* ignore */ }
        onSuccess?.()
        window.location.href = `/thank-you?email=${encodeURIComponent(email)}`
        return
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
    const SHARE_URL = 'https://peerscope-waitlist.pages.dev?ref=referral'
    const SHARE_TEXT = 'Worth signing up for — tracks competitor pricing and messaging automatically.'

    async function handleShare() {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Peerscope — competitive intelligence for SMBs',
            text: SHARE_TEXT,
            url: SHARE_URL,
          })
          return
        } catch {
          // User cancelled or share not supported — fall through to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(SHARE_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch { /* ignore */ }
    }

    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(SHARE_URL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch { /* ignore */ }
    }

    const textColor = variant === 'dark' ? 'text-white' : 'text-[#111320]'
    const mutedColor = variant === 'dark' ? 'text-white/60' : 'text-gray-500'
    const separatorColor = variant === 'dark' ? 'border-white/15' : 'border-gray-200'
    const subduedColor = variant === 'dark' ? 'text-white/65' : 'text-gray-500/65'

    return (
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative flex items-center justify-center w-14 h-14">
          <span className="scope-ping absolute inset-0 rounded-full border-2 border-[#B8622A]/50" />
          <span className="scope-ping scope-ping-delay absolute inset-0 rounded-full border-2 border-[#B8622A]/30" />
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="14" cy="14" r="12" stroke="#B8622A" strokeWidth="2" fill="none" />
            <circle cx="14" cy="14" r="4" fill="rgba(200,220,232,0.5)" />
            <line x1="14" y1="2" x2="14" y2="8" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="20" x2="14" y2="26" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="14" x2="8" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="14" x2="26" y2="14" stroke="#B8622A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className={`font-bold text-lg leading-tight ${textColor}`} style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            You're on the list - we'll be in touch.
          </p>
        </div>
        <div className={`w-full border-t ${separatorColor}`} />
        <div className="w-full flex flex-col items-center gap-3">
          <p className={`text-sm font-medium text-center ${subduedColor}`}>
            Know an SMB owner who's flying blind on competitors?
          </p>
          <div className="w-full flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 rounded-lg font-semibold text-sm transition min-h-[44px] px-3 py-2.5 flex items-center justify-center gap-1.5"
              style={{
                border: '1px solid rgba(184,98,42,0.45)',
                color: '#F07C35',
                background: variant === 'dark' ? 'rgba(184,98,42,0.1)' : 'rgba(184,98,42,0.06)',
              }}
            >
              Share with a colleague <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`rounded-lg font-semibold text-sm transition min-h-[44px] px-3 py-2.5 flex items-center justify-center gap-1.5 ${mutedColor}`}
              style={{
                border: variant === 'dark' ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.12)',
                background: 'transparent',
                color: copied ? '#C8DCE8' : undefined,
              }}
            >
              {copied ? '✓ Copied' : 'Copy link'}
            </button>
          </div>
          <p className={`text-xs italic text-center ${mutedColor}`}>
            This takes 20 seconds and helps us build for real people.
          </p>
        </div>
      </div>
    )
  }

  const inputClass = variant === 'dark'
    ? `flex-1 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#B8622A]/50 focus:bg-white/15 focus:border-white/40 transition ${size === 'large' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-base'}`
    : `flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:border-transparent transition ${size === 'large' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-base'}`

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
          className={`whitespace-nowrap rounded-lg bg-[#B8622A] text-white font-semibold hover:bg-[#F07C35] hover:shadow-lg hover:shadow-[#B8622A]/30 hover:-translate-y-px active:bg-[#9E5223] active:translate-y-0 active:shadow-none focus:outline-none focus:ring-2 focus:ring-[#B8622A] focus:ring-offset-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${size === 'large' ? 'w-full sm:w-auto px-6 py-3 text-base' : 'px-4 py-2 text-sm min-h-[44px]'}`}
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
