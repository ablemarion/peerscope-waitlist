/**
 * /lp — Dedicated paid traffic landing page (LinkedIn Ads)
 *
 * Optimised for conversion from paid traffic:
 * - No navigation or footer (removes exit points)
 * - Variant B copy (value-led — our proven winner)
 * - FAQ strip immediately below hero
 * - Email form front and centre
 * - Countdown timer + urgency messaging
 * - source=linkedin-ads captured on every sign-up
 * - No lazy loading, no animations — <1s LCP
 */
import { useState } from 'react'
import { Logo, EmailForm } from './shared'
import { CountdownTimer } from './CountdownTimer'
import { HeroBFAQStrip } from './HeroBFAQStrip'
import { LiveSignupCount } from './LiveSignupCount'

function PricingComparison() {
  const rows = [
    { tool: 'Crayon', price: '$20k+ /yr', smb: false },
    { tool: 'Klue', price: '$12k+ /yr', smb: false },
    { tool: 'Peerscope', price: '$49 /mo', smb: true, highlight: true },
  ]

  return (
    <div className="w-full select-none" aria-hidden="true">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#06080F',
          border: '1px solid rgba(184,98,42,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(184,98,42,0.06)',
        }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-3 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="px-4 sm:px-5 py-3 text-xs font-mono tracking-wider" style={{ color: 'rgba(255,255,255,0.28)' }}>Tool</div>
          <div className="px-4 sm:px-5 py-3 text-xs font-mono tracking-wider text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>Price</div>
          <div className="px-4 sm:px-5 py-3 text-xs font-mono tracking-wider text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>SMB</div>
        </div>

        {/* Table rows */}
        {rows.map(row => (
          <div
            key={row.tool}
            className="grid grid-cols-3 border-b last:border-0"
            style={{
              borderColor: 'rgba(255,255,255,0.04)',
              background: row.highlight ? 'rgba(184,98,42,0.07)' : undefined,
            }}
          >
            <div
              className="px-4 sm:px-5 py-3.5 text-sm font-semibold"
              style={{ color: row.highlight ? '#F07C35' : 'rgba(255,255,255,0.38)' }}
            >
              {row.highlight ? (
                <span className="flex items-center gap-1.5">
                  {row.tool}
                  <span style={{ color: '#B8622A' }} className="text-xs font-bold">★</span>
                </span>
              ) : row.tool}
            </div>
            <div
              className="px-4 sm:px-5 py-3.5 text-sm text-center font-mono"
              style={{
                color: row.highlight ? '#F07C35' : 'rgba(255,255,255,0.3)',
                textDecoration: row.highlight ? undefined : 'line-through',
                opacity: row.highlight ? undefined : 0.55,
                fontWeight: row.highlight ? 700 : undefined,
              }}
            >
              {row.price}
            </div>
            <div className="px-4 sm:px-5 py-3.5 flex items-center justify-center">
              {row.smb ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="rgba(200,220,232,0.15)" stroke="rgba(200,220,232,0.4)" strokeWidth="1.5" />
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="rgba(200,220,232,0.8)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" style={{ opacity: 0.45 }}>
                  <circle cx="10" cy="10" r="9" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#EF4444" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              )}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div
          className="border-t px-4 sm:px-5 py-3"
          style={{ background: 'rgba(184,98,42,0.06)', borderColor: 'rgba(184,98,42,0.2)' }}
        >
          <p className="text-xs text-center font-medium" style={{ color: '#B8622A' }}>
            Save ~$19,400/year vs enterprise tools
          </p>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [done, setDone] = useState(false)

  return (
    <div
      className="min-h-screen font-[Inter,system-ui,sans-serif]"
      style={{ background: '#0D0F1A', color: '#FAFAF6' }}
    >
      {/* Minimal logo-only header — no nav links, no exit points */}
      <header className="border-b px-4 sm:px-6 py-4 flex justify-center" style={{ borderColor: 'rgba(184,98,42,0.12)' }}>
        <Logo dark />
      </header>

      {/* Hero */}
      <section
        className="px-4 sm:px-6 lg:px-8"
        style={{ paddingTop: '3.5rem', paddingBottom: '3rem' }}
      >
        <div className="w-full max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

            {/* Left — copy */}
            <div className="mb-12 lg:mb-0">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border"
                style={{ background: 'rgba(200,220,232,0.08)', color: '#C8DCE8', borderColor: 'rgba(200,220,232,0.2)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8DCE8] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8DCE8]" />
                </span>
                Now in private waitlist
              </div>

              {/* Headline */}
              <h1
                className="font-bold leading-tight mb-6 text-white"
                style={{
                  fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                }}
              >
                Track your competitors.{' '}
                <span style={{ color: '#C8DCE8' }}>Not your budget.</span>
              </h1>

              {/* Subheadline */}
              <p
                className="text-lg sm:text-xl mb-10 leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
              >
                Get alerts when competitors change their pricing, launch features, or post jobs.
                Built for SaaS teams. From $49/mo.
              </p>

              {/* Email form — front and centre */}
              {done ? (
                <div
                  className="max-w-lg rounded-xl px-6 py-5 border"
                  style={{ background: 'rgba(200,220,232,0.06)', borderColor: 'rgba(200,220,232,0.2)' }}
                >
                  <p className="font-bold text-lg text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                    You&apos;re on the list.
                  </p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    We&apos;ll reach out before launch. Founding price is locked in.
                  </p>
                </div>
              ) : (
                <div className="max-w-lg">
                  <EmailForm
                    placeholder="Enter your work email"
                    buttonText="Reserve founding price →"
                    buttonVariant="v1"
                    size="large"
                    variant="dark"
                    defaultSource="linkedin-ads"
                    onSuccess={() => setDone(true)}
                  />
                  <LiveSignupCount />
                  <CountdownTimer />
                  <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    14-day free trial &middot; No credit card required &middot; Cancel anytime
                  </p>
                  <p className="mt-3 text-xs font-semibold" style={{ color: 'rgba(240,124,53,0.85)' }}>
                    &#9889; Founding price closes April 15 &mdash; locked for life after signup
                  </p>
                  <p
                    className="mt-3 text-sm font-medium md:hidden"
                    style={{ color: 'rgba(200,220,232,0.85)' }}
                  >
                    Founding price $49/mo &middot; Save ~$19,400/yr vs Crayon
                  </p>
                </div>
              )}
            </div>

            {/* Right — pricing comparison (desktop only) */}
            <div className="hidden md:block">
              <PricingComparison />
            </div>

          </div>
        </div>
      </section>

      {/* FAQ strip — objection-handling directly below hero */}
      <HeroBFAQStrip />

      {/* Second CTA — below FAQ for scrollers */}
      {!done && (
        <section
          className="px-4 sm:px-6 py-16 text-center"
          style={{ background: '#111320', borderTop: '1px solid rgba(184,98,42,0.08)' }}
        >
          <p
            className="text-2xl font-bold mb-2 text-white"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}
          >
            Ready to stop guessing what your competitors are doing?
          </p>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Join the waitlist. Founding price closes April 15.
          </p>
          <div className="max-w-md mx-auto">
            <EmailForm
              placeholder="Enter your work email"
              buttonText="Reserve founding price →"
              buttonVariant="v1"
              size="large"
              variant="dark"
              defaultSource="linkedin-ads"
              onSuccess={() => setDone(true)}
            />
          </div>
        </section>
      )}

      {/* Minimal footer — no links, just brand + legal */}
      <footer
        className="px-4 py-8 text-center border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          &copy; {new Date().getFullYear()} Peerscope &middot; Track your competitors. Not your budget.
        </p>
      </footer>
    </div>
  )
}
