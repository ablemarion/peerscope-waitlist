import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Logo, EmailForm } from './components/shared'
import { FoundingBanner } from './components/FoundingBanner'
import { HeroA } from './components/HeroA'
import { HeroB } from './components/HeroB'
import { HeroC } from './components/HeroC'
import { useRevealOnScroll } from './hooks/useRevealOnScroll'

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

// Read ?variant=a, ?variant=b, or ?variant=c from the URL. Defaults to 'b'.
function useHeroVariant(): 'a' | 'b' | 'c' {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('variant')?.toLowerCase()
  if (v === 'a') return 'a'
  if (v === 'c') return 'c'
  return 'b'
}

function Hero() {
  const variant = useHeroVariant()
  if (variant === 'a') return <HeroA />
  if (variant === 'c') return <HeroC />
  return <HeroB />
}

// Diagonal SVG divider — "to" colour fills a triangle in the lower-left corner
function DiagonalLeft({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: from, lineHeight: 0, fontSize: 0 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ width: '100%', height: 48, display: 'block' }}>
        <polygon points="0,0 1440,48 0,48" fill={to} />
      </svg>
    </div>
  )
}

// Diagonal SVG divider — "to" colour fills a triangle in the lower-right corner
function DiagonalRight({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: from, lineHeight: 0, fontSize: 0 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 48" preserveAspectRatio="none" style={{ width: '100%', height: 48, display: 'block' }}>
        <polygon points="0,48 1440,0 1440,48" fill={to} />
      </svg>
    </div>
  )
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
              <span className="text-sm font-semibold text-white">Acme Corp</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{timestamp}</span>
          </div>
          <p className="text-xs font-mono mb-2.5" style={{ color: 'rgba(255,255,255,0.28)' }}>acmecorp.com/pricing</p>
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
              <span className="text-sm font-semibold text-white">Rival Inc</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>1 hr ago</span>
          </div>
          <p className="text-xs font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>rivalinc.com/changelog</p>
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
              <span className="text-sm font-semibold text-white">Competitor X</span>
            </div>
            <span className="text-xs whitespace-nowrap flex-shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>3 hrs ago</span>
          </div>
          <p className="text-xs font-mono mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>competitorx.com/careers</p>
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

export default function App() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  return (
    <div className="min-h-screen font-[Inter,system-ui,sans-serif]" style={{ background: '#0D0F1A', color: '#FAFAF6' }}>

      {/* Founding member offer banner — variant B only */}
      <FoundingBanner />

      {/* Nav — dark glass */}
      <nav
        className="sticky top-0 z-50 border-b"
        style={{ background: 'rgba(13,15,26,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderColor: 'rgba(184,98,42,0.12)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo dark />
          <div className="flex items-center gap-4">
            <a href="#pricing" className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition py-3 px-1">Pricing</a>
            <a
              href="#waitlist-footer"
              className="text-sm font-semibold text-white px-4 py-3 rounded-lg transition hover:brightness-110"
              style={{ background: '#B8622A' }}
            >
              Join waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — swap via ?variant=a (problem-led) or ?variant=b (value-led, default) */}
      <Hero />

      {/* Diagonal: hero (#0F172A) → Problem (#111320) — right-leaning cut */}
      <DiagonalRight from="#0F172A" to="#111320" />

      {/* Problem — asymmetric editorial layout */}
      <section
        className="relative py-24 px-4 sm:px-6 lg:px-8 scan-grid overflow-hidden"
        style={{ background: '#111320' }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16 lg:items-start">

            {/* Left column — section label + headline */}
            <div className="lg:col-span-5 mb-14 lg:mb-0 relative">
              <span
                aria-hidden="true"
                className="section-num"
                style={{ top: '-8px', left: '-8px' }}
              >01</span>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <span
                  className="text-xs font-mono tracking-[0.2em] uppercase mb-6 block"
                  style={{ color: '#B8622A' }}
                >
                  The Problem
                </span>
                <h2
                  className="text-4xl sm:text-5xl font-bold leading-tight text-white"
                  style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
                >
                  Enterprise CI costs $20k/year.
                  <br />
                  Manual monitoring costs you hours.
                </h2>
                <p
                  className="text-lg mt-6 leading-relaxed"
                  style={{ color: 'rgba(250,250,246,0.5)' }}
                >
                  There's nothing in between - until now.
                </p>
              </div>
            </div>

            {/* Right column — cards */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <RevealDiv
                className="rounded-2xl p-7 card-hover"
                style={{
                  background: '#0D0F1A',
                  border: '1px solid rgba(184,98,42,0.14)',
                }}
              >
                <blockquote
                  className="italic text-lg leading-relaxed mb-3 text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                >
                  "I found out my competitor changed their pricing from a prospect, not from monitoring."
                </blockquote>
                <p className="text-sm mb-5" style={{ color: 'rgba(250,250,246,0.35)' }}>— SaaS founder, 12-person team</p>
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#B8622A' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
                    <path d="M8 15s1-2 4-2 4 2 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                    <circle cx="15" cy="10" r="1" fill="currentColor" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Finding out too late</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(250,250,246,0.5)' }}>
                      Your competitor moves. You find out from a prospect. Every week you're not monitoring is a week you're flying blind.
                    </p>
                  </div>
                </div>
              </RevealDiv>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <RevealDiv
                  staggerMs={80}
                  className="rounded-2xl p-6 card-hover"
                  style={{ background: '#0D0F1A', border: '1px solid rgba(184,98,42,0.1)' }}
                >
                  <svg className="w-6 h-6 mb-4" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#B8622A' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 10v4M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
                  </svg>
                  <h3 className="font-semibold text-white mb-2">Crayon costs $20k/year</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(250,250,246,0.5)' }}>
                    Enterprise platforms like Crayon and Klue start at $12,500/year. Built for analyst teams, not founders.
                  </p>
                </RevealDiv>
                <RevealDiv
                  staggerMs={160}
                  className="rounded-2xl p-6 card-hover"
                  style={{ background: '#0D0F1A', border: '1px solid rgba(184,98,42,0.1)' }}
                >
                  <svg className="w-6 h-6 mb-4" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#B8622A' }}>
                    <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    <path d="M12 9v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 2h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
                  </svg>
                  <h3 className="font-semibold text-white mb-2">Manual checks waste hours</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(250,250,246,0.5)' }}>
                    Manually checking 5 competitor websites every Monday takes an hour - and you still miss things.
                  </p>
                </RevealDiv>
              </div>
              <a
                href="#pricing"
                className="text-sm font-medium transition hover:opacity-80 mt-8 inline-flex items-center py-3"
                style={{ color: '#B8622A' }}
              >
                Already convinced? Skip to pricing →
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Diagonal: Problem (#111320) → How it works (#0D0F1A) — left-leaning cut */}
      <DiagonalLeft from="#111320" to="#0D0F1A" />

      {/* How it works — editorial numbered steps, dark */}
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
              How it works
            </span>
            <h2
              className="text-4xl sm:text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
            >
              Up and running in 2 minutes.
            </h2>
          </div>

          <div>
            {[
              {
                num: '1',
                title: 'Add competitors',
                desc: 'Paste their URLs. Takes two minutes. No engineering required.',
                accent: '#B8622A',
              },
              {
                num: '2',
                title: 'We monitor 24/7',
                desc: 'We watch pricing pages, feature pages, job boards, and reviews around the clock.',
                accent: '#1A7A6E',
              },
              {
                num: '3',
                title: 'You get alerts',
                desc: 'Instant Slack or email notification the moment something changes. Not a weekly digest.',
                accent: '#B8622A',
              },
            ].map((item, i) => (
              <RevealDiv
                key={item.num}
                staggerMs={i * 100}
                className="relative flex items-start gap-8 lg:gap-20 py-10 border-b last:border-b-0"
                style={{ borderColor: 'rgba(250,250,246,0.06)' }}
              >
                {/* Big decorative number */}
                <div className="flex-shrink-0 w-16 lg:w-28 pt-1">
                  <span
                    className="block leading-none select-none"
                    style={{
                      fontFamily: "'Syne', system-ui, sans-serif",
                      fontWeight: 800,
                      fontSize: 'clamp(72px, 10vw, 112px)',
                      color: item.accent,
                      opacity: 0.14,
                    }}
                  >
                    {item.num}
                  </span>
                </div>
                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3
                    className="text-2xl sm:text-3xl font-bold text-white mb-3"
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-lg leading-relaxed"
                    style={{ color: 'rgba(250,250,246,0.52)', maxWidth: '42ch' }}
                  >
                    {item.desc}
                  </p>
                  {item.num === '3' && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {[
                        { label: 'Slack', color: '#B8622A' },
                        { label: 'Email', color: '#1A7A6E' },
                      ].map(tag => (
                        <span
                          key={tag.label}
                          className="text-xs font-mono font-medium px-3 py-1.5 rounded-full"
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
                  )}
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Diagonal: How it works (#0D0F1A) → What we track (#111320) — right-leaning cut */}
      <DiagonalRight from="#0D0F1A" to="#111320" />

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
                        <span className="text-xs font-mono" style={{ color: 'rgba(250,250,246,0.28)' }}>Feature</span>
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
                            className="inline-block py-3 px-5 rounded-lg font-semibold text-sm text-white transition hover:brightness-110"
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
          <p className="text-center text-sm mt-6" style={{ color: 'rgba(250,250,246,0.28)' }}>
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
              Frequently asked questions
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Footer CTA */}
      <section
        id="waitlist-footer"
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ background: '#0D0F1A' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4 text-white"
            style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
          >
            Still thinking about it?
            <br />
            Start free. Your first competitor alert in under 15 minutes.
          </h2>
          <p className="text-lg mb-10" style={{ color: 'rgba(250,250,246,0.48)' }}>
            No setup fees. No annual commitment. Cancel before you're charged.
          </p>
          <div className="max-w-md mx-auto">
            <EmailForm placeholder="Enter your work email" buttonText="Join the waitlist" size="large" variant="dark" />
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
            <a href="mailto:hello@peerscope.io" className="hover:text-white transition-colors py-3 inline-block">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
