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
    <div className="mt-12 max-w-sm mx-auto w-full select-none" aria-hidden="true">
      {/* Outer card */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] p-4 text-left shadow-2xl">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
          </span>
          <span className="text-xs text-gray-400 font-mono tracking-wide">peerscope alert</span>
          <span className="ml-auto text-xs text-gray-500">2 min ago</span>
        </div>

        {/* Change card */}
        <div className="bg-[#0F172A] rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-300">Acme Corp — Pricing page</span>
            <span className="text-xs bg-red-900/50 text-red-400 border border-red-900/60 px-2 py-0.5 rounded-full font-medium">
              Price ↑
            </span>
          </div>

          {/* Diff lines */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/30 rounded px-2 py-1.5">
              <span className="text-red-500 font-bold select-none">−</span>
              <span className="text-red-300 line-through opacity-70">Pro Plan: $79/mo</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/30 rounded px-2 py-1.5">
              <span className="text-emerald-500 font-bold select-none">+</span>
              <span className="text-emerald-300">Pro Plan: $99/mo</span>
              <span className="ml-auto text-emerald-600 text-xs font-sans font-semibold">+25%</span>
            </div>
          </div>
        </div>

        {/* Second alert preview */}
        <div className="bg-[#0F172A] rounded-lg p-3 mb-3 opacity-60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Rival Inc — Jobs page</span>
            <span className="text-xs bg-blue-900/50 text-blue-400 border border-blue-900/60 px-2 py-0.5 rounded-full font-medium">
              New role
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sr. Engineer — AI/ML Platform <span className="text-gray-600">· 3 hrs ago</span></p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 text-xs bg-[#B8622A] hover:bg-[#F07C35] text-white px-3 py-2 rounded-md font-semibold transition">
            View full diff
          </button>
          <button className="text-xs text-gray-400 hover:text-gray-200 px-3 py-2 rounded-md border border-gray-700 transition">
            Dismiss
          </button>
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
          Your competitors changed their pricing{' '}
          <span className="text-red-400">last week.</span>
          <br className="hidden sm:block" />
          Did you notice?
        </h1>

        {/* Sub-headline */}
        <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Peerscope monitors competitor pricing pages, feature releases, and job postings 24/7.
          Get instant alerts the moment something changes - not a weekly digest.
        </p>

        {/* CTA */}
        <div className="max-w-lg mx-auto mb-8">
          <EmailForm placeholder="Enter your work email" buttonText="Start monitoring free" size="large" variant="dark" />
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

        {/* Alert mockup visual */}
        <AlertMockup />
      </div>
    </section>
  )
}
