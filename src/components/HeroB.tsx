/**
 * Hero Variant B — Agency-led (current direction)
 *
 * Angle: white-label competitive intelligence portal for agencies.
 * Headline: "Your agency's secret weapon for competitive intelligence"
 * Visual: branded client portal mockup — shows white-label portal with client list.
 * CTA: multi-field agency early access request form
 */
import { useState, useEffect } from 'react'
import { AgencyRequestForm } from './shared'
import { CountdownTimer } from './CountdownTimer'

const clients = [
  {
    name: 'TechVault Inc.',
    initials: 'TV',
    status: 'alert',
    signalCount: 3,
    latestSignal: 'Pricing change detected',
    timeAgo: '2h ago',
    color: '#F07C35',
  },
  {
    name: 'BlueCoral Agency',
    initials: 'BC',
    status: 'alert',
    signalCount: 1,
    latestSignal: 'New feature launched',
    timeAgo: '5h ago',
    color: '#C8DCE8',
  },
  {
    name: 'Meridian SaaS',
    initials: 'MS',
    status: 'clear',
    signalCount: 0,
    latestSignal: 'No changes detected',
    timeAgo: '12m ago',
    color: 'rgba(250,250,246,0.25)',
  },
]

function AgencyPortalMockup() {
  return (
    <div className="w-full select-none" aria-hidden="true">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: '#06080F',
          border: '1px solid rgba(200,220,232,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(200,220,232,0.04)',
        }}
      >
        {/* Radar scan overlay */}
        <div
          className="radar-scan-line absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(200,220,232,0.4) 20%, rgba(200,220,232,0.85) 50%, rgba(200,220,232,0.4) 80%, transparent 100%)',
            boxShadow: '0 0 10px rgba(200,220,232,0.4), 0 2px 6px rgba(200,220,232,0.15)',
          }}
          aria-hidden="true"
        />

        {/* Browser chrome */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-b"
          style={{ background: '#03050A', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div
            className="flex-1 mx-3 rounded px-3 py-1 text-xs font-mono flex items-center gap-1.5"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
              <rect x="1" y="2.5" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1" />
              <path d="M3 2.5V2a2 2 0 014 0v.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
            brightfield.peerscope.io/clients
          </div>
        </div>

        {/* Portal header — agency branding */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ background: '#0A0C18', borderColor: 'rgba(200,220,232,0.07)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(200,220,232,0.12)', color: '#C8DCE8', border: '1px solid rgba(200,220,232,0.2)' }}
            >
              B
            </div>
            <div>
              <div className="text-sm font-semibold text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>Brightfield Digital</div>
              <div className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Client Intelligence Portal</div>
            </div>
          </div>
          <div
            className="text-xs px-2.5 py-1 rounded-full font-mono"
            style={{ background: 'rgba(200,220,232,0.08)', color: 'rgba(200,220,232,0.6)', border: '1px solid rgba(200,220,232,0.15)' }}
          >
            3 clients
          </div>
        </div>

        {/* Client list */}
        <div className="p-4 space-y-2">
          {clients.map((client) => (
            <div
              key={client.name}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: client.status === 'alert' ? 'rgba(200,220,232,0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${client.status === 'alert' ? 'rgba(200,220,232,0.1)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: `${client.color}14`,
                  color: client.color,
                  border: `1px solid ${client.color}28`,
                }}
              >
                {client.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{client.name}</span>
                  {client.status === 'alert' && (
                    <span
                      className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded font-mono font-bold"
                      style={{ background: `${client.color}18`, color: client.color, border: `1px solid ${client.color}30` }}
                    >
                      {client.signalCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {client.status === 'alert' ? (
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: client.color }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: client.color }} />
                    </span>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
                      <circle cx="5" cy="5" r="4.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                      <path d="M3 5l1.5 1.5 2.5-3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>{client.latestSignal}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.2)' }}>· {client.timeAgo}</span>
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="border-t px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(184,98,42,0.05)', borderColor: 'rgba(184,98,42,0.18)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'rgba(250,250,246,0.4)' }}>
            Powered by Peerscope
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(250,250,246,0.04)', color: 'rgba(250,250,246,0.2)', border: '1px solid rgba(250,250,246,0.06)' }}>
              hidden from clients
            </span>
          </p>
          <p className="text-xs font-semibold" style={{ color: '#B8622A' }}>$49/mo</p>
        </div>
      </div>

      {/* Price comparison strip */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { tool: 'Crayon', price: '$20k+/yr', muted: true },
          { tool: 'Klue', price: '$12k+/yr', muted: true },
          { tool: 'Peerscope', price: '$49/mo', muted: false },
        ].map(row => (
          <div
            key={row.tool}
            className="rounded-xl px-3 py-2.5 text-center"
            style={{
              background: row.muted ? 'rgba(255,255,255,0.02)' : 'rgba(184,98,42,0.07)',
              border: `1px solid ${row.muted ? 'rgba(255,255,255,0.05)' : 'rgba(184,98,42,0.25)'}`,
            }}
          >
            <div
              className="text-xs font-mono mb-1"
              style={{ color: row.muted ? 'rgba(255,255,255,0.28)' : '#F07C35', textDecoration: row.muted ? 'line-through' : undefined, opacity: row.muted ? 0.6 : 1 }}
            >
              {row.price}
            </div>
            <div className="text-xs" style={{ color: row.muted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.55)' }}>{row.tool}</div>
          </div>
        ))}
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
      style={{ background: '#0D0F1A', paddingTop: '3rem', paddingBottom: '3rem', overflowX: 'hidden' }}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="lg:grid lg:gap-12 lg:items-center" style={{ gridTemplateColumns: '55% 45%' }}>

          {/* Left — copy and form */}
          <div className="mb-12 lg:mb-0" style={{ position: 'relative', zIndex: 10 }}>
            {/* Social proof badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border"
              style={{ background: 'rgba(200,220,232,0.08)', color: '#C8DCE8', borderColor: 'rgba(200,220,232,0.2)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8DCE8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C8DCE8]" />
              </span>
              {waitlistCount !== null ? `Join ${waitlistCount.toLocaleString()} founders on the waitlist` : '10 agencies in beta'}
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight mb-6 text-white"
              style={{
                fontFamily: "'Syne', system-ui, sans-serif",
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontSize: 'clamp(2rem, 7vw, 4.5rem)',
                wordBreak: 'break-word',
              }}
            >
              Your agency&apos;s secret weapon for{' '}
              <span style={{ color: '#C8DCE8' }}>competitive intelligence.</span>
            </h1>

            {/* Sub-headline */}
            <p
              className="text-lg sm:text-xl mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '44ch' }}
            >
              Peerscope gives agencies a branded portal to track competitors for clients — automated reports, client logins, no manual research.
            </p>

            {/* Agency request form */}
            <div className="max-w-lg mb-4">
              <AgencyRequestForm variant="dark" defaultSource="hero-agency-beta" />
              {waitlistCount !== null && (
                <p className="mt-3 text-sm text-center" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  <span aria-hidden="true">✓ </span>
                  <span>Join {waitlistCount.toLocaleString()} founders already tracking their competitors.</span>
                </p>
              )}
              <p className="mt-2 text-xs text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
                Limited early access — pricing locked for waitlist members
              </p>
              <CountdownTimer />
              <p className="mt-3 text-xs font-semibold" style={{ color: 'rgba(240,124,53,0.8)' }}>
                &#9889; Agency founding price closes April 15 &mdash; locked for life after sign-up
              </p>
              {/* Mobile trust line */}
              <p
                className="mt-3 text-sm font-medium md:hidden"
                style={{ color: 'rgba(200,220,232,0.85)' }}
              >
                $49/mo &middot; White-label portal included &middot; Save ~$19,400/yr vs Crayon
              </p>
            </div>
          </div>

          {/* Right — agency portal mockup (desktop only) */}
          <div className="relative hidden md:block" style={{ transform: 'translateX(15%)' }}>
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 40% 30%, rgba(200,220,232,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(184,98,42,0.06) 0%, transparent 50%)',
                transform: 'scale(1.1)',
              }}
              aria-hidden="true"
            />
            <AgencyPortalMockup />
          </div>

        </div>
      </div>
    </section>
  )
}
