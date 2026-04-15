import { useState, useId, useEffect, useRef, type FormEvent } from 'react'
import { Logo } from '../shared'

type DemoState = 'idle' | 'loading' | 'success' | 'error'

function inputClass(state: DemoState): string {
  return [
    'w-full bg-white/[0.06] border rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-white/20 font-sans',
    'transition-all duration-150 outline-none',
    'focus:border-[#F07C35] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#F07C35]/30',
    state === 'error'
      ? 'border-red-500/40'
      : 'border-white/10 hover:border-white/20',
    state === 'loading' ? 'opacity-60 cursor-not-allowed' : '',
  ].join(' ')
}

const DEMO_FEATURES = [
  { label: '2 clients', detail: 'pre-configured' },
  { label: '7 competitors', detail: 'already tracked' },
  { label: '1 live report', detail: 'ready to view' },
]

export function PortalDemo() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<DemoState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState<string | null>(null)

  const emailId = useId()

  useEffect(() => {
    const match = window.location.pathname.match(/^\/portal\/demo\/([^/]+)\/?$/)
    setToken(match ? match[1] : null)
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || !token) return
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch(`/api/demo-invite/${token}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      if (res.ok) {
        setState('success')
        return
      }

      let message = 'Something went wrong. Please try again.'
      try {
        const body = await res.json() as { error?: string }
        if (body.error) message = body.error
      } catch { /* ignore parse error */ }
      setErrorMsg(message)
      setState('error')
    } catch {
      setErrorMsg('A network error occurred. Please check your connection and try again.')
      setState('error')
    }
  }

  const isLoading = state === 'loading'
  const isInvalidToken = token === null

  return (
    <div className="min-h-screen bg-[#0D0F1A] flex flex-col items-center justify-center px-4 py-12">
      {/* Radial amber glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(240,124,53,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <Logo dark />
        </div>

        {/* Label */}
        <p className="text-center text-[11px] tracking-widest uppercase text-white/25 mb-8 font-sans">
          Demo Access
        </p>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_64px_rgba(0,0,0,0.6)]">
          {state === 'success' ? (
            <CheckEmailState email={email} token={token} />
          ) : isInvalidToken ? (
            <InvalidTokenState />
          ) : (
            <div className="p-8">
              {/* Headline */}
              <h1
                className="text-[1.6rem] leading-tight font-bold text-white mb-2"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
              >
                Your demo environment
                <br />
                <span className="text-[#F07C35]">is ready.</span>
              </h1>

              {/* Subtext */}
              <p className="text-sm text-white/45 mb-6 leading-relaxed font-sans">
                Enter your email to get instant access — no credit card, no waiting.
              </p>

              {/* Pre-seeded features */}
              <div className="flex gap-2 mb-7">
                {DEMO_FEATURES.map(({ label, detail }) => (
                  <div
                    key={label}
                    className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2.5 text-center"
                  >
                    <p
                      className="text-[#F07C35] text-sm font-bold leading-none mb-1"
                      style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
                    >
                      {label}
                    </p>
                    <p className="text-[10px] text-white/25 font-sans leading-none">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <div>
                  <label htmlFor={emailId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    Your email
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    autoFocus
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourcompany.com"
                    disabled={isLoading}
                    className={inputClass(state)}
                  />
                </div>

                {/* Error message */}
                {state === 'error' && errorMsg && (
                  <p className="text-xs text-red-400/90 font-sans" role="alert">
                    {errorMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={[
                    'w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-sm font-semibold font-sans',
                    'bg-[#F07C35] text-[#0D0F1A] transition-all duration-150',
                    'hover:bg-[#E06A25] active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F07C35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F1A]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F07C35] disabled:active:scale-100',
                    'mt-1',
                  ].join(' ')}
                >
                  {isLoading ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-[#0D0F1A]/30 border-t-[#0D0F1A] animate-spin"
                        aria-hidden="true"
                      />
                      Sending magic link…
                    </>
                  ) : (
                    'Get instant access →'
                  )}
                </button>
              </form>

              {/* Trust line */}
              <p className="mt-5 text-center text-[11px] text-white/20 font-sans leading-relaxed">
                You'll receive a magic link — click it to enter your live portal.
              </p>
            </div>
          )}
        </div>

        {/* Footer caption */}
        <p className="text-center text-[11px] text-white/15 mt-6 font-sans">
          Track your competitors.{' '}
          <span className="text-white/25">Not your budget.</span>
        </p>
      </div>
    </div>
  )
}

type ResendState = 'idle' | 'loading' | 'sent' | 'error'

function CheckEmailState({ email, token }: { email: string; token: string | null }) {
  const [resendState, setResendState] = useState<ResendState>('idle')
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleResend() {
    if (resendState !== 'idle' || !token) return
    setResendState('loading')
    try {
      const res = await fetch(`/api/demo-invite/${token}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setResendState('sent')
        cooldownRef.current = setTimeout(() => setResendState('idle'), 30_000)
      } else {
        setResendState('error')
        cooldownRef.current = setTimeout(() => setResendState('idle'), 4_000)
      }
    } catch {
      setResendState('error')
      cooldownRef.current = setTimeout(() => setResendState('idle'), 4_000)
    }
  }

  const resendLabel =
    resendState === 'loading' ? 'Sending...' :
    resendState === 'sent'    ? 'Sent — check spam again' :
    resendState === 'error'   ? 'Failed — try again' :
                                'Resend email'

  return (
    <div className="p-8 text-center">
      {/* Envelope icon */}
      <div className="w-14 h-14 rounded-full bg-[#F07C35]/10 border border-[#F07C35]/20 flex items-center justify-center mx-auto mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="18" height="13" rx="2" stroke="#F07C35" strokeWidth="1.75" />
          <path d="M3 8l9 6 9-6" stroke="#F07C35" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
      >
        Check your email
      </h2>

      <p className="text-sm text-white/45 leading-relaxed mb-1 font-sans">
        We've sent a magic link to your inbox.
      </p>
      {email && (
        <p className="text-xs text-white/25 font-sans mb-1">
          Sent to <span className="text-white/40">{email}</span>
        </p>
      )}

      {/* Spam guidance */}
      <p className="text-xs text-white/20 font-sans mb-6">
        Cannot find it? Check spam — sent from onboarding@resend.dev
      </p>

      {/* What happens next */}
      <div className="text-left space-y-3 border-t border-white/[0.08] pt-5">
        {[
          { step: '1', text: 'Click the link in your email' },
          { step: '2', text: 'Your demo portal opens instantly — no password needed' },
          { step: '3', text: "Explore live competitor data, then upgrade when you're ready" },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#F07C35]/15 text-[#F07C35] text-[11px] font-semibold font-sans flex items-center justify-center flex-shrink-0 mt-0.5">
              {step}
            </span>
            <span className="text-sm text-white/40 font-sans">{text}</span>
          </div>
        ))}
      </div>

      {/* Resend button */}
      {token && (
        <div className="mt-5 border-t border-white/[0.08] pt-4">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendState === 'loading' || resendState === 'sent'}
            className={[
              'text-xs font-sans transition-colors',
              resendState === 'sent'    ? 'text-[#4ade80] cursor-default' :
              resendState === 'error'   ? 'text-red-400 cursor-pointer' :
              resendState === 'loading' ? 'text-white/20 cursor-default' :
                                          'text-white/30 hover:text-white/50 cursor-pointer',
            ].join(' ')}
          >
            {resendLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function InvalidTokenState() {
  return (
    <div className="p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="1.75" />
          <path d="M12 8v4M12 16v.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>

      <h2
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
      >
        Invalid demo link
      </h2>

      <p className="text-sm text-white/40 leading-relaxed font-sans">
        This link may have expired or is not valid. Ask your Peerscope contact for a new one.
      </p>
    </div>
  )
}
