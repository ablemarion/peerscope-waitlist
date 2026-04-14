import { useState, useId, type FormEvent } from 'react'
import { Logo } from '../shared'

type SignupState = 'idle' | 'loading' | 'success' | 'error'

const CLIENT_COUNT_OPTIONS = [
  { value: '', label: 'Number of active clients' },
  { value: '1-5', label: '1–5 clients' },
  { value: '6-15', label: '6–15 clients' },
  { value: '16-30', label: '16–30 clients' },
  { value: '30+', label: '30+ clients' },
]

export function PortalSignup() {
  const [agencyName, setAgencyName] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [clientCount, setClientCount] = useState('')
  const [currentMethod, setCurrentMethod] = useState('')
  const [state, setState] = useState<SignupState>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const agencyId = useId()
  const nameId = useId()
  const emailId = useId()
  const clientCountId = useId()
  const currentMethodId = useId()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!agencyName.trim() || !name.trim() || !email.trim() || !clientCount) return
    setState('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/agency-signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: agencyName.trim(),
          name: name.trim(),
          email: email.trim(),
          client_count: clientCount,
          current_method: currentMethod.trim() || undefined,
        }),
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
            <SuccessState email={email} />
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
                Join 10+ agencies in beta. Set up within 24 hours — no credit card until you're ready.
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
                    disabled={isLoading}
                    className={inputClass(state)}
                  />
                </div>

                {/* Your name */}
                <div>
                  <label htmlFor={nameId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    Your name
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    disabled={isLoading}
                    className={inputClass(state)}
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
                    disabled={isLoading}
                    className={inputClass(state)}
                  />
                </div>

                {/* Number of active clients */}
                <div>
                  <label htmlFor={clientCountId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    Number of active clients
                  </label>
                  <select
                    id={clientCountId}
                    required
                    value={clientCount}
                    onChange={(e) => setClientCount(e.target.value)}
                    disabled={isLoading}
                    className={[
                      inputClass(state),
                      'appearance-none',
                      clientCount ? '' : 'text-white/20',
                    ].join(' ')}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: '36px',
                    }}
                  >
                    {CLIENT_COUNT_OPTIONS.map(opt => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.value === ''}
                        style={{ background: '#1a1c2a', color: opt.value ? '#fff' : 'rgba(255,255,255,0.3)' }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Current method (optional) */}
                <div>
                  <label htmlFor={currentMethodId} className="block text-xs text-white/40 mb-1.5 font-sans">
                    How do you currently deliver competitive reports?{' '}
                    <span className="text-white/20">(optional)</span>
                  </label>
                  <textarea
                    id={currentMethodId}
                    value={currentMethod}
                    onChange={(e) => setCurrentMethod(e.target.value)}
                    placeholder="Spreadsheets, manual research, a tool we built…"
                    disabled={isLoading}
                    rows={3}
                    className={[
                      inputClass(state),
                      'resize-none',
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
                  disabled={isLoading || !agencyName.trim() || !name.trim() || !email.trim() || !clientCount}
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

function inputClass(state: SignupState): string {
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

function SuccessState({ email }: { email: string }) {
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

      <p className="text-sm text-white/45 leading-relaxed mb-1 font-sans">
        We'll set you up within 24 hours.
      </p>
      {email && (
        <p className="text-xs text-white/25 font-sans mb-6">
          Keep an eye on <span className="text-white/40">{email}</span>
        </p>
      )}

      {/* What happens next */}
      <div className="text-left space-y-3 border-t border-white/[0.08] pt-5">
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
