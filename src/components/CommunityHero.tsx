/**
 * CommunityHero — audience-specific hero for /for/[channel] landing pages.
 *
 * Swaps headline, subhead, and pain points based on the channel slug.
 * All other page sections (How it works, Testimonials, Pricing, Footer) remain standard.
 */
import { useState, useEffect } from 'react'
import { EmailForm } from './shared'
import { CountdownTimer } from './CountdownTimer'

interface ChannelConfig {
  headline: string
  subhead: string
  painPoints: string[]
  badge: string
  ref: string
}

const CHANNEL_CONFIG: Record<string, ChannelConfig> = {
  'small-business': {
    headline: 'Stop finding out your competitor changed their pricing from your customers.',
    subhead:
      'Peerscope monitors competitor websites, pricing pages, and messaging — and alerts you when something changes.',
    painPoints: [
      'A competitor dropped prices and you didn\'t notice for 3 weeks.',
      'Their new feature was everywhere on social before you\'d even discussed it internally.',
      'You\'re spending 2 hours a week on manual competitor Googling.',
    ],
    badge: 'Built for small business owners',
    ref: 'reddit-smallbusiness',
  },
  'saas': {
    headline: 'Your competitors just launched a new plan. Your sales team found out from a lost deal.',
    subhead:
      'Peerscope tracks competitor pricing, positioning, and feature changes automatically.',
    painPoints: [
      'Pricing changes you missed cost you deals.',
      'Their new positioning copied yours — you found out 6 weeks later.',
      'You need Crayon but it costs 10x more than you can justify right now.',
    ],
    badge: 'Built for SaaS founders',
    ref: 'reddit-saas',
  },
  'agencies': {
    headline: 'Your client\'s competitors moved. Do you know about it yet?',
    subhead:
      'Peerscope gives agencies real-time competitive intelligence for every client — without the enterprise price tag.',
    painPoints: [
      'Delivering a quarterly competitive review that\'s already 8 weeks stale.',
      'Monitoring 10+ client competitors manually.',
      'Crayon and Klue are priced for enterprise, not your client budgets.',
    ],
    badge: 'Built for agencies',
    ref: 'reddit-agencies',
  },
  'consultants': {
    headline: 'Your clients pay you for strategic insight. Stop guessing what their competitors charge.',
    subhead:
      'Peerscope monitors competitor pricing, messaging, and positioning across your client portfolio — automatically. So you walk into every engagement with the intel they need.',
    painPoints: [
      'You\'re advising on pricing strategy without knowing what the market actually charges.',
      'Competitive audits take 2-3 hours per client. That\'s time you\'re not billing.',
      'Your clients expect strategic recommendations. Peerscope gives you the data to back them.',
    ],
    badge: 'Built for business consultants',
    ref: 'linkedin-consultants',
  },
  'ecommerce': {
    headline: 'Your competitor just dropped their price by 20%. Your customer noticed before you did.',
    subhead:
      'Peerscope tracks competitor pricing, promotions, and messaging across your category — automatically. So you always know before your customers do.',
    painPoints: [
      'You check competitor sites manually. Once a week, if you remember. That\'s not competitive intelligence — that\'s guesswork.',
      'A single unmatched price drop can cost you 10-20 orders before you even notice.',
      'Your competitors run flash sales and seasonal promos. Peerscope catches every change within hours.',
    ],
    badge: 'Built for e-commerce stores',
    ref: 'ecommerce-community',
  },
}

export const KNOWN_CHANNELS = Object.keys(CHANNEL_CONFIG)

export function CommunityHero({ channel }: { channel: string }) {
  const config = CHANNEL_CONFIG[channel]
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => res.ok ? res.json() : null)
      .then((data: { count: number } | null) => {
        if (data && data.count > 0) setWaitlistCount(data.count)
      })
      .catch(() => {/* show nothing on error */})
  }, [])

  // Auto-set implied source in localStorage so sign-ups from bare /for/* URLs
  // are attributed to the correct channel even without a ?ref= param.
  // Explicit ?ref= param written by EmailForm at submission still takes priority.
  useEffect(() => {
    if (!config) return
    try {
      const existing = JSON.parse(localStorage.getItem('tracking') || '{}') as Record<string, string>
      if (!existing.source) {
        localStorage.setItem('tracking', JSON.stringify({ ...existing, source: config.ref }))
      }
    } catch { /* ignore – localStorage may be unavailable (private mode) */ }
  }, [config])

  if (!config) return null

  return (
    <section
      className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8"
      style={{ background: '#0D0F1A', paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — text content */}
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
              {config.badge}
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight mb-6 text-white"
              style={{
                fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(2rem, 4.5vw, 3.75rem)',
              }}
            >
              {config.headline}
            </h1>

            {/* Subhead */}
            <p
              className="text-lg sm:text-xl mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '48ch' }}
            >
              {config.subhead}
            </p>

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
                  <span aria-hidden="true">✓ </span>
                  <span className="hidden sm:inline">Join {waitlistCount.toLocaleString()} founders already tracking their competitors.</span>
                  <span className="sm:hidden">Join {waitlistCount.toLocaleString()} founders on the waitlist</span>
                </p>
              )}
              <CountdownTimer />
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No credit card required · 14-day free trial at launch
              </p>
            </div>
          </div>

          {/* Right — pain points card */}
          <div>
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
                className="px-5 py-4 border-b"
                style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono tracking-wider" style={{ color: 'rgba(239,68,68,0.7)' }}>
                    ● Sound familiar?
                  </span>
                </div>
              </div>

              {/* Pain point rows */}
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {config.painPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              {/* Footer callout */}
              <div
                className="border-t px-5 py-4"
                style={{ background: 'rgba(184,98,42,0.06)', borderColor: 'rgba(184,98,42,0.2)' }}
              >
                <p className="text-xs font-medium text-center" style={{ color: '#B8622A' }}>
                  Peerscope fixes all of this. From $49/mo.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
