import { useState, useEffect } from 'react'

export function SocialProofStrip() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/waitlist/count')
      .then(res => (res.ok ? res.json() : null))
      .then((data: { count: number } | null) => {
        if (data && typeof data.count === 'number') setCount(data.count)
      })
      .catch(() => {})
  }, [])

  return (
    <div
      style={{
        background: '#0F0F0B',
        borderTop: '1px solid rgba(184,98,42,0.18)',
        borderBottom: '1px solid rgba(184,98,42,0.18)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">

        {/* Sign-up count */}
        <span className="text-sm font-mono text-center sm:text-left" style={{ color: 'rgba(250,250,246,0.55)' }}>
          {count === null ? (
            <span
              className="inline-block w-36 h-4 rounded animate-pulse align-middle"
              style={{ background: 'rgba(184,98,42,0.15)' }}
            />
          ) : count >= 20 ? (
            <>
              <span style={{ color: '#B8622A', fontWeight: 700 }}>{count.toLocaleString()}</span>
              {' founder'}{count === 1 ? '' : 's'} on the waitlist
            </>
          ) : (
            <>Join the <span style={{ color: '#B8622A', fontWeight: 700 }}>founding members</span></>
          )}
        </span>

        <span className="hidden sm:inline text-xs" style={{ color: 'rgba(250,250,246,0.15)' }}>·</span>

        {/* Deadline */}
        <span className="text-sm font-mono text-center" style={{ color: 'rgba(250,250,246,0.55)' }}>
          Founding price closes{' '}
          <span style={{ color: '#B8622A', fontWeight: 700 }}>April 15</span>
        </span>

        <span className="hidden sm:inline text-xs" style={{ color: 'rgba(250,250,246,0.15)' }}>·</span>

        {/* CTA */}
        <a
          href="#waitlist-footer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:brightness-110 hover:scale-105"
          style={{
            fontFamily: "'Syne', system-ui, sans-serif",
            background: 'rgba(184,98,42,0.14)',
            border: '1px solid rgba(184,98,42,0.4)',
            color: '#F07C35',
          }}
        >
          Join waitlist
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M2.5 6.5h8M8 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

      </div>
    </div>
  )
}
