/**
 * AgencyTrustStrip — tech trust badges for agency audience.
 * Appears after the hero, before the problem/before-after section.
 * Signals: Cloudflare infrastructure, encryption, beta social proof.
 */

const badges = [
  {
    icon: (
      // Cloudflare-style "cloud" icon
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path
          d="M13.5 11.25c.83 0 1.5-.67 1.5-1.5 0-.77-.58-1.41-1.34-1.49A3.75 3.75 0 006.5 8.1a2.25 2.25 0 00.25 4.4h6.75z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M5 11.5a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z"
          stroke="currentColor"
          strokeWidth="1.25"
          fill="none"
        />
      </svg>
    ),
    label: 'Built on Cloudflare',
    sub: 'Global edge network',
  },
  {
    icon: (
      // Lock icon
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="3.5" y="8" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M6 8V6a3 3 0 016 0v2"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
        <circle cx="9" cy="11.75" r="1" fill="currentColor" />
      </svg>
    ),
    label: '256-bit encryption',
    sub: 'Data secured at rest & in transit',
  },
  {
    icon: (
      // White-label badge icon
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2.5" y="4.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
        <path d="M5.5 8.5h4M5.5 10.5h2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <circle cx="12.5" cy="9.5" r="1.75" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
    label: 'Full white-label',
    sub: 'Your brand, your subdomain',
  },
  {
    icon: (
      // Users / agencies icon
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.25" />
        <path
          d="M3.5 14.5c0-3.04 2.46-5.5 5.5-5.5s5.5 2.46 5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
    ),
    label: '10 agencies in beta',
    sub: 'Actively tracking clients',
  },
]

export function AgencyTrustStrip() {
  return (
    <div
      style={{
        borderTop: '1px solid rgba(200,220,232,0.06)',
        borderBottom: '1px solid rgba(200,220,232,0.06)',
        background: 'rgba(6,8,15,0.8)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-0 sm:divide-x sm:divide-white/[0.06]">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex items-center gap-3 sm:px-8 first:sm:pl-0 last:sm:pr-0"
            >
              <span style={{ color: 'rgba(200,220,232,0.5)' }} className="flex-shrink-0">
                {badge.icon}
              </span>
              <div>
                <div
                  className="text-sm font-medium leading-tight"
                  style={{ color: 'rgba(250,250,246,0.7)', fontFamily: "'DM Sans', system-ui, sans-serif" }}
                >
                  {badge.label}
                </div>
                <div
                  className="text-xs leading-tight mt-0.5 hidden sm:block"
                  style={{ color: 'rgba(250,250,246,0.28)', fontFamily: "'DM Mono', ui-monospace, monospace" }}
                >
                  {badge.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
