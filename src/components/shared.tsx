import { useState } from 'react'
import type { FormEvent } from 'react'

export function Logo({ dark = false }: { dark?: boolean }) {
  const navy = dark ? '#F8FAFC' : '#1A2F4E'
  const blue = dark ? '#60A5FA' : '#2563EB'
  const teal = dark ? '#2DD4BF' : '#0D9488'
  return (
    <svg width="140" height="28" viewBox="0 0 140 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="peerscope">
      <circle cx="14" cy="14" r="12" stroke={navy} strokeWidth="2" fill="none" />
      <circle cx="14" cy="14" r="4" fill={teal} />
      <line x1="14" y1="2" x2="14" y2="8" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="20" x2="14" y2="26" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="14" x2="8" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="14" x2="26" y2="14" stroke={navy} strokeWidth="2" strokeLinecap="round" />
      <text x="32" y="19" fontFamily="'Plus Jakarta Sans', Inter, system-ui, sans-serif" fontSize="15" fontWeight="400" fill={navy}>peer</text>
      <text x="62" y="19" fontFamily="'Plus Jakarta Sans', Inter, system-ui, sans-serif" fontSize="15" fontWeight="700" fill={blue}>scope</text>
    </svg>
  )
}

interface EmailFormProps {
  placeholder?: string
  buttonText?: string
  size?: 'default' | 'large'
}

export function EmailForm({
  placeholder = 'Enter your work email',
  buttonText = 'Join waitlist',
  size = 'default',
}: EmailFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    return (
      <div className={`flex items-center gap-3 ${size === 'large' ? 'text-base' : 'text-sm'}`}>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-4 py-3 font-medium">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="8" fill="#059669" />
            <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          You're on the waitlist! We'll be in touch.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`flex gap-2 ${size === 'large' ? 'flex-col sm:flex-row' : 'flex-row'}`}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className={`flex-1 rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${size === 'large' ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`whitespace-nowrap rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed ${size === 'large' ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'}`}
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
