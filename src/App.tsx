import { useState } from 'react'
import './App.css'
import { Logo, EmailForm } from './components/shared'
import { FoundingBanner } from './components/FoundingBanner'
import { HeroA } from './components/HeroA'
import { HeroB } from './components/HeroB'
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

// Read ?variant=a or ?variant=b from the URL. Defaults to 'b'.
function useHeroVariant(): 'a' | 'b' {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('variant')?.toLowerCase()
  return v === 'a' ? 'a' : 'b'
}

function Hero() {
  const variant = useHeroVariant()
  return variant === 'a' ? <HeroA /> : <HeroB />
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
    a: 'We offer a 14-day free trial with no credit card required. There is no permanent free tier.',
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
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex justify-between items-center py-4 text-left text-gray-900 font-medium hover:text-[#B8622A] transition focus:outline-none"
          >
            <span>{faq.q}</span>
            <svg
              className={`ml-4 w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {open === i && (
            <p className="pb-4 text-gray-600 text-sm leading-relaxed">{faq.a}</p>
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#FAFAF6] font-[Inter,system-ui,sans-serif]">

      {/* Founding member offer banner — variant B only */}
      <FoundingBanner />

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-4">
            <a href="#pricing" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition">Pricing</a>
            <a href="#waitlist-footer" className="text-sm font-semibold bg-[#B8622A] text-white px-4 py-2 rounded-lg hover:bg-[#F07C35] transition">
              Join waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero — swap via ?variant=a (problem-led) or ?variant=b (value-led, default) */}
      <Hero />

      {/* Problem */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(184,98,42,0.04) 0%, transparent 60%), #FAFAF6' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
            >
              Enterprise CI costs $20k/year.
              <br />
              Manual monitoring costs you hours.
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">There's nothing in between - until now.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Dominant card - "Finding out too late" */}
            <RevealDiv className="md:col-span-3 bg-white rounded-xl p-8 border border-gray-100 border-l-4 border-l-[#B8622A] card-hover flex flex-col">
              <blockquote className="italic text-[#111320] text-lg leading-relaxed mb-2">
                "I found out my competitor changed their pricing from a prospect, not from monitoring."
              </blockquote>
              <p className="text-sm text-gray-400 mb-6">— SaaS founder, 12-person team</p>
              <div className="text-3xl mb-3">😤</div>
              <h3 className="font-semibold text-[#111827] mb-2">Finding out too late</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Your competitor moves. You find out from a prospect. Every week you're not monitoring is a week you're flying blind.</p>
            </RevealDiv>
            {/* Supporting cards column */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <RevealDiv staggerMs={80} className="flex-1 bg-white rounded-xl p-6 border border-gray-100 card-hover">
                <div className="text-3xl mb-4">💸</div>
                <h3 className="font-semibold text-[#111827] mb-2">Crayon costs $20k/year</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Enterprise platforms like Crayon and Klue start at $12,500/year. Built for analyst teams, not founders.</p>
              </RevealDiv>
              <RevealDiv staggerMs={160} className="flex-1 bg-white rounded-xl p-6 border border-gray-100 card-hover">
                <div className="text-3xl mb-4">⏱️</div>
                <h3 className="font-semibold text-[#111827] mb-2">Manual checks waste hours</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Manually checking 5 competitor websites every Monday takes an hour - and you still miss things.</p>
              </RevealDiv>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAF6]">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
          >
            How it works
          </h2>
          <p className="text-gray-500 text-lg mb-14">Up and running in 2 minutes.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Add competitors',
                desc: 'Paste their URLs. Takes two minutes. No engineering required.',
                color: 'bg-[#B8622A]',
              },
              {
                step: '2',
                title: 'We monitor 24/7',
                desc: 'We watch pricing pages, feature pages, job boards, and reviews around the clock.',
                color: 'bg-teal-600',
              },
              {
                step: '3',
                title: 'You get alerts',
                desc: 'Instant Slack or email notification the moment something changes. Not a weekly digest.',
                color: 'bg-[#111320]',
              },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center text-xl font-bold mb-5`}>
                  {item.step}
                </div>
                <h3
                  className="font-semibold text-[#111827] text-lg mb-2"
                  style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we track */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
            >
              What we track
            </h2>
            <p className="text-gray-500 text-lg">Every signal your competitors send - captured and structured.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6 text-[#B8622A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Pricing pages',
                desc: 'Detect price changes, new tiers, removed plans, and changed feature bundles.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                ),
                title: 'Feature launches',
                desc: 'Website copy changes, changelog updates, and new product page additions.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-[#B8622A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                  </svg>
                ),
                title: 'Job postings',
                desc: 'Headcount signals and new product bets - know what your competitors are building before they announce it.',
              },
              {
                icon: (
                  <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                ),
                title: 'G2/Capterra reviews',
                desc: 'Sentiment shifts and new reviews on major software review platforms.',
              },
            ].map((item, index) => (
              <RevealDiv key={item.title} staggerMs={index * 60} className="flex gap-4 p-5 rounded-xl border border-gray-100 bg-[#FAFAF6] card-hover">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#111827] mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </RevealDiv>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#FAFAF6]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500 text-lg">14-day free trial on all plans. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {[
              {
                name: 'Starter',
                price: '$49',
                period: '/mo',
                description: 'For founders tracking a handful of competitors.',
                features: [
                  'Monitor up to 3 competitors',
                  'Daily email digest',
                  'Pricing page monitoring',
                  '30-day change history',
                  '1 user',
                ],
                cta: 'Join waitlist',
                popular: false,
              },
              {
                name: 'Pro',
                price: '$99',
                period: '/mo',
                description: 'For teams that need real-time intelligence.',
                features: [
                  'Monitor up to 10 competitors',
                  'Real-time Slack & email alerts',
                  'Pricing + features + jobs + reviews',
                  '12-month change history',
                  'Searchable timeline',
                  'Up to 5 users',
                  'Battlecard templates',
                ],
                cta: 'Join waitlist',
                popular: true,
              },
              {
                name: 'Team',
                price: '$199',
                period: '/mo',
                description: 'For GTM teams that need the full picture.',
                features: [
                  'Unlimited competitors',
                  'All Pro features',
                  'AI-generated change summaries',
                  'Unlimited users',
                  'CRM & Slack deep integrations',
                  'Priority support',
                ],
                cta: 'Join waitlist',
                popular: false,
              },
            ].map((plan, index) => (
              <RevealDiv
                key={plan.name}
                scale
                staggerMs={index * 100}
                className={`relative rounded-2xl p-6 border transition-all duration-200 ${plan.popular
                  ? 'bg-[#111320] border-[#B8622A]/40 border-l-4 border-l-[#B8622A] text-white'
                  : 'bg-white border-gray-100 opacity-85 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg card-hover'
                  }`}
                style={plan.popular ? {
                  transform: 'translateY(-24px)',
                  boxShadow: '0 0 40px 0 rgba(184,98,42,0.2), 0 20px 60px -20px rgba(17,19,32,0.4)',
                } : undefined}
              >
                {false && null /* elevation communicates popularity - pill removed */}
                <div className="mb-6">
                  <h3
                    className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : 'text-[#111827]'}`}
                    style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-[#111827]'}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-sm leading-relaxed ${plan.popular ? 'text-gray-300' : 'text-gray-500'}`}>{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? 'text-teal-400' : 'text-teal-600'}`} viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill={plan.popular ? '#0D9488' : '#CCFBF1'} />
                        <path d="M5 8l2 2 4-4" stroke={plan.popular ? 'white' : '#0D9488'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className={plan.popular ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist-footer"
                  className={`block text-center w-full py-3 rounded-lg font-semibold text-sm transition ${plan.popular
                    ? 'bg-teal-500 text-white hover:bg-teal-400'
                    : 'bg-[#B8622A] text-white hover:bg-[#F07C35]'
                    }`}
                >
                  {plan.cta}
                </a>
              </RevealDiv>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">All prices in USD &middot; Annual billing available at 20% discount</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl sm:text-4xl font-bold text-[#111827] mb-4"
              style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
            >
              Frequently asked questions
            </h2>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Footer CTA */}
      <section id="waitlist-footer" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0D0F1A] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', Inter, system-ui, sans-serif" }}
          >
            Start tracking your competitors
            <br />
            in 2 minutes.
          </h2>
          <p className="text-gray-400 text-lg mb-10">Free for 14 days. No credit card required.</p>
          <div className="max-w-md mx-auto">
            <EmailForm placeholder="Enter your work email" buttonText="Join the waitlist" size="large" variant="dark" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D0F1A] border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo dark />
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} peerscope. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-gray-500">
            <a href="mailto:hello@peerscope.io" className="hover:text-gray-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
