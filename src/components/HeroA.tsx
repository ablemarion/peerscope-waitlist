/**
 * Hero Variant A — Problem-led
 *
 * Angle: urgency + fear of missing competitor moves.
 * Headline stresses the pain of finding out too late.
 * Visual: mock in-app alert showing a competitor price change detection.
 * CTA: "Start monitoring free"
 */
import { useState, useEffect } from 'react'
import { EmailForm } from './shared'

function AlertMockup() {
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
        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
            </div>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>peerscope alert</span>
          </div>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>2 min ago</span>
        </div>

        <div className="p-4">
          {/* Primary alert */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{ background: '#0A0C15', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Bluestone Plumbing Co. — Pricing page</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                Price ↑
              </span>
            </div>

            {/* Diff lines */}
            <div className="space-y-1.5 font-mono text-xs">
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)' }}
              >
                <span style={{ color: '#EF4444' }}>−</span>
                <span style={{ color: 'rgba(252,165,165,0.6)', textDecoration: 'line-through' }}>Pro Plan: $79/mo</span>
              </div>
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded"
                style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.14)' }}
              >
                <span style={{ color: '#10B981' }}>+</span>
                <span style={{ color: 'rgba(167,243,208,0.9)' }}>Pro Plan: $99/mo</span>
                <span className="ml-auto font-sans font-semibold" style={{ color: 'rgba(16,185,129,0.65)' }}>+25%</span>
              </div>
            </div>
          </div>

          {/* Secondary alert preview */}
          <div
            className="rounded-xl p-3 mb-4"
            style={{ background: '#0A0C15', border: '1px solid rgba(255,255,255,0.05)', opacity: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Clearpath Logistics — Jobs page</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                New role
              </span>
            </div>
            <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Sr. Engineer — AI/ML Platform{' '}
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>· 3 hrs ago</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="flex-1 text-xs text-white px-3 py-2.5 rounded-lg font-semibold transition"
              style={{ background: '#B8622A' }}
            >
              View full diff
            </button>
            <button
              className="text-xs px-3 py-2.5 rounded-lg border transition"
              style={{ color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.1)' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroA() {
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
      style={{ background: '#0F172A', paddingTop: '3rem', paddingBottom: '3rem' }}
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
              Your competitors changed their pricing{' '}
              <span style={{ color: '#F87171' }}>last week.</span>
              <br className="hidden sm:block" />
              Did you notice?
            </h1>

            {/* Sub-headline */}
            <p
              className="text-lg sm:text-xl mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
            >
              Peerscope monitors competitor pricing pages, feature releases, and job postings 24/7.
              Get instant alerts the moment something changes - not a weekly digest.
            </p>

            {/* CTA */}
            <div className="max-w-lg mb-6">
              <EmailForm placeholder="Enter your work email" buttonText="Start monitoring free" size="large" variant="dark" />
              <p className="mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                14-day free trial &middot; No credit card required &middot; Cancel anytime
              </p>
              {waitlistCount !== null && waitlistCount >= 20 ? (
                <p className="mt-2 text-sm font-medium" style={{ color: '#34D6B7' }}>
                  Join {waitlistCount.toLocaleString()} founders already tracking their competitors.
                </p>
              ) : (
                <p className="mt-2 text-sm font-medium" style={{ color: '#34D6B7' }}>
                  Early access — limited spots before public launch
                </p>
              )}
            </div>
          </div>

          {/* Right — alert mockup */}
          <div className="relative">
            {/* Decorative glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(184,98,42,0.08) 0%, transparent 70%)',
                transform: 'scale(1.1)',
              }}
              aria-hidden="true"
            />
            <AlertMockup />
          </div>

        </div>
      </div>
    </section>
  )
}
