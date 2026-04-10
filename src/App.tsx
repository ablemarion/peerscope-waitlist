import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import './App.css'
import { Logo, EmailForm } from './components/shared'
import { FoundingBanner } from './components/FoundingBanner'
import { SocialProofStrip } from './components/SocialProofStrip'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'
import { CommunityHero, KNOWN_CHANNELS } from './components/CommunityHero'
import { HeroBFAQStrip } from './components/HeroBFAQStrip'

const HeroA = lazy(() => import('./components/HeroA').then(m => ({ default: m.HeroA })))
const HeroB = lazy(() => import('./components/HeroB').then(m => ({ default: m.HeroB })))
const HeroC = lazy(() => import('./components/HeroC').then(m => ({ default: m.HeroC })))
const HeroD = lazy(() => import('./components/HeroD').then(m => ({ default: m.HeroD })))
const HeroE = lazy(() => import('./components/HeroE').then(m => ({ default: m.HeroE })))
const CompetitorFeedMockup = lazy(() => import('./components/HeroD').then(m => ({ default: m.CompetitorFeedMockup })))
const HowItWorks = lazy(() => import('./components/HowItWorks').then(m => ({ default: m.HowItWorks })))
const ExitIntentModal = lazy(() => import('./components/ExitIntentModal').then(m => ({ default: m.ExitIntentModal })))

