import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Converts the injected <link rel="stylesheet"> to a non-blocking preload,
// saving ~200ms of render-blocking time on mobile.
function nonBlockingCss(): Plugin {
  return {
    name: 'non-blocking-css',
    transformIndexHtml(html) {
      return html.replace(
        /<link rel="stylesheet" crossorigin href="([^"]+\.css)">/g,
        (_, href) =>
          `<link rel="preload" as="style" crossorigin href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
          `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), nonBlockingCss()],
  // Base path for GitHub Pages deployment (overridden to '/' for Cloudflare Pages)
  base: process.env.VITE_BASE_PATH ?? '/peerscope-waitlist/',
})
