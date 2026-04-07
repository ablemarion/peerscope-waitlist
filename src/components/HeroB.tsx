/**
 * Hero Variant B — Value-led (current direction)
 *
 * Angle: affordability. "Enterprise CI intelligence at SMB price."
 * Headline is the brand tagline.
 * Visual: pricing comparison table (Peerscope vs Crayon/Klue).
 * CTA: "Join the waitlist"
 */
import { useState, useEffect } from 'react'
import { EmailForm } from './shared'

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
            className="grid grid-cols-3 border-b last:border-0 transition-colors"
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
                  <circle cx="10" cy="10" r="9" fill="rgba(20,184,166,0.15)" stroke="rgba(52,214,183,0.4)" strokeWidth="1.5" />
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#2DD4BF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
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

        {/* Callout footer */}
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

export function HeroB() {
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
      <div className="w-full max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — text content, flush-left */}
          <div className="mb-12 lg:mb-0">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border"
              style={{ background: 'rgba(20,184,166,0.08)', color: '#34D6B7', borderColor: 'rgba(20,184,166,0.2)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              Now in private waitlist
            </div>

            {/* Headline — flush-left, Syne */}
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
              <span style={{ color: '#34D6B7' }}>Not your budget.</span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-lg sm:text-xl mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
            >
              Get alerts when competitors change their pricing, launch features, or post jobs.
              Built for SaaS teams. From $49/mo.
            </p>

            {/* CTA */}
            <div className="max-w-lg mb-6">
              <EmailForm placeholder="Enter your work email" buttonText="Claim founding price" size="large" variant="dark" />
              {waitlistCount !== null && waitlistCount >= 20 && (
                <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  <span aria-hidden="true">✓ </span>
                  <span className="hidden sm:inline">Join {waitlistCount.toLocaleString()} founders already tracking their competitors.</span>
                  <span className="sm:hidden">Join {waitlistCount.toLocaleString()} founders on the waitlist</span>
                </p>
              )}
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                14-day free trial &middot; No credit card required &middot; Cancel anytime
              </p>
              <p className="mt-3 text-xs font-semibold" style={{ color: 'rgba(240,124,53,0.8)' }}>
                &#9889; Founding price closes April 15 &mdash; locked for life after signup
              </p>
              {/* Mobile trust line — replaces hidden pricing table */}
              <p
                className="mt-3 text-sm font-medium md:hidden"
                style={{ color: 'rgba(52,214,183,0.85)' }}
              >
                Founding price $49/mo &middot; Save ~$19,400/yr vs Crayon
              </p>
            </div>
          </div>

          {/* Right — pricing comparison visual (desktop only) */}
          <div className="relative hidden md:block">
            {/* Decorative glow behind card */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(184,98,42,0.08) 0%, transparent 70%)',
                transform: 'scale(1.1)',
              }}
              aria-hidden="true"
            />
            <PricingComparison />
          </div>

        </div>
      </div>
    </section>
  )
}