function RevealDiv({
  staggerMs = 0,
  scale = false,
  className,
  style,
  children,
}: {
  staggerMs?: number
  scale?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const ref = useRevealOnScroll(staggerMs)
  return (
    <div ref={ref as React.Ref<HTMLDivElement>} className={`${scale ? 'reveal-scale' : 'reveal'} ${className ?? ''}`} style={style}>
      {children}
    </div>
  )
}

// Animated 3-state setup flow — replaces generic numbered steps
function SetupFlow() {
  const [step, setStep] = useState(0)
  const [typedUrl, setTypedUrl] = useState('')
  const [scanLines, setScanLines] = useState<string[]>([])

  const STEPS = [
    { label: 'Paste a URL', desc: 'Add any competitor URL — pricing page, homepage, job board. No engineering required.' },
    { label: 'We scan 24/7', desc: 'Peerscope continuously monitors for changes around the clock. Zero effort from you.' },
    { label: 'You get alerted', desc: 'Instant Slack or email the moment something changes. Not a weekly digest.' },
  ]

  const URL_TARGET = 'bluestoneplumbing.com/pricing'

  useEffect(() => {
    if (step !== 0) return
    setTypedUrl('')
    let i = 0
    const timer = setInterval(() => {
      i++
      setTypedUrl(URL_TARGET.slice(0, i))
      if (i >= URL_TARGET.length) clearInterval(timer)
    }, 60)
    return () => clearInterval(timer)
  }, [step])

  useEffect(() => {
    if (step !== 1) return
    setScanLines([])
    const lines = ['↳ pricing page scanned', '↳ feature page scanned', '↳ job board scanned', '↳ G2 reviews checked']
    lines.forEach((line, i) => {
      setTimeout(() => setScanLines(prev => [...prev, line]), i * 420)
    })
  }, [step])

  useEffect(() => {
    const timer = setInterval(() => setStep(s => (s + 1) % 3), 3800)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      {/* Step list */}
      <div className="flex flex-col">
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="flex items-start gap-6 py-8 border-b last:border-b-0 text-left transition-all"
            style={{ borderColor: 'rgba(250,250,246,0.06)' }}
          >
            <span
              className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-all"
              style={{
                background: step === i ? '#B8622A' : 'rgba(184,98,42,0.1)',
                color: step === i ? 'white' : 'rgba(184,98,42,0.45)',
                border: `2px solid ${step === i ? '#B8622A' : 'rgba(184,98,42,0.2)'}`,
              }}
            >
              {i + 1}
            </span>
            <div className="pt-1">
              <h3
                className="text-xl font-bold mb-1.5"
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  color: step === i ? 'white' : 'rgba(250,250,246,0.35)',
                }}
              >
                {s.label}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: step === i ? 'rgba(250,250,246,0.55)' : 'rgba(250,250,246,0.18)', maxWidth: '36ch' }}
              >
                {s.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Demo panel */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#06080F',
          border: '1px solid rgba(184,98,42,0.22)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          minHeight: '280px',
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#1e2030' }} />
          <span className="ml-2 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>peerscope — setup</span>
        </div>

        <div className="p-6 min-h-[200px]">
          {step === 0 && (
            <div>
              <p className="text-xs font-mono mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>Add a competitor URL</p>
              <div
                className="flex items-center gap-1 rounded-lg px-4 py-3 font-mono text-sm mb-4"
                style={{ background: '#111320', border: '1px solid rgba(184,98,42,0.4)' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.25)' }}>https://</span>
                <span style={{ color: 'white' }}>{typedUrl}</span>
                <span className="w-0.5 h-4 ml-0.5 animate-pulse" style={{ background: '#B8622A' }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {['Pricing page', 'Features', 'Jobs', 'G2 reviews'].map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded font-mono"
                    style={{ background: 'rgba(184,98,42,0.08)', color: 'rgba(184,98,42,0.6)', border: '1px solid rgba(184,98,42,0.15)' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#B8622A] animate-pulse" />
                <span className="text-xs font-mono" style={{ color: '#B8622A' }}>scanning bluestoneplumbing.com</span>
              </div>
              <div className="space-y-2">
                {scanLines.map((line, i) => (
                  <div
                    key={i}
                    className="text-xs font-mono py-1.5 px-3 rounded"
                    style={{ color: 'rgba(52,214,183,0.8)', background: 'rgba(20,184,166,0.05)' }}
                  >
                    {line}
                  </div>
                ))}
                {scanLines.length < 4 && (
                  <div className="text-xs font-mono py-1.5 px-3 flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    <span className="inline-block w-3 h-0.5 rounded animate-pulse" style={{ background: 'rgba(184,98,42,0.4)' }} />
                    scanning...
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-xs font-mono mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Slack alert fired</p>
              <div className="rounded-xl p-4" style={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: '#B8622A', color: 'white' }}
                  >
                    P
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">Peerscope</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(52,214,183,0.1)', color: '#34D6B7' }}>App</span>
                    </div>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      🔔 <strong>Bluestone Plumbing Co.</strong> changed their pricing
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Pro Plan:{' '}
                      <span style={{ textDecoration: 'line-through' }}>$79/mo</span>
                      {' → '}
                      <span style={{ color: '#F07C35' }}>$99/mo</span>
                    </p>
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>just now · #competitor-intel</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-1.5 px-6 pb-5">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="flex-1 min-h-[44px] flex items-center justify-center"
              aria-label={`Go to step ${i + 1}`}
            >
              <span
                className="h-1 w-full rounded-full transition-all"
                style={{ background: step === i ? '#B8622A' : 'rgba(184,98,42,0.15)' }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Assign and persist a hero variant for this session.
// URL param ?variant=a/b/c/d/e overrides random assignment.
// Without param: weighted random — B is winner at 70%, others 7.5% each.
// Data: B=8 signups (44 views), A/C/D/E=0 signups as of 2026-04-10.
const HERO_VARIANTS = ['a', 'b', 'c', 'd', 'e'] as const
type HeroVariant = typeof HERO_VARIANTS[number]

// Cumulative weights: B=70%, A/C/D/E=7.5% each
const VARIANT_WEIGHTS: Record<HeroVariant, number> = { b: 0.70, a: 0.775, c: 0.85, d: 0.925, e: 1.0 }

function pickWeightedVariant(): HeroVariant {
  const r = Math.random()
  for (const [variant, threshold] of Object.entries(VARIANT_WEIGHTS) as [HeroVariant, number][]) {
    if (r < threshold) return variant
  }
  return 'b'
}

function useHeroVariant(): HeroVariant {
  const params = new URLSearchParams(window.location.search)
  const urlParam = params.get('variant')?.toLowerCase()
  if (urlParam === 'a' || urlParam === 'b' || urlParam === 'c' || urlParam === 'd' || urlParam === 'e') {
    return urlParam
  }
  const stored = sessionStorage.getItem('hero_variant') as HeroVariant | null
  if (stored && HERO_VARIANTS.includes(stored)) return stored
  const assigned = pickWeightedVariant()
  sessionStorage.setItem('hero_variant', assigned)
  return assigned
}

function Hero() {
  const variant = useHeroVariant()
  if (variant === 'a') return <Suspense fallback={null}><HeroA /></Suspense>
  if (variant === 'c') return <Suspense fallback={null}><HeroC /></Suspense>
  if (variant === 'd') return <Suspense fallback={null}><HeroD /></Suspense>
  if (variant === 'e') return <Suspense fallback={null}><HeroE /></Suspense>
  return <Suspense fallback={null}><HeroB /></Suspense>
}


// Realistic Peerscope live feed — replaces generic icon+text cards
function ProductFeed() {
  const [entered, setEntered] = useState(false)
  const [newCount, setNewCount] = useState(3)
  const [elapsedSec, setElapsedSec] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const mountTimeRef = useRef(Date.now())

  // Detect viewport entry → trigger staggered animation and counter increment
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    let counterTimer: ReturnType<typeof setTimeout>
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true)
          observer.unobserve(el)
          counterTimer = setTimeout(() => setNewCount(4), 4000)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      clearTimeout(counterTimer)
    }
  }, [])

  // Live timestamp: tick every second for the first 60s since mount
  useEffect(() => {
    const interval = setInterval(() => {
      const sec = Math.floor((Date.now() - mountTimeRef.current) / 1000)
      setElapsedSec(sec)
      if (sec >= 60) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const timestamp = elapsedSec < 60 ? `${elapsedSec} sec ago` : '2 min ago'

  // Inner wrapper style: invisible before entry, then animation takes over
  const itemInner = (delay: number): { className: string; style: React.CSSProperties } => ({
    className: entered ? 'feed-item-enter' : '',
    style: entered ? { animationDelay: `${delay}ms` } : { opacity: 0 },
  })

  return (
    <div
      ref={rootRef}
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#06080F',
        border: '1px solid rgba(184,98,42,0.22)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(184,98,42,0.08)',
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
          <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>peerscope — live feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B8622A] animate-pulse" />
          <span className="text-xs font-mono" style={{ color: '#B8622A' }}>{newCount} new</span>
        </div>
      </div>

      {/* Feed item 1 — pricing change */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div {...itemInner(0)}>
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{ color: '#F07C35', background: 'rgba(184,98,42,0.12)', border: '1px solid rgba(184,98,42,0.28)' }}
              >
                PRICE ↑
              </span>
              <span className="text-sm font-semibold text-white">Bluestone Plumbing Co.</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{timestamp}</span>
          </div>
          <p className="text-xs font-mono mb-2.5" style={{ color: 'rgba(255,255,255,0.28)' }}>bluestoneplumbing.com/pricing</p>
          <div className="space-y-1 font-mono text-xs">
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
              <span className="ml-auto font-sans font-semibold text-xs" style={{ color: 'rgba(16,185,129,0.65)' }}>+25%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed item 2 — feature launch */}
      <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)', opacity: 0.78 }}>
        <div {...itemInner(150)}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{ color: '#34D6B7', background: 'rgba(26,122,110,0.14)', border: '1px solid rgba(26,122,110,0.28)' }}
              >
                LAUNCH
              </span>
              <span className="text-sm font-semibold text-white">Clearpath Logistics</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>1 hr ago</span>
          </div>
          <p className="text-xs font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>clearpathlogistics.com/changelog</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
            New feature: <span className="text-white font-medium">"AI-powered battlecards"</span>
          </p>
        </div>
      </div>

      {/* Feed item 3 — hiring signal */}
      <div className="px-4 py-4" style={{ opacity: 0.52 }}>
        <div {...itemInner(300)}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{ color: '#D4A843', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)' }}
              >
                HIRING
              </span>
              <span className="text-sm font-semibold text-white">Sunridge Accounting</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>3 hrs ago</span>
          </div>
          <p className="text-xs font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>sunridgeaccounting.com/careers</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.62)' }}>
            Sr. Engineer — <span className="text-white font-medium">AI/ML Platform</span>
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>8 competitors · live</span>
        <span className="text-xs font-mono" style={{ color: 'rgba(184,98,42,0.5)' }}>view all →</span>
      </div>
    </div>
  )
}

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  competitors: string
  alerts: string
  history: string
  users: string
  battlecards: boolean
  csvExport: boolean
  api: boolean
  popular: boolean
}

type FeatureKey = keyof Pick<PricingPlan, 'competitors' | 'alerts' | 'history' | 'users' | 'battlecards' | 'csvExport' | 'api'>

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'For founders tracking a handful of competitors.',
    competitors: '3',
    alerts: 'Daily digest',
    history: '30 days',
    users: '1',
    battlecards: false,
    csvExport: false,
    api: false,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/mo',
    description: 'For teams that need real-time intelligence.',
    competitors: '10',
    alerts: 'Real-time',
    history: '12 months',
    users: '5',
    battlecards: true,
    csvExport: true,
    api: false,
    popular: true,
  },
  {
    name: 'Team',
    price: '$199',
    period: '/mo',
    description: 'For GTM teams that need the full picture.',
    competitors: 'Unlimited',
    alerts: 'Real-time',
    history: 'Unlimited',
    users: 'Unlimited',
    battlecards: true,
    csvExport: true,
    api: true,
    popular: false,
  },
]

const featureRows: Array<{ label: string; key: FeatureKey }> = [
  { label: 'Competitors monitored', key: 'competitors' },
  { label: 'Alert delivery', key: 'alerts' },
  { label: 'Change history', key: 'history' },
  { label: 'Team members', key: 'users' },
  { label: 'Battlecard templates', key: 'battlecards' },
  { label: 'CSV export', key: 'csvExport' },
  { label: 'API access', key: 'api' },
]

function Check({ active = true }: { active?: boolean }) {
  if (!active) {
    return <span style={{ color: 'rgba(250,250,246,0.2)', fontSize: '1rem' }}>—</span>
  }
  return (
    <svg className="w-5 h-5 mx-auto" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="rgba(20,184,166,0.12)" stroke="rgba(52,214,183,0.35)" strokeWidth="1" />
      <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#34D6B7" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const faqs = [
  {
    q: 'How is this different from Google Alerts?',
    a: 'Google Alerts misses most website changes. We do structured diffs on pricing pages, feature pages, job boards, and review sites - detecting actual content changes, not just mentions.',
  },
  {
    q: 'Do you support non-English competitors?',
    a: 'Yes. Our monitoring works on any publicly accessible website, regardless of language.',
  },
  {
    q: 'Can I export data?',
    a: 'Yes. CSV export is available on Pro and Team plans. API access is included on Team.',
  },
  {
    q: 'Is there a free plan?',
    a: "Yes — every plan starts with a 14-day free trial, full feature access, no credit card needed. If you don't see value in your first week, cancel in one click. There is no free tier after trial, but we've never had a founder who set it up properly wish they hadn't.",
  },
  {
    q: 'How quickly do you detect changes?',
    a: 'We monitor continuously and send alerts within minutes of a detected change. Pricing page changes typically surface within 15-30 minutes.',
  },
  {
    q: 'Is scraping competitor websites legal?',
    a: 'Yes. Monitoring publicly available web pages is legal fair use. We only track publicly accessible information.',
  },
  {
    q: 'Why join the waitlist now instead of waiting for launch?',
    a: 'The founding price — $49/mo for the Starter plan — is locked for life for anyone who signs up before April 15. After launch, the same plan is $69/mo. That is a permanent $240/year saving. The waitlist also gives you early access before we open to the public.',
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="divide-y divide-[rgba(250,250,246,0.06)]">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center py-4 text-left text-white font-medium hover:text-[#B8622A] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8622A] focus-visible:rounded"
          >
            <span>{faq.q}</span>
            <svg
              className={`ml-4 w-5 h-5 text-white/30 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {open === i && (
            <p className="pb-4 text-sm leading-relaxed" style={{ color: 'rgba(250,250,246,0.58)' }}>{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  )
}

const annualPrices: Record<string, { monthly: string; annual: string; billed: string }> = {
  Starter: { monthly: '$49', annual: '$39', billed: '$468' },
  Pro:     { monthly: '$99', annual: '$79', billed: '$948' },
  Team:    { monthly: '$199', annual: '$159', billed: '$1,908' },
}

// Global mobile sticky CTA — shows after scrolling past hero on variants A/B/C
// HeroD has its own sticky; this one activates when the page has scrolled > 90vh
function MobileScrollSticky() {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(() => {
    try { return localStorage.getItem('ps_sub') === '1' } catch { return false }
  })
  const variant = useHeroVariant()

  useEffect(() => {
    // HeroD manages its own sticky CTA — don't double up
    if (variant === 'd') return
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.9)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant])

  if (!show || done || variant === 'd') return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 pt-3 pb-4"
      style={{ background: '#0D0F1A', borderTop: '1px solid rgba(184,98,42,0.5)' }}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F07C35] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8622A]" />
        </span>
        <p className="text-xs font-medium" style={{ color: 'rgba(240,124,53,0.85)' }}>
          Founding price closes April 15 - $49/mo locked for life
        </p>
      </div>
      <EmailForm
        placeholder="Enter your work email"
        buttonText="Claim founding price"
        size="large"
        variant="dark"
        onSuccess={() => setDone(true)}
      />
    </div>
  )
}

// Extract community channel from /for/[channel] paths.
// Returns the channel slug if valid, 'redirect' for unknown /for/* paths, null otherwise.
function getCommunityChannel(): string | 'redirect' | null {
  const match = window.location.pathname.match(/^\/for\/([^/]+)\/?$/)
  if (!match) return null
  const slug = match[1]
  return KNOWN_CHANNELS.includes(slug) ? slug : 'redirect'
}

export default function App() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null)
  const communityChannel = getCommunityChannel()
  const variant = useHeroVariant()

  useEffect(() => {
    // Redirect unknown /for/* paths to homepage
    if (communityChannel === 'redirect') {
      window.location.replace('/')
      return
    }
    fetch('/api/waitlist/count')
      .then(res => res.ok ? res.json() : null)
      .then((data: { count: number } | null) => {
        if (data && typeof data.count === 'number') setWaitlistCount(data.count)
      })
      .catch(() => {/* show nothing on error */})
  }, [communityChannel])

  return (
    <div className="min-h-screen font-[Inter,system-ui,sans-serif]" style={{ background: '#0D0F1A', color: '#FAFAF6' }}>

      {/* Exit-intent modal — fires once on cursor-to-chrome (desktop) or 60s inactivity (mobile) */}
      <Suspense fallback={null}><ExitIntentModal /></Suspense>

      {/* Urgency banner — deadline + founding spot count, all variants */}
      <FoundingBanner />

      {/* Mobile sticky CTA — scroll-triggered, all variants except HeroD (has its own) */}
      <MobileScrollSticky />

      {/* Nav — dark glass */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(13,15,26,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'rgba(184,98,42,0.12)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo dark />
          <div className="flex items-center gap-4">
            <a href="/blog/" className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition py-3 px-1">Blog</a>
            <a href="/tools/" className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition py-3 px-1">Free tools</a>
            <a href="/pricing/" className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition py-3 px-1">Pricing</a>
            <a
              href="#waitlist-footer"
              className="text-sm font-semibold rounded-lg transition"
              style={{
                background: 'transparent',
                border: '1px solid rgba(184,98,42,0.45)',
                color: 'rgba(250,250,246,0.75)',
                padding: '10px 16px',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = '#B8622A'; el.style.color = 'white'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(184,98,42,0.45)'; el.style.color = 'rgba(250,250,246,0.75)'; }}
            >
              Join waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — community-specific for /for/[channel], otherwise A/B variants */}
      {communityChannel ? <CommunityHero channel={communityChannel} /> : <Hero />}

      {/* FAQ strip — Variant B only, converts hesitators immediately below hero */}
      {!communityChannel && variant === 'b' && <HeroBFAQStrip />}

      {/* Problem — before/after comparison */}
      <section
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ background: '#111320' }}
      >
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto relative">

          {/* Before / After panels */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 lg:gap-0 items-stretch">

            {/* BEFORE panel */}
            <RevealDiv
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(30, 8, 8, 0.7)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center gap-2.5 px-5 py-3.5 border-b"
                style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.18)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="6.5" stroke="rgba(239,68,68,0.6)" />
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(239,68,68,0.8)' }}>
                  How you find out now
                </span>
              </div>

              {/* Slack-style DM mockup */}
              <div className="flex-1 p-5 space-y-4">
                {/* Incoming message from a customer */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                      SC
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">Sarah Chen</span>
                      <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>Customer · 2:47 PM</span>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Hey, quick question — I just saw your competitor dropped their price to <span className="text-white font-semibold">$49/mo</span>. Are you planning to match it? We're mid-renewal review...
                  </p>
                </div>

                {/* Consequence cards */}
                <div className="space-y-2.5">
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.12)' }}
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }}>✗</span>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      You check their site. 30% price cut. Live for <span className="text-white font-medium">3 weeks</span>.
                    </p>
                  </div>
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.12)' }}
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }}>✗</span>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      You've already lost <span className="text-white font-medium">2 deals</span> this month.
                    </p>
                  </div>
                  <div
                    className="flex items-start gap-3 rounded-lg px-3.5 py-2.5"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.12)' }}
                  >
                    <span className="text-sm mt-0.5 flex-shrink-0" style={{ color: '#EF4444' }}>✗</span>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Your sales deck is <span className="text-white font-medium">3 weeks out of date</span>.
                    </p>
                  </div>
                </div>

                {/* Timestamp callout */}
                <div
                  className="rounded-lg px-3.5 py-2.5 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="5.5" stroke="#EF4444" strokeWidth="1" />
                    <path d="M6 3.5V6.5l2 1.5" stroke="#EF4444" strokeWidth="1.25" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs font-mono" style={{ color: 'rgba(239,68,68,0.75)' }}>
                    You're always the last to know
                  </p>
                </div>
              </div>
            </RevealDiv>

            {/* VS divider */}
            <div className="flex lg:flex-col items-center justify-center py-4 lg:py-0 px-0 lg:px-0 relative z-10">
              <div
                className="hidden lg:block w-px flex-1"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }}
              />
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mx-4 lg:mx-0 lg:my-4"
                style={{
                  background: '#111320',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)',
                  boxShadow: '0 0 0 6px #111320',
                }}
              >
                vs
              </div>
              <div
                className="hidden lg:block w-px flex-1"
                style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }}
              />
              {/* Horizontal line for mobile */}
              <div
                className="lg:hidden flex-1 h-px"
                style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)' }}
              />
            </div>

            {/* AFTER panel */}
            <RevealDiv
              staggerMs={120}
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(4, 20, 14, 0.7)',
                border: '1px solid rgba(52,214,183,0.25)',
              }}
            >
              {/* Panel header */}
              <div
                className="flex items-center gap-2.5 px-5 py-3.5 border-b"
                style={{ background: 'rgba(52,214,183,0.05)', borderColor: 'rgba(52,214,183,0.15)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="6.5" stroke="rgba(52,214,183,0.6)" />
                  <path d="M4.5 7l2 2 3.5-4" stroke="#34D6B7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(52,214,183,0.8)' }}>
                  With Peerscope
                </span>
              </div>

              {/* Competitor feed mockup */}
              <div className="flex-1 p-4">
                <Suspense fallback={
                  <div className="rounded-xl" style={{ background: '#06080F', border: '1px solid rgba(255,255,255,0.06)', height: '280px' }} />
                }>
                  <CompetitorFeedMockup />
                </Suspense>
              </div>
            </RevealDiv>

          </div>

          <div className="text-center mt-10">
            <a
              href="#pricing"
              className="text-sm font-medium transition hover:opacity-80 inline-flex items-center gap-1.5 py-3"
              style={{ color: '#B8622A' }}
            >
              Already convinced? Skip to pricing →
            </a>
          </div>

        </div>
      </section>

      {/* How it works — quick 3-step visual overview */}
      <Suspense fallback={null}><HowItWorks /></Suspense>

      {/* Setup flow — interactive animated demo, dark */}
      <section
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ background: '#0D0F1A' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span
              className="text-xs font-mono tracking-[0.2em] uppercase mb-4 block"
              style={{ color: '#B8622A' }}
            >
              See it in action
            </span>
            <h2
              className="text-4xl sm:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
            >
              Up and running in 2 minutes.
            </h2>
          </div>

          <SetupFlow />
        </div>
      </section>

      {/* What we track — asymmetric with product feed UI */}
      <section
        className="relative py-24 px-4 sm:px-6 lg:px-8 scan-grid overflow-hidden"
        style={{ background: '#111320' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">

            {/* Left column — heading + signal tags */}
            <div className="lg:col-span-5 mb-14 lg:mb-0 relative">
              <span
                aria-hidden="true"
                className="section-num"
                style={{ top: '-8px', left: '-8px' }}
              >02</span>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span
                  className="text-xs font-mono tracking-[0.2em] uppercase mb-6 block"
                  style={{ color: '#B8622A' }}
                >
                  Signal intelligence
                </span>
                <h2
                  className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6"
                  style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
                >
                  What we track
                </h2>
                <p
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: 'rgba(250,250,246,0.5)' }}
                >
                  Every signal your competitors send - captured and structured.
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Pricing pages', color: '#B8622A' },
                    { label: 'Feature launches', color: '#1A7A6E' },
                    { label: 'Job postings', color: '#D4A843' },
                    { label: 'G2/Capterra reviews', color: '#1A7A6E' },
                  ].map(tag => (
                    <span
                      key={tag.label}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{
                        background: `${tag.color}18`,
                        border: `1px solid ${tag.color}35`,
                        color: tag.color,
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
                <a
                  href="#waitlist-footer"
                  className="text-sm font-medium mt-6 block py-3 transition hover:opacity-80"
                  style={{ color: '#B8622A' }}
                >
                  See all signals Peerscope tracks →
                </a>
              </div>
            </div>

            {/* Right column — product feed UI */}
            <RevealDiv className="lg:col-span-7" staggerMs={100}>
              <ProductFeed />
            </RevealDiv>

          </div>
        </div>
      </section>

      {/* Testimonials — social proof before pricing */}
      <section
        id="testimonials"
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ background: '#FAFAF6' }}
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(184,98,42,0.06) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(26,122,110,0.05) 0%, transparent 50%)',
          }}
        />
        <div className="max-w-6xl mx-auto relative">
          {/* Section header — first-person fragment, no eyebrow */}
          <div className="mb-16">
            <h2
              className="text-4xl sm:text-5xl font-bold leading-tight"
              style={{
                fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
                fontWeight: 800,
                color: '#111320',
                letterSpacing: '-0.02em',
              }}
            >
              "We would have lost that deal."
            </h2>
          </div>

          {/* Testimonials — offset staircase, no cards */}
          <div className="flex flex-col md:flex-row md:items-start gap-12 md:gap-0" style={{ columnGap: '60px' }}>
            {([
              {
                name: 'Jordan M.',
                role: 'Founder',
                company: 'B2B SaaS startup',
                pullQuote: 'Found out my top competitor dropped their pricing tier 3 days after it happened — instead of 3 weeks later from a customer.',
                body: 'That alone paid for the tool. We adjusted our renewal pitch before we lost a single deal.',
                offset: 'md:mt-0',
              },
              {
                name: 'Alex K.',
                role: 'Managing Director',
                company: 'Digital Marketing Agency',
                pullQuote: 'We used to find out about competitor positioning changes when clients brought them up in meetings.',
                body: 'Now we walk into every pitch already knowing their latest moves. It completely flipped the dynamic.',
                offset: 'md:mt-12',
              },
              {
                name: 'Sam T.',
                role: 'Head of Operations',
                company: 'Managed IT Services',
                pullQuote: 'A competitor launched a new managed security offering on a Tuesday. We had it in our service brief by Thursday.',
                body: 'Before Peerscope, that kind of intel would have taken months to surface — if it ever did.',
                offset: 'md:mt-24',
              },
            ] as const).map((t, i) => (
              <RevealDiv key={t.name} staggerMs={i * 80} className={`flex-1 ${t.offset}`} style={{ maxWidth: '38ch' }}>
                {/* Pull quote */}
                <p
                  className="leading-snug mb-4"
                  style={{
                    fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111320',
                  }}
                >
                  "{t.pullQuote}"
                </p>

                {/* Supporting copy */}
                <p
                  className="text-sm leading-relaxed mb-5"
                  style={{ color: 'rgba(17,19,32,0.55)' }}
                >
                  {t.body}
                </p>

                {/* Attribution — mono, name in brand colour */}
                <p
                  className="font-mono"
                  style={{ fontSize: '12px', color: '#B8622A' }}
                >
                  {t.name}
                </p>
                <p
                  className="font-mono"
                  style={{ fontSize: '12px', color: 'rgba(17,19,32,0.45)' }}
                >
                  {t.role}, {t.company}
                </p>
              </RevealDiv>
            ))}
          </div>

          {/* Trust footnote */}
          <p className="text-center text-xs mt-10" style={{ color: 'rgba(17,19,32,0.35)' }}>
            Beta tester feedback. Names abbreviated for privacy.
          </p>
        </div>
      </section>

      {/* Pricing — feature comparison table, dark */}
      <section
        id="pricing"
        className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{ background: '#0D0F1A' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 relative">
            <span
              aria-hidden="true"
              className="section-num"
              style={{ top: '-8px', left: '-8px' }}
            >03</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <span
                className="text-xs font-mono tracking-[0.2em] uppercase mb-4 block"
                style={{ color: '#B8622A' }}
              >
                Pricing
              </span>
              <h2
                className="text-4xl sm:text-5xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
              >
                Simple, transparent pricing
              </h2>
              <p className="text-lg mt-3" style={{ color: 'rgba(250,250,246,0.5)' }}>
                14-day free trial on all plans. No credit card required.
              </p>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center sm:justify-end mb-6">
            <div
              className="inline-flex rounded-full p-1"
              style={{ background: 'rgba(250,250,246,0.04)', border: '1px solid rgba(250,250,246,0.08)' }}
              role="group"
              aria-label="Billing period"
            >
              {(['monthly', 'annual'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => setBilling(option)}
                  className="text-sm px-4 py-3 rounded-full transition font-mono"
                  style={billing === option ? {
                    background: 'rgba(184,98,42,0.15)',
                    border: '1px solid rgba(184,98,42,0.35)',
                    color: '#F07C35',
                    fontWeight: 600,
                  } : {
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'rgba(250,250,246,0.45)',
                  }}
                  aria-pressed={billing === option}
                >
                  {option === 'monthly' ? 'Monthly' : 'Annual - save 20%'}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison table */}
          <RevealDiv scale>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(184,98,42,0.2)' }}
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]" style={{ borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col style={{ width: '36%' }} />
                    <col style={{ width: '21%' }} />
                    <col style={{ width: '21%' }} />
                    <col style={{ width: '22%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(184,98,42,0.15)' }}>
                      <th className="px-6 py-5 text-left">
                        <span className="text-xs font-mono" style={{ color: 'rgba(250,250,246,0.42)' }}>Feature</span>
                      </th>
                      {pricingPlans.map(plan => (
                        <th
                          key={plan.name}
                          className="px-4 py-5 text-center"
                          style={{ background: plan.popular ? 'rgba(184,98,42,0.07)' : undefined }}
                        >
                          {plan.popular && (
                            <div
                              className="text-xs font-mono mb-2"
                              style={{ color: '#B8622A' }}
                            >
                              ★ Popular
                            </div>
                          )}
                          <div
                            className="font-bold text-base text-white"
                            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                          >
                            {plan.name}
                          </div>
                          <div className="mt-1.5">
                            {billing === 'annual' && (
                              <span
                                className="text-lg font-bold mr-1"
                                style={{ color: 'rgba(250,250,246,0.3)', textDecoration: 'line-through' }}
                              >
                                {annualPrices[plan.name].monthly}
                              </span>
                            )}
                            <span
                              className="text-2xl font-bold"
                              style={{ color: billing === 'annual' ? '#F07C35' : plan.popular ? '#F07C35' : 'rgba(250,250,246,0.88)' }}
                            >
                              {billing === 'annual' ? annualPrices[plan.name].annual : plan.price}
                            </span>
                            <span className="text-sm" style={{ color: 'rgba(250,250,246,0.38)' }}>{plan.period}</span>
                            {billing === 'annual' && (
                              <div className="text-xs mt-0.5" style={{ color: 'rgba(250,250,246,0.35)' }}>
                                billed {annualPrices[plan.name].billed}/yr
                              </div>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureRows.map((row) => (
                      <tr key={row.key} style={{ borderBottom: '1px solid rgba(250,250,246,0.04)' }}>
                        <td
                          className="px-6 py-4 text-sm"
                          style={{ color: 'rgba(250,250,246,0.58)' }}
                        >
                          {row.label}
                        </td>
                        {pricingPlans.map(plan => (
                          <td
                            key={plan.name}
                            className="px-4 py-4 text-center text-sm"
                            style={{ background: plan.popular ? 'rgba(184,98,42,0.04)' : undefined }}
                          >
                            {typeof plan[row.key] === 'boolean' ? (
                              <Check active={plan[row.key] as boolean} />
                            ) : (
                              <span style={{ color: plan.popular ? '#F07C35' : 'rgba(250,250,246,0.78)' }}>
                                {plan[row.key] as string}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr>
                      <td className="px-6 py-5" />
                      {pricingPlans.map(plan => (
                        <td
                          key={plan.name}
                          className="px-4 py-5 text-center"
                          style={{ background: plan.popular ? 'rgba(184,98,42,0.04)' : undefined }}
                        >
                          <a
                            href="#waitlist-footer"
                            className="inline-block py-3.5 px-5 rounded-lg font-semibold text-sm text-white transition hover:brightness-110"
                            style={{
                              background: plan.popular ? '#B8622A' : 'rgba(250,250,246,0.08)',
                              border: plan.popular ? 'none' : '1px solid rgba(250,250,246,0.12)',
                            }}
                          >
                            Join waitlist
                          </a>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </RevealDiv>
          <p className="text-center text-sm mt-6" style={{ color: 'rgba(250,250,246,0.42)' }}>
            All prices in USD
          </p>
        </div>
      </section>

      {/* FAQ — dark section continuous with pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" style={{ background: '#0D0F1A' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
            >
              Before you decide.
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Social proof + scarcity strip — conversion nudge above footer */}
      <SocialProofStrip />

      {/* Footer CTA — full-bleed amber inversion */}
      <section
        id="waitlist-footer"
        className="py-24 px-4 sm:px-6 lg:px-8"
        style={{ background: '#B8622A' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="leading-none mb-6 select-none"
            style={{
              fontFamily: "'Syne', system-ui, sans-serif",
              fontWeight: 900,
              fontSize: 'clamp(56px, 10vw, 80px)',
              color: 'white',
              letterSpacing: '-0.03em',
            }}
          >
            Start free.
          </div>
          <p
            className="text-lg sm:text-xl mb-10 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.78)' }}
          >
            Your first competitor alert in under 15 minutes.
            <br className="hidden sm:block" />
            No setup fees. No annual commitment. Cancel anytime.
          </p>
          <div
            className="max-w-md mx-auto rounded-2xl p-5"
            style={{ background: 'rgba(0,0,0,0.18)' }}
          >
            <EmailForm placeholder="Enter your work email" buttonText="Claim your founding price" size="large" variant="dark" />
            {waitlistCount !== null && waitlistCount >= 20 && (
              <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.38)' }}>
                <span aria-hidden="true">✓ </span>Join {waitlistCount.toLocaleString()} founders already waiting
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-4 sm:px-6 lg:px-8"
        style={{ background: '#0D0F1A', borderColor: 'rgba(250,250,246,0.06)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo dark />
          <p className="text-sm" style={{ color: 'rgba(250,250,246,0.3)' }}>
            &copy; {new Date().getFullYear()} peerscope. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm" style={{ color: 'rgba(250,250,246,0.3)' }}>
            <a href="/blog/" className="hover:text-white transition-colors py-3 inline-block">Blog</a>
            <a href="/tools/" className="hover:text-white transition-colors py-3 inline-block">Free tools</a>
            <a href="/pricing/" className="hover:text-white transition-colors py-3 inline-block">Pricing</a>
            <a href="mailto:onboarding@resend.dev" className="hover:text-white transition-colors py-3 inline-block">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
