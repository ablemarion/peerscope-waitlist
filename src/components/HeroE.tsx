/**
 * Hero Variant E — Problem-first, no product demo
 *
 * Hypothesis: SMB owners respond to pain recognition, not product demos.
 * Strip everything except the problem statement + immediate email capture.
 * No mockup, no animation, no visual chrome — pure conversion.
 */
import { useState, useEffect } from 'react'
import { EmailForm } from './shared'
import { CountdownTimer } from './CountdownTimer'

export function HeroE() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => res.ok ? res.json() : null)
      .then((data: { count: number } | null) => {
        if (data && data.count > 0) setWaitlistCount(data.count)
      })
      .catch(() => {/* show nothing on error */})
  }, [])

  return (
    <section
      className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8"
      style={{ background: '#0D0F1A', paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      <div className="w-full max-w-3xl mx-auto">

        {/* Eyebrow */}
        <p
          className="text-xs font-bold tracking-widest uppercase mb-6"
          style={{ color: 'rgba(20,184,166,0.8)', letterSpacing: '0.18em' }}
        >
          Competitive intelligence for SMBs
        </p>

        {/* H1 — two-line problem statement */}
        <h1
          className="font-bold leading-tight mb-6 text-white"
          style={{
            fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
          }}
        >
          Your competitors changed their pricing.
          <br />
          <span style={{ color: '#F87171' }}>You found out from a customer.</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg mb-10 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.62)', maxWidth: '52ch' }}
        >
          Peerscope tracks competitor websites, pricing, and messaging — so you always know first.
        </p>

        {/* Email form — wide, prominent */}
        <div className="w-full max-w-xl mb-4">
          <EmailForm
            placeholder="Enter your work email"
            buttonText="Claim founding price"
            size="large"
            variant="dark"
          />
        </div>

        {/* Countdown */}
        <CountdownTimer />

        {/* Social proof — suppress below 20 */}
        {waitlistCount !== null && waitlistCount >= 20 && (
          <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>
            <span aria-hidden="true">✓ </span>
            Join {waitlistCount.toLocaleString()}+ founders already on the waitlist.
          </p>
        )}

        {/* Trust line */}
        <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
          14-day free trial &middot; No credit card required &middot; Cancel anytime
        </p>

      </div>
    </section>
  )
}
