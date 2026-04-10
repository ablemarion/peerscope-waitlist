/**
 * Hero Variant C — Social proof + founding urgency
 *
 * Angle: scarcity + founding cohort identity.
 * Hypothesis: visitors who feel they're joining a small founding group convert
 * better than those who see a product pitch or pricing comparison.
 *
 * Headline: founding seat counter with live taken count.
 * Visual: founding seats tracker — progress bar, recent join signals, locked price.
 * CTA: "Claim my founding seat"
 */
import { useState, useEffect } from 'react'
import { EmailForm } from './shared'
import { CountdownTimer } from './CountdownTimer'

const TOTAL_SEATS = 50

function FoundingSeatsCard({ takenCount }: { takenCount: number }) {
  const taken = Math.min(takenCount, TOTAL_SEATS - 1)
  const remaining = TOTAL_SEATS - taken
  const pct = Math.round((taken / TOTAL_SEATS) * 100)

  const recentJoins = [
    { initials: 'AK', company: 'Saas startup · Sydney', delay: 0 },
    { initials: 'JM', company: 'B2B tool · London', delay: 120 },
    { initials: 'RB', company: 'Dev tools · Toronto', delay: 240 },
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
        {/* Card header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
            </div>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>founding seats</span>
          </div>
          {/* Lock badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'rgba(184,98,42,0.12)', color: '#F07C35', border: '1px solid rgba(184,98,42,0.25)' }}
          >
            <svg width="10" height="11" viewBox="0 0 10 11" fill="none">
              <rect x="1" y="4.5" width="8" height="6" rx="1.5" fill="none" stroke="#F07C35" strokeWidth="1.2" />
              <path d="M3 4.5V3a2 2 0 0 1 4 0v1.5" stroke="#F07C35" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Price locked forever
          </div>
        </div>

        <div className="p-5">
          {/* Seat counter */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold tabular-nums" style={{ fontFamily: "'Syne', system-ui, sans-serif", color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                {taken}
                <span className="text-base font-normal ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/ {TOTAL_SEATS}</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>seats claimed</p>
            </div>
            <div className="text-right">
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: remaining <= 10 ? '#F87171' : '#F07C35', letterSpacing: '-0.02em' }}
              >
                {remaining}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>remaining</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mb-5">
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 6, background: 'rgba(255,255,255,0.07)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #B8622A 0%, #F07C35 100%)',
                  boxShadow: '0 0 8px rgba(240,124,53,0.5)',
                }}
              />
            </div>
            <p className="text-xs mt-1.5 text-right" style={{ color: 'rgba(255,255,255,0.2)' }}>{pct}% full</p>
          </div>

          {/* Recent joins */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div
              className="px-4 py-2 border-b"
              style={{ background: '#0A0C15', borderColor: 'rgba(255,255,255,0.05)' }}
            >
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>recent joins</p>
            </div>
            {recentJoins.map((join, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                style={{ background: '#06080F', borderColor: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(184,98,42,0.15)', color: '#F07C35', border: '1px solid rgba(184,98,42,0.2)' }}
                >
                  {join.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Founder
                  </p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{join.company}</p>
                </div>
                <div
                  className="ml-auto flex-shrink-0 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(200,220,232,0.1)', color: '#C8DCE8', border: '1px solid rgba(200,220,232,0.15)' }}
                >
                  ✓
                </div>
              </div>
            ))}
          </div>

          {/* Founding price callout */}
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'rgba(184,98,42,0.07)', border: '1px solid rgba(184,98,42,0.18)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold" style={{ color: '#F07C35' }}>Founding member price</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Resets to $99/mo at launch</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold" style={{ color: '#F07C35', fontFamily: "'Syne', system-ui, sans-serif" }}>$49</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>/mo forever</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroC() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => res.ok ? res.json() : null)
      .then((data: { count: number } | null) => {
        if (data && typeof data.count === 'number') setWaitlistCount(data.count)
      })
      .catch(() => {/* show nothing on error */})
  }, [])

  // Clamp: never show 0 (looks empty) or 50 (looks full/closed)
  const displayCount = waitlistCount !== null
    ? Math.max(1, Math.min(waitlistCount, TOTAL_SEATS - 1))
    : 23 // sensible placeholder while loading

  const remaining = TOTAL_SEATS - Math.min(displayCount, TOTAL_SEATS - 1)

  return (
    <section
      className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8"
      style={{ background: '#0D0F1A', paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — text content */}
          <div className="mb-12 lg:mb-0">
            {/* Urgency badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border"
              style={{ background: 'rgba(184,98,42,0.1)', color: '#F07C35', borderColor: 'rgba(184,98,42,0.25)' }}
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                <circle cx="4" cy="4" r="4" fill="#F07C35" opacity="0.3" />
                <circle cx="4" cy="4" r="2" fill="#F07C35" />
              </svg>
              {remaining} founding {remaining === 1 ? 'seat' : 'seats'} remaining
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight mb-6 text-white"
              style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              }}
            >
              Only {TOTAL_SEATS} founding seats.{' '}
              <span style={{ color: '#F07C35' }}>
                {displayCount} taken.
              </span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-lg sm:text-xl mb-4 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
            >
              Founding members lock in $49/mo forever - the price resets to $99 when we launch publicly. Once {TOTAL_SEATS} seats are gone, they're gone.
            </p>

            {/* Trust signal */}
            {waitlistCount !== null && waitlistCount >= 20 && (
              <p
                className="text-sm font-medium mb-8"
                style={{ color: '#C8DCE8' }}
              >
                Join {waitlistCount.toLocaleString()} founders already tracking their competitors.
              </p>
            )}
            {(waitlistCount === null || waitlistCount === 0) && (
              <p className="text-sm font-medium mb-8" style={{ color: '#C8DCE8' }}>
                Competitive intelligence built for SaaS teams, not enterprise budgets.
              </p>
            )}

            {/* CTA */}
            <div className="max-w-lg mb-6">
              <EmailForm
                placeholder="Enter your work email"
                buttonText="Claim founding price"
                size="large"
                variant="dark"
              />
              {waitlistCount !== null && waitlistCount >= 20 && (
                <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  <span aria-hidden="true">✓ </span>Join {waitlistCount.toLocaleString()} founders already waiting
                </p>
              )}
              <CountdownTimer />
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Founding price locked forever &middot; No credit card now &middot; Cancel anytime
              </p>
            </div>
          </div>

          {/* Right — founding seats tracker */}
          <div className="relative">
            {/* Glow */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(184,98,42,0.1) 0%, transparent 70%)',
                transform: 'scale(1.1)',
              }}
              aria-hidden="true"
            />
            <FoundingSeatsCard takenCount={displayCount} />
          </div>

        </div>
      </div>
    </section>
  )
}
