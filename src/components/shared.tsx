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
}

export function EmailForm({
  placeholder = 'Enter your work email',
  buttonText = 'Join waitlist',
  size = 'default',
  variant = 'light',
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
    function handleShare() {
      navigator.clipboard.writeText('https://peerscope-waitlist.pages.dev').catch(() => {})
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
          <p className={`text-sm mt-1 ${mutedColor}`}>We'll alert you the moment Peerscope launches.</p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          className={`text-sm transition flex items-center gap-1.5 ${variant === 'dark' ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600'}`}
        >
          {copied
            ? <><span className="text-[#34D6B7]">✓</span> Link copied!</>
            : <>Know a founder who'd want this? Share the link <span aria-hidden="true">→</span></>
          }
        </button>
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
