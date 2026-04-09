import { useState, useEffect } from 'react'

interface StatsResponse {
  count: number
  show_count: boolean
}

type CountState =
  | { status: 'loading' }
  | { status: 'visible'; count: number }
  | { status: 'hidden' }

export function LiveSignupCount() {
  const [state, setState] = useState<CountState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function fetchCount() {
      try {
        const res = await fetch('/api/public/stats')
        if (!res.ok) throw new Error('non-ok')
        const data: StatsResponse = await res.json()
        if (cancelled) return
        if (data.count > 0) {
          setState({ status: 'visible', count: data.count })
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
      className="mt-3 text-sm text-center"
      style={{ color: '#F07C35', fontSize: '14px' }}
      aria-live="polite"
    >
      {state.status === 'loading' ? (
        <>Join founders already on the waitlist</>
      ) : (
        <>Join {state.count.toLocaleString()} founders already on the waitlist</>
      )}
    </p>
  )
}
