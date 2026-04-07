import { useState, useEffect, useCallback } from 'react'
import { EmailForm } from './shared'

const STORAGE_KEY = 'exit_intent_shown'
const INACTIVITY_MS = 60_000

export function ExitIntentModal() {
  const [visible, setVisible] = useState(false)

  const shouldShow = useCallback(() => {
    try {
      if (localStorage.getItem('ps_sub') === '1') return false
      if (localStorage.getItem(STORAGE_KEY) === 'true') return false
    } catch {
      // localStorage blocked — still show
    }
    return true
  }, [])

  const trigger = useCallback(() => {
    if (!shouldShow()) return
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    setVisible(true)
  }, [shouldShow])

  const dismiss = useCallback(() => setVisible(false), [])

  // Desktop: cursor near browser chrome (mouseleave near top of viewport)
  useEffect(() => {
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY < 10) trigger()
    }
    document.addEventListener('mouseleave', onMouseLeave)
    return () => document.removeEventListener('mouseleave', onMouseLeave)
  }, [trigger])

  // Mobile: 60s inactivity
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function resetTimer() {
      clearTimeout(timer)
      timer = setTimeout(trigger, INACTIVITY_MS)
    }

    const events = ['touchstart', 'touchmove', 'click', 'scroll', 'keydown'] as const
    events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }))
    timer = setTimeout(trigger, INACTIVITY_MS)

    return () => {
      clearTimeout(timer)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [trigger])

  // Escape key dismiss
  useEffect(() => {
    if (!visible) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [visible, dismiss])

  // Lock body scroll when modal open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ background: '#1A1A14' }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Scarcity indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F07C35] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B8622A]" />
          </span>
          <span className="text-xs font-medium text-[#F07C35]/80 uppercase tracking-wider">
            Founding price — 50 spots only
          </span>
        </div>

        {/* Heading */}
        <h2
          id="exit-modal-heading"
          className="text-white font-bold text-xl leading-snug mb-2"
          style={{ fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Wait — you're leaving without your spot
        </h2>
        <p className="text-white/55 text-sm mb-6 leading-relaxed">
          We're capping the founding price at 50 members. Lock it in before it's gone.
        </p>

        {/* Email form */}
        <EmailForm
          placeholder="Enter your work email"
          buttonText="Claim my spot →"
          size="default"
          variant="dark"
          onSuccess={dismiss}
        />

        {/* Reassurance */}
        <p className="mt-4 text-center text-xs text-white/35">
          No spam. One update when we launch.
        </p>
      </div>
    </div>
  )
}
