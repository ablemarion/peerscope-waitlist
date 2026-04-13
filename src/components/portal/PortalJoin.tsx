import { useEffect, useState } from 'react'
import { Logo } from '../shared'

type JoinState =
  | { phase: 'loading' }
  | { phase: 'invalid' }
  | { phase: 'accepting' }
  | { phase: 'error'; message: string }
  | { phase: 'success' }

export function PortalJoin() {
  const [state, setState] = useState<JoinState>({ phase: 'loading' })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setState({ phase: 'invalid' })
      return
    }

    setState({ phase: 'accepting' })

    async function acceptInvite() {
      try {
        const res = await fetch('/api/portal/auth/accept-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          let message = 'This invite link has expired or has already been used.'
          try {
            const body = await res.json() as { error?: string }
            if (body.error) message = body.error
          } catch { /* ignore parse error */ }
          setState({ phase: 'error', message })
          return
        }

        const data = await res.json() as { sessionToken: string }
        try {
          localStorage.setItem('peerscope_session', data.sessionToken)
        } catch { /* localStorage unavailable */ }

        setState({ phase: 'success' })
        setTimeout(() => {
          window.location.replace('/portal/dashboard')
        }, 800)
      } catch {
        setState({ phase: 'error', message: 'A network error occurred. Please check your connection and try again.' })
      }
    }

    void acceptInvite()
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0F1A] flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo dark />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          {/* Loading */}
          {(state.phase === 'loading' || state.phase === 'accepting') && (
            <>
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin mx-auto mb-5" />
              <h1 className="text-base font-semibold text-white">
                {state.phase === 'loading' ? 'Checking your invite…' : 'Accepting your invite…'}
              </h1>
              <p className="text-sm text-white/40 mt-2">Just a moment, please hold on.</p>
            </>
          )}

          {/* Invalid — no token in URL */}
          {state.phase === 'invalid' && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-white">Invalid invite link</h1>
              <p className="text-sm text-white/40 mt-2 leading-relaxed">
                This link appears to be missing its verification token. Please use the link from your invite email.
              </p>
              <SupportCTA />
            </>
          )}

          {/* API error */}
          {state.phase === 'error' && (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                  <path d="M12 4L21.5 20H2.5L12 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  <path d="M12 10v4M12 16.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-white">Link expired or already used</h1>
              <p className="text-sm text-white/40 mt-2 leading-relaxed">{state.message}</p>
              <SupportCTA />
            </>
          )}

          {/* Success */}
          {state.phase === 'success' && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-base font-semibold text-white">You're in!</h1>
              <p className="text-sm text-white/40 mt-2">Redirecting to your portal…</p>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          Powered by{' '}
          <span className="text-white/40 font-medium">Peerscope</span>
        </p>
      </div>
    </div>
  )
}

function SupportCTA() {
  return (
    <div className="mt-6 pt-5 border-t border-white/10">
      <p className="text-xs text-white/30">
        Need help?{' '}
        <a
          href="mailto:onboarding@resend.dev"
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
        >
          Contact support
        </a>
      </p>
    </div>
  )
}
