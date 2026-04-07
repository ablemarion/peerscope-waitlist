import { useEffect, useRef, useState } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'Connect your competitors',
    desc: 'Paste URLs — Peerscope monitors pricing, features, hiring, and messaging 24/7.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M9 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M13 9a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Filter the signal',
    desc: 'Pricing changes, feature launches, and hiring moves surfaced automatically — noise filtered out.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M3 5h16M6 11h10M9 17h4"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Get alerts instantly',
    desc: 'Email digest or Slack ping the moment a competitor makes a move — never be caught off guard.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M18 8A7 7 0 0 0 4 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path
          d="M13.73 21a2 2 0 0 1-3.46 0"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

function StepCard({ step, index, visible }: { step: typeof STEPS[0]; index: number; visible: boolean }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 420ms ease-out ${index * 200}ms, transform 420ms ease-out ${index * 200}ms`,
      }}
      className="flex-1 min-w-0"
    >
      <div
        className="h-full rounded-2xl px-6 py-7 flex flex-col gap-4"
        style={{
          background: 'rgba(17, 19, 32, 0.8)',
          border: '1px solid rgba(184, 98, 42, 0.18)',
        }}
      >
        {/* Number badge + icon row */}
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0"
            style={{
              background: 'rgba(184, 98, 42, 0.12)',
              color: '#B8622A',
              border: '1.5px solid rgba(184, 98, 42, 0.3)',
            }}
          >
            {step.num}
          </span>
          <span style={{ color: '#B8622A' }}>{step.icon}</span>
        </div>

        {/* Text */}
        <div>
          <h3
            className="text-base font-bold text-white mb-1.5 leading-snug"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {step.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(250, 250, 246, 0.45)' }}>
            {step.desc}
          </p>
        </div>
      </div>
    </div>
  )
}

function ArrowConnector({ visible, index }: { visible: boolean; index: number }) {
  return (
    <div
      className="hidden lg:flex items-center justify-center flex-shrink-0 w-8"
      style={{
        opacity: visible ? 0.4 : 0,
        transition: `opacity 420ms ease-out ${index * 200 + 100}ms`,
      }}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 10h12M12 5l5 5-5 5"
          stroke="#B8622A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

export function HowItWorks() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden"
      style={{ background: '#111320' }}
      aria-label="How Peerscope works"
    >
      {/* Section header */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span
            className="text-xs font-mono tracking-[0.2em] uppercase mb-3 block"
            style={{ color: '#B8622A' }}
          >
            How it works
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 }}
          >
            Three steps to competitor clarity.
          </h2>
        </div>

        {/* Cards row */}
        <div ref={ref} className="flex flex-col lg:flex-row gap-4 lg:gap-0 lg:items-stretch">
          {STEPS.map((step, i) => (
            <>
              <StepCard key={step.num} step={step} index={i} visible={visible} />
              {i < STEPS.length - 1 && <ArrowConnector key={`arrow-${i}`} visible={visible} index={i} />}
            </>
          ))}
        </div>
      </div>
    </section>
  )
}
