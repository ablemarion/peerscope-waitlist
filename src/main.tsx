import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Cloudflare Web Analytics — only injected when token is configured
const analyticsToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN
if (analyticsToken) {
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset['cfBeacon'] = JSON.stringify({ token: analyticsToken })
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
