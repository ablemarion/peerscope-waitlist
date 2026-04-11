import { useState, useEffect, useRef } from 'react'

interface StatsResponse {
  count: number
  show_count: boolean
}

type CountState =
  | { status: 'loading' }
  | { status: 'visible'; count: number }
  | { status: 'hidden' }

function useCountUp(target: number, duration = 600): number {
  const [displayed, setDisplayed] = useState(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return
    startRef.current = null

    function step(timestamp: number) {
      if (startRef.current === null) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return displayed
}

function AnimatedCount({ count }: { count: number }) {
  const displayed = useCountUp(count)
  return <>{displayed.toLocaleString()}</>
}

export function LiveSignupCount() {
  const [state, setState] = useState<CountState>({ status: 'loading' })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchCount() {
      try {
        const res = await fetch('/api/public/stats')
        if (!res.ok) throw new Error('non-ok')
        const data: StatsResponse = await res.json()
        if (cancelled) return
        if (data.show_count && data.count > 0) {
          setState({ status: 'visible', count: data.count })
          requestAnimationFrame(() => setVisible(true))
        } else {
          setState({ status: 'hidden' })
        }
      } catch {
        if (!cancelled) setState({ status: 'hidden' })
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30_000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (state.status === 'hidden') return null

  return (
    <p
      className="mt-3 text-sm text-center transition-opacity duration-500"
      style={{
        color: '#F07C35',
        fontSize: '14px',
        opacity: state.status === 'loading' ? 1 : visible ? 1 : 0,
      }}
      aria-live="polite"
    >
      {state.status === 'loading' ? (
        <>Join founders already on the waitlist</>
      ) : (
        <>Join <AnimatedCount count={state.count} /> founders already on the waitlist</>
      )}
    </p>
  )
}
