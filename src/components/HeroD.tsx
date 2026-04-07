/**
 * Hero Variant D — Problem-first with product preview
 *
 * Hypothesis: showing the actual product UI alongside the headline reduces
 * sign-up anxiety. Visitors see exactly what they're getting — a real-time
 * competitor intelligence feed — before committing their email.
 *
 * Layout: two-column desktop (copy left, feed mockup right), single-column mobile.
 * CTA: "Claim founding price"
 */
import { useState, useEffect, useRef } from 'react'
import { EmailForm } from './shared'

type ChangeType = 'pricing' | 'feature' | 'jobs' | 'content'

interface FeedRow {
  company: string
  initial: string
  accentColor: string
  type: ChangeType
  summary: string
  time: string
  isNew?: boolean
}

const FEED_DATA: FeedRow[] = [
  {
    company: 'Crayon',
    initial: 'C',
    accentColor: '#6366F1',
    type: 'pricing',
    summary: 'Pricing page updated — Pro tier removed',
    time: '2m ago',
    isNew: true,
  },
  {
    company: 'Klue',
    initial: 'K',
    accentColor: '#EC4899',
    type: 'feature',
    summary: 'New feature: AI battlecards launched',
    time: '1h ago',
    isNew: true,
  },
  {
    company: 'Competitors App',
    initial: 'A',
    accentColor: '#10B981',
    type: 'jobs',
    summary: 'Jobs: 4 new listings — engineering + growth',
    time: '3h ago',
  },
  {
    company: 'Kompyte',
    initial: 'K',
    accentColor: '#F59E0B',
    type: 'content',
    summary: 'Homepage copy change — new hero headline',
    time: '6h ago',
  },
  {
    company: 'Semrush',
    initial: 'S',
    accentColor: '#3B82F6',
    type: 'pricing',
    summary: 'Pricing: Guru plan raised $30/mo',
    time: '1d ago',
  },
]

const TYPE_LABELS: Record<ChangeType, string> = {
  pricing: 'Pricing',
  feature: 'Feature',
  jobs: 'Jobs',
  content: 'Content',
}

const TYPE_COLOURS: Record<ChangeType, { bg: string; text: string; border: string }> = {
  pricing: { bg: 'rgba(251,146,60,0.1)', text: '#F97316', border: 'rgba(251,146,60,0.25)' },
  feature: { bg: 'rgba(99,102,241,0.1)', text: '#818CF8', border: 'rgba(99,102,241,0.25)' },
  jobs: { bg: 'rgba(16,185,129,0.1)', text: '#34D399', border: 'rgba(16,185,129,0.25)' },
  content: { bg: 'rgba(148,163,184,0.08)', text: '#94A3B8', border: 'rgba(148,163,184,0.2)' },
}

type FilterTab = 'all' | ChangeType

