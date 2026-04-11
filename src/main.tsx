import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LandingPage } from './components/LandingPage'

// Cloudflare Web Analytics — only injected when token is configured
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (analyticsToken) {
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset['cfBeacon'] = JSON.stringify({ token: analyticsToken })
  document.head.appendChild(script)
}

// Server-side page view tracking — fires once per session
;(function trackPageView() {
  const SESSION_KEY = 'ps_sid'
  let sessionId = sessionStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  const params = new URLSearchParams(window.location.search)
  const payload = {
    session_id: sessionId,
    variant: params.get('variant') ?? 'b',
    referrer: document.referrer || null,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  }

  navigator.sendBeacon('/api/analytics/pageview', JSON.stringify(payload))

  // First-touch UTM attribution — persist to localStorage on first visit with UTM params.
  // Ensures form submissions on later pages/sessions still attribute to the original ad.
  if (params.get('utm_source') && !localStorage.getItem('ps_utm')) {
    try {
      localStorage.setItem('ps_utm', JSON.stringify({
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        ref: params.get('ref'),
        landed_at: new Date().toISOString(),
      }))
    } catch { /* localStorage unavailable — ignore */ }
  }
})()

const path = window.location.pathname
const isLandingPage = path === '/lp' || path === '/lp/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isLandingPage ? <LandingPage /> : <App />}
  </StrictMode>,
)
