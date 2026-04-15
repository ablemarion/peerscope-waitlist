import { useState, useEffect } from 'react'
import { portalFetch } from '../../lib/portalApi'

interface AgencyInfo {
  plan: string
  name: string
}

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === 'pro'
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        isPro
          ? 'bg-[#B8622A]/10 text-[#B8622A] border border-[#B8622A]/20'
          : 'bg-gray-100 text-gray-500 border border-gray-200',
      ].join(' ')}
    >
      {isPro ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <path d="M5 1l1.18 2.39L9 4.03 6.86 6.11 7.42 9 5 7.73 2.58 9l.56-2.89L1 4.03l2.82-.64L5 1z" fill="#B8622A" />
        </svg>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      )}
      {isPro ? 'Pro' : 'Free'}
    </span>
  )
}

export function PortalBilling() {
  const [agency, setAgency] = useState<AgencyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Detect post-checkout success or cancel from URL params.
  const params = new URLSearchParams(window.location.search)
  const isSuccess = params.has('session_id')

  useEffect(() => {
    async function load() {
      try {
        const res = await portalFetch('/api/portal/agencies/me')
        const json = await res.json() as { data: AgencyInfo | null; error?: string }
        if (json.data) setAgency(json.data)
      } catch {
        setError('Failed to load billing information.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Remove session_id from URL after render so a refresh doesn't re-show the banner.
  useEffect(() => {
    if (isSuccess) {
      const url = new URL(window.location.href)
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }
  }, [isSuccess])

  async function handleUpgrade() {
    setCheckoutLoading(true)
    setError(null)
    try {
      const res = await portalFetch('/api/portal/billing/checkout', { method: 'POST' })
      const json = await res.json() as { data?: { url: string | null }; error?: string; message?: string }
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Failed to start checkout.')
        return
      }
      if (json.data?.url) {
        window.location.href = json.data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await portalFetch('/api/portal/billing/portal-link', { method: 'POST' })
      const json = await res.json() as { data?: { url: string }; error?: string; message?: string }
      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Failed to open billing portal.')
        return
      }
      if (json.data?.url) {
        window.location.href = json.data.url
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  const isPro = agency?.plan === 'pro'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage your Peerscope subscription.</p>
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-medium text-emerald-800">Payment successful — welcome to Peerscope Pro!</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your plan has been activated. All Pro features are now available.</p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 6v5M10 14v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white rounded-xl border border-gray-200 border-l-2 border-l-[#B8622A]/40 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Current plan</h3>

        {loading ? (
          <div className="space-y-3">
            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-48 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-gray-900">
                  {isPro ? 'Peerscope Pro' : 'Peerscope Free'}
                </span>
                <PlanBadge plan={agency?.plan ?? 'free'} />
              </div>
              {isPro ? (
                <p className="text-sm text-gray-500">AUD$99/month · Unlimited clients, weekly intelligence reports.</p>
              ) : (
                <p className="text-sm text-gray-500">Limited to 1 client · Upgrade to unlock full intelligence.</p>
              )}
            </div>

            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {portalLoading ? (
                  <svg className="animate-spin w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Manage billing
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] active:bg-[#8A4820] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <svg className="animate-spin w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plan feature comparison */}
      {!isPro && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 border-l-2 border-l-[#B8622A]/40 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">What's included in Pro</h3>
          <ul className="space-y-3">
            {[
              'Unlimited clients',
              'Weekly competitive intelligence reports',
              'Competitor pricing, jobs, and review tracking',
              'White-label client portal',
              'Email delivery of reports',
              'Priority support',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[#B8622A]" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" fill="none" />
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">AUD$99</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#B8622A] text-white text-sm font-medium hover:bg-[#9E5224] active:bg-[#8A4820] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? 'Redirecting…' : 'Get started'}
              {!checkoutLoading && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