export function CompetitorFeedMockup() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [visibleRows, setVisibleRows] = useState<number[]>([])
  const [pulseNew, setPulseNew] = useState(true)

  // Stagger row entries for a "live loading" feel
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    FEED_DATA.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleRows(prev => [...prev, i])
      }, 150 + i * 120))
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // Pulse the "live" dot every 3s
  useEffect(() => {
    const interval = setInterval(() => setPulseNew(p => !p), 3000)
    return () => clearInterval(interval)
  }, [])

  const filtered = activeTab === 'all'
    ? FEED_DATA
    : FEED_DATA.filter(r => r.type === activeTab)

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'feature', label: 'Features' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'content', label: 'Content' },
  ]

  return (
    <div className="w-full select-none" aria-hidden="true">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: '#06080F',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Radar scan overlay — plays once on mount, 400ms delay, 1.8s */}
        <div
          className="radar-scan-line absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(52,214,183,0.5) 20%, rgba(52,214,183,0.95) 50%, rgba(52,214,183,0.5) 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(52,214,183,0.5), 0 2px 6px rgba(52,214,183,0.2)',
          }}
        />
        {/* Window chrome */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
            </div>
            <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
              peerscope · competitor feed
            </span>
          </div>
          {/* Live badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'rgba(52,214,183,0.08)', color: '#34D6B7', border: '1px solid rgba(52,214,183,0.2)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full transition-opacity duration-700"
              style={{ background: '#34D6B7', opacity: pulseNew ? 1 : 0.3 }}
            />
            Live
          </div>
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-0.5 px-3 py-2 border-b overflow-x-auto"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.04)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeTab === tab.id ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)',
                border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feed rows */}
        <div className="divide-y divide-white/[0.04]">
          {filtered.map((row) => {
            const globalIndex = FEED_DATA.indexOf(row)
            const isVisible = visibleRows.includes(globalIndex)
            const colours = TYPE_COLOURS[row.type]
            return (
              <div
                key={row.company + row.summary}
                className="flex items-start gap-3 px-4 py-3 transition-all duration-300"
                style={{
                  background: row.isNew ? 'rgba(52,214,183,0.03)' : 'transparent',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(6px)',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {/* Company avatar */}
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `${row.accentColor}18`,
                    color: row.accentColor,
                    border: `1px solid ${row.accentColor}30`,
                  }}
                >
                  {row.initial}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {row.company}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: colours.bg, color: colours.text, border: `1px solid ${colours.border}` }}
                    >
                      {TYPE_LABELS[row.type]}
                    </span>
                    {row.isNew && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: 'rgba(52,214,183,0.1)', color: '#34D6B7', border: '1px solid rgba(52,214,183,0.2)' }}
                      >
                        new
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.42)' }}>
                    {row.summary}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 text-xs tabular-nums" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {row.time}
                </span>
              </div>
            )
          })}
        </div>

        {/* Bottom status bar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-t"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Monitoring 5 competitors
          </p>
          <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.15)' }}>
            Updated just now
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroD() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const [heroInView, setHeroInView] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => res.ok ? res.json() : null)
      .then((data: { count: number } | null) => {
        if (data && typeof data.count === 'number') setWaitlistCount(data.count)
      })
      .catch(() => {/* show nothing on error */})
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  return (
    <>
    <section
      ref={heroRef}
      className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-6 pb-8 sm:pt-10 sm:pb-10 lg:pt-12 lg:pb-12"
      style={{ background: '#0D0F1A' }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">

          {/* Left — headline + form */}
          <div className="mb-12 lg:mb-0">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-4 sm:mb-6 lg:mb-8 border"
              style={{ background: 'rgba(20,184,166,0.08)', color: '#34D6B7', borderColor: 'rgba(20,184,166,0.2)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              Real-time competitor intelligence
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight mb-4 sm:mb-6 text-white"
              style={{
                fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              }}
            >
              Track your competitors.{' '}
              <span style={{ color: '#F07C35' }}>Not your budget.</span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-base sm:text-xl mb-3 sm:mb-4 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
            >
              Peerscope watches your competitors 24/7 - pricing changes, new features, job listings -
              and alerts you the moment something shifts. Built for SaaS teams. From $49/mo.
            </p>

            {/* Social proof */}
            {waitlistCount !== null && waitlistCount > 0 && (
              <p className="text-sm font-medium mb-4 sm:mb-6 lg:mb-8" style={{ color: '#34D6B7' }}>
                Join {waitlistCount.toLocaleString()} founders already tracking their competitors.
              </p>
            )}
            {(waitlistCount === null || waitlistCount === 0) && (
              <p className="text-sm font-medium mb-4 sm:mb-6 lg:mb-8" style={{ color: 'rgba(52,214,183,0.7)' }}>
                No more flying blind. Know what your competitors are doing, before your customers do.
              </p>
            )}

            {/* CTA */}
            <div className="max-w-lg mb-4">
              <EmailForm
                placeholder="Enter your work email"
                buttonText="Claim founding price"
                size="large"
                variant="dark"
                onSuccess={() => setSubmitted(true)}
              />
              {waitlistCount !== null && waitlistCount > 0 && (
                <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  <span aria-hidden="true">✓ </span>Join {waitlistCount.toLocaleString()} founders already waiting
                </p>
              )}
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Founding price $49/mo &middot; No credit card now &middot; Cancel anytime
              </p>
              <p className="mt-3 text-xs font-semibold" style={{ color: 'rgba(240,124,53,0.8)' }}>
                &#9889; Founding price closes April 15 &mdash; locked for life after signup
              </p>
            </div>
          </div>

          {/* Right — product feed mockup */}
          <div className="relative">
            {/* Glow behind the mockup */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 60% 40%, rgba(52,214,183,0.07) 0%, rgba(184,98,42,0.05) 50%, transparent 75%)',
                transform: 'scale(1.15)',
              }}
              aria-hidden="true"
            />
            <CompetitorFeedMockup />

            {/* Floating "alert" callout — appears beside the mockup on desktop */}
            <div
              className="hidden lg:flex absolute -right-6 top-1/3 items-start gap-2.5 rounded-xl px-3.5 py-2.5 shadow-xl"
              style={{
                background: '#0D0F1A',
                border: '1px solid rgba(251,146,60,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                transform: 'translateX(100%)',
                maxWidth: '200px',
              }}
            >
              <div
                className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)' }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v5M5 8.5v.5" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#F97316' }}>Slack alert sent</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Crayon updated pricing</p>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile mockup - shown below the form */}
        <div className="mt-12 lg:hidden">
          <p className="text-xs font-mono text-center mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
            — what you'll see inside peerscope —
          </p>
          <CompetitorFeedMockup />
        </div>

      </div>
    </section>

    {/* Mobile sticky email CTA — visible while hero is in view, hidden after submit */}
    {heroInView && !submitted && (
      <div
        className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 pb-safe pb-4 pt-3"
        style={{
          background: '#0D0F1A',
          borderTop: '1px solid #B8622A',
        }}
      >
        <EmailForm
          placeholder="Enter your work email"
          buttonText="Claim founding price"
          size="default"
          variant="dark"
          onSuccess={() => setSubmitted(true)}
        />
      </div>
    )}
    </>
  )
}
