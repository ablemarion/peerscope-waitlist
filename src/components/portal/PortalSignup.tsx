import { useState, useId, type FormEvent } from 'react'
import { Logo } from '../shared'

type SignupState = 'idle' | 'loading' | 'success' | 'error'

export function PortalSignup() {
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<SignupState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const agencyId = useId()
  const emailId = useId()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!agencyName.trim() || !email.trim()) return
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/portal/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName: agencyName.trim(), email: email.trim() }),
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

  return (
    <div className="min-h-screen bg-[#0D0F1A] flex flex-col items-center justify-center px-4 py-12">
      {/* Subtle radial glow behind card */}
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

        {/* Category label */}
        <p className="text-center text-[11px] tracking-widest uppercase text-white/25 mb-8 font-sans">
          Agency Beta
        </p>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_64px_rgba(0,0,0,0.6)]">
          {state === 'success' ? (
            <SuccessState />
          ) : (
            <div className="p-8">
              {/* Headline */}
              <h1
                className="text-[1.6rem] leading-tight font-bold text-white mb-2"
                style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
              >
                Join the Peerscope
                <br />
                <span className="text-[#F07C35]">Agency Beta</span>
              </h1>

              {/* Subtext */}
              <p className="text-sm text-white/45 mb-7 leading-relaxed font-sans">
                Set up in 24 hours. No credit card until you're ready.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                {/* Agency name */}
                <div>
                  <label htmlFor={agencyId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    Agency name
                  </label>
                  <input
                    id={agencyId}
                    type="text"
                    autoComplete="organization"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Acme Digital"
                    disabled={state === 'loading'}
                    className={[
                      'w-full bg-white/[0.06] border rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-white/20 font-sans',
                      'transition-all duration-150 outline-none',
                      'focus:border-[#F07C35] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#F07C35]/30',
                      state === 'error'
                        ? 'border-red-500/40'
                        : 'border-white/10 hover:border-white/20',
                      state === 'loading' ? 'opacity-60 cursor-not-allowed' : '',
                    ].join(' ')}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor={emailId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    Work email
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@agency.com"
                    disabled={state === 'loading'}
                    className={[
                      'w-full bg-white/[0.06] border rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-white/20 font-sans',
                      'transition-all duration-150 outline-none',
                      'focus:border-[#F07C35] focus:bg-white/[0.08] focus:ring-1 focus:ring-[#F07C35]/30',
                      state === 'error'
                        ? 'border-red-500/40'
                        : 'border-white/10 hover:border-white/20',
                      state === 'loading' ? 'opacity-60 cursor-not-allowed' : '',
                    ].join(' ')}
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
                  disabled={state === 'loading' || !agencyName.trim() || !email.trim()}
                  className={[
                    'w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg text-sm font-semibold font-sans',
                    'bg-[#F07C35] text-[#0D0F1A] transition-all duration-150',
                    'hover:bg-[#E06A25] active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F07C35] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0F1A]',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#F07C35] disabled:active:scale-100',
                    'mt-1',
                  ].join(' ')}
                >
                  {state === 'loading' ? (
                    <>
                      <span
                        className="w-4 h-4 rounded-full border-2 border-[#0D0F1A]/30 border-t-[#0D0F1A] animate-spin"
                        aria-hidden="true"
                      />
                      Requesting access…
                    </>
                  ) : (
                    'Request beta access'
                  )}
                </button>
              </form>

              {/* Trust line */}
              <p className="mt-5 text-center text-[11px] text-white/20 font-sans leading-relaxed">
                We review every application. You'll hear back within 24 hours.
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

function SuccessState() {
  return (
    <div className="p-8 text-center">
      {/* Amber check icon */}
      <div className="w-14 h-14 rounded-full bg-[#F07C35]/10 border border-[#F07C35]/20 flex items-center justify-center mx-auto mb-5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 12.5l3.5 3.5 6.5-7"
            stroke="#F07C35"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h2
        className="text-xl font-bold text-white mb-2"
        style={{ fontFamily: "'Syne', system-ui, sans-serif" }}
      >
        Application received
      </h2>

      <p className="text-sm text-white/45 leading-relaxed mb-6 font-sans">
        We'll review your details and follow up within 24 hours. Keep an eye on your inbox.
      </p>

      {/* What happens next */}
      <div className="text-left space-y-3 border-t border-white/8 pt-5">
        {[
          { step: '1', text: 'We review your agency profile' },
          { step: '2', text: 'You receive onboarding instructions by email' },
          { step: '3', text: 'Your portal goes live — no credit card needed yet' },
        ].map(({ step, text }) => (
          <div key={step} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#F07C35]/15 text-[#F07C35] text-[11px] font-semibold font-sans flex items-center justify-center flex-shrink-0 mt-0.5">
              {step}
            </span>
            <span className="text-sm text-white/40 font-sans">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
