/**
 * Hero Variant B — Value-led (current direction)
 *
 * Angle: affordability. "Enterprise CI intelligence at SMB price."
 * Headline is the brand tagline.
 * Visual: pricing comparison table (Peerscope vs Crayon/Klue).
 * CTA: "Join the waitlist"
 */
import { useState } from 'react'
import { EmailForm } from './shared'
import { CountdownTimer } from './CountdownTimer'
import { LiveSignupCount } from './LiveSignupCount'

const BUTTON_VARIANTS = [
  { key: 'control', text: 'Join the waitlist \u2192' },
  { key: 'v1', text: 'Reserve founding price \u2192' },
  { key: 'v2', text: 'Get early access - closes Apr 15 \u2192' },
] as const

type ButtonVariantKey = typeof BUTTON_VARIANTS[number]['key']

function pickButtonVariant(): ButtonVariantKey {
  const stored = sessionStorage.getItem('ps_btn_v') as ButtonVariantKey | null
  if (stored && BUTTON_VARIANTS.some(v => v.key === stored)) return stored
  const idx = Math.floor(Math.random() * BUTTON_VARIANTS.length)
  const key = BUTTON_VARIANTS[idx].key
  sessionStorage.setItem('ps_btn_v', key)
  return key
}

function PricingComparison() {
  const rows = [
    { tool: 'Crayon', price: '$20k+ /yr', smb: false },
    { tool: 'Klue', price: '$12k+ /yr', smb: false },
    { tool: 'Peerscope', price: '$49 /mo', smb: true, highlight: true },
  ]

  return (
    <div className="w-full select-none" aria-hidden="true">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: '#06080F',
          border: '1px solid rgba(184,98,42,0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(184,98,42,0.06)',
        }}
      >
        {/* Radar scan overlay — plays once on mount, 400ms delay, 1.8s */}
        <div
          className="radar-scan-line absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,220,232,0.4) 20%, rgba(200,220,232,0.85) 50%, rgba(200,220,232,0.4) 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(200,220,232,0.4), 0 2px 6px rgba(200,220,232,0.15)',
          }}
          aria-hidden="true"
        />
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
  const [buttonVariantKey] = useState<ButtonVariantKey>(() => pickButtonVariant())
  const buttonVariant = BUTTON_VARIANTS.find(v => v.key === buttonVariantKey)!

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
              style={{ background: 'rgba(200,220,232,0.08)', color: '#C8DCE8', borderColor: 'rgba(200,220,232,0.2)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8DCE8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8DCE8]" />
              </span>
              Now in private waitlist
            </div>

            {/* Headline — flush-left, Syne */}
            <h1
              className="font-bold leading-tight mb-6 text-white"
              style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              }}
            >
              Track your competitors.{' '}
              <span style={{ color: '#C8DCE8' }}>Not your budget.</span>
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
              <EmailForm placeholder="Enter your work email" buttonText={buttonVariant.text} buttonVariant={buttonVariantKey} size="large" variant="dark" />
              <LiveSignupCount />
              <CountdownTimer />
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                14-day free trial &middot; No credit card required &middot; Cancel anytime
              </p>
              <p className="mt-3 text-xs font-semibold" style={{ color: 'rgba(240,124,53,0.8)' }}>
                &#9889; Founding price closes April 15 &mdash; locked for life after signup
              </p>
              {/* Mobile trust line — replaces hidden pricing table */}
              <p
                className="mt-3 text-sm font-medium md:hidden"
                style={{ color: 'rgba(200,220,232,0.85)' }}
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
