import { useState } from 'react'

const faqs = [
  {
    q: 'What exactly does Peerscope monitor?',
    a: 'Pricing pages, feature lists, positioning copy, and messaging changes across your competitors\' websites — updated automatically, no manual checking.',
  },
  {
    q: 'Do I need to do anything once I sign up?',
    a: 'No. Point Peerscope at your competitors and it monitors them 24/7. You get alerts when something changes.',
  },
  {
    q: 'Why $49/mo? Isn\'t competitive intel expensive?',
    a: 'Enterprise tools like Crayon cost $1,500/mo and are built for teams of analysts. Peerscope is built for a single SMB owner. Same intelligence, fraction of the price. The $49/mo founding price is locked in for life.',
  },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Mobile: accordion. Desktop (md+): 3-column cards.
export function HeroBFAQStrip() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section
      aria-label="Quick answers"
      style={{ background: '#0D0F1A', borderTop: '1px solid rgba(184,98,42,0.10)', borderBottom: '1px solid rgba(184,98,42,0.10)' }}
    >
      <div className="max-w-[760px] mx-auto px-4 sm:px-6">

        {/* Desktop: 3-column cards */}
        <div className="hidden md:grid md:grid-cols-3 divide-x divide-[rgba(250,250,246,0.06)]">
          {faqs.map((faq, i) => (
            <div key={i} className="px-6 py-8">
              <p
                className="text-xs font-semibold leading-snug mb-3"
                style={{ color: '#B8622A' }}
              >
                {faq.q}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(250,250,246,0.62)' }}
              >
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile: accordion */}
        <div className="md:hidden divide-y divide-[rgba(250,250,246,0.06)]">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-3 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8622A] focus-visible:rounded"
                aria-expanded={open === i}
              >
                <span
                  className="text-sm font-medium leading-snug"
                  style={{ color: open === i ? '#B8622A' : 'rgba(250,250,246,0.75)' }}
                >
                  {faq.q}
                </span>
                <span style={{ color: 'rgba(250,250,246,0.30)', marginTop: '2px' }}>
                  <ChevronIcon open={open === i} />
                </span>
              </button>
              {open === i && (
                <p
                  className="pb-4 text-sm leading-relaxed"
                  style={{ color: 'rgba(250,250,246,0.58)' }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
