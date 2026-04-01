/**
 * Hero Variant B — Value-led (current direction)
 *
 * Angle: affordability. "Enterprise CI intelligence at SMB price."
 * Headline is the brand tagline.
 * Visual: pricing comparison table (Peerscope vs Crayon/Klue).
 * CTA: "Join the waitlist"
 */
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
          <div className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</div>
          <div className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Price</div>
          <div className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">SMB-ready</div>
        </div>

        {/* Table rows */}
        {rows.map(row => (
          <div
            key={row.tool}
            className={`grid grid-cols-3 border-b border-[#334155] last:border-0 transition-colors ${
              row.highlight ? 'bg-teal-900/20' : ''
            }`}
          >
            <div className={`px-4 py-3 text-sm font-semibold ${row.highlight ? 'text-teal-300' : 'text-gray-400'}`}>
              {row.highlight ? (
                <span className="flex items-center gap-1.5">
                  {row.tool}
                  <span className="text-teal-500 text-xs font-bold">★</span>
                </span>
              ) : row.tool}
            </div>
            <div className={`px-4 py-3 text-sm text-center font-mono ${row.highlight ? 'text-teal-300 font-bold' : 'text-gray-500 line-through opacity-60'}`}>
              {row.price}
            </div>
            <div className="px-4 py-3 text-center flex items-center justify-center">
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
        <div className="bg-teal-900/10 border-t border-teal-900/30 px-4 py-2.5">
          <p className="text-xs text-teal-400 text-center font-medium">
            Save ~$19,400/year vs enterprise tools
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroB() {
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
          className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
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
          <EmailForm placeholder="Enter your work email" buttonText="Get early access" size="large" />
          <p className="mt-3 text-sm text-gray-500">14-day free trial &middot; No credit card required &middot; Cancel anytime</p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Used by 200+ SaaS teams (placeholder - real at launch)
        </div>

        {/* Pricing comparison visual */}
        <PricingComparison />
      </div>
    </section>
  )
}
