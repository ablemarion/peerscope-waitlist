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
    <div className="mt-12 max-w-xs mx-auto w-full select-none" aria-hidden="true">
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden shadow-2xl">
        {/* Table header */}
        <div className="grid grid-cols-3 border-b border-[#334155] bg-[#0F172A]">
          <div className="px-2 sm:px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</div>
          <div className="px-2 sm:px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Price</div>
          <div className="px-2 sm:px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">SMB</div>
        </div>

        {/* Table rows */}
        {rows.map(row => (
          <div
            key={row.tool}
            className={`grid grid-cols-3 border-b border-[#334155] last:border-0 transition-colors ${
              row.highlight ? 'bg-teal-900/20' : ''
            }`}
          >
            <div className={`px-2 sm:px-4 py-3 text-sm font-semibold ${row.highlight ? 'text-teal-300' : 'text-gray-400'}`}>
              {row.highlight ? (
                <span className="flex items-center gap-1.5">
                  {row.tool}
                  <span className="text-teal-500 text-xs font-bold">★</span>
                </span>
              ) : row.tool}
            </div>
            <div className={`px-2 sm:px-4 py-3 text-sm text-center font-mono ${row.highlight ? 'text-teal-300 font-bold' : 'text-gray-500 line-through opacity-60'}`}>
              {row.price}
            </div>
            <div className="px-2 sm:px-4 py-3 text-center flex items-center justify-center">
              {row.smb ? (
                <svg className="w-5 h-5 text-teal-400" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="#0D9488" fillOpacity="0.2" stroke="#0D9488" strokeWidth="1.5" />
                  <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#2DD4BF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 opacity-60" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="1.5" strokeOpacity="0.5" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="#ef4444" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.7" />
                </svg>
              )}
            </div>
          </div>
        ))}

        {/* Callout footer */}
        <div className="bg-teal-900/10 border-t border-teal-900/30 px-2 sm:px-4 py-2.5">
          <p className="text-xs text-teal-400 text-center font-medium">
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
    <section className="bg-[#0F172A] text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-teal-900/50 text-teal-300 border border-teal-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
          </span>
          Now in private waitlist
        </div>

        {/* Headline */}
        <h1
          className="font-bold leading-tight mb-6"
          style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800, letterSpacing: '-0.03em', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
        >
          Track your competitors.{' '}
          <span className="text-teal-400">Not your budget.</span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get alerts when competitors change their pricing, launch features, or post jobs.
          Built for SaaS teams. From $49/mo.
        </p>

        {/* CTA */}
        <div className="max-w-lg mx-auto mb-8">
          <EmailForm placeholder="Enter your work email" buttonText="Get early access" size="large" variant="dark" />
          <p className="mt-3 text-sm text-gray-500">14-day free trial &middot; No credit card required &middot; Cancel anytime</p>
          {waitlistCount !== null && waitlistCount >= 20 ? (
            <p className="mt-2 text-sm text-teal-400 font-medium">
              Join {waitlistCount.toLocaleString()} others on the waitlist
            </p>
          ) : (
            <p className="mt-2 text-sm text-teal-400 font-medium">
              Early access — limited spots before public launch
            </p>
          )}
        </div>

        {/* Pricing comparison visual */}
        <PricingComparison />
      </div>
    </section>
  )
}
