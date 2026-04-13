import { useEffect, useState } from 'react'

// April 15 2026, 11:59:59 PM AEST (+10:00)
const DEADLINE = new Date('2026-04-15T23:59:59+10:00')
const URGENT_THRESHOLD_MS = 48 * 60 * 60 * 1000 // 48 hours

interface TimeLeft {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(): TimeLeft | null {
  const total = DEADLINE.getTime() - Date.now()
  if (total <= 0) return null
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((total % (1000 * 60)) / 1000)
  return { total, days, hours, minutes, seconds }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(getTimeLeft())
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (timeLeft === null) {
    return (
      <p
        className="mt-3 text-sm text-center"
        style={{ fontSize: 14, color: 'rgba(250,250,246,0.65)' }}
      >
        Waitlist closed
      </p>
    )
  }

  const isUrgent = timeLeft.total <= URGENT_THRESHOLD_MS

  if (isUrgent) {
    // Live HH:MM:SS ticker — final 48h push
    const displayHours = timeLeft.days * 24 + timeLeft.hours
    return (
      <p className="mt-3 text-sm text-center" style={{ fontSize: 14 }}>
        <span
          className="inline-flex items-center gap-1.5"
          style={{ color: '#B8622A', fontWeight: 700 }}
        >
          {/* Pulsing dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: '#B8622A' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: '#B8622A' }}
            />
          </span>
          {pad(displayHours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
        </span>
        <span style={{ color: 'rgba(250,250,246,0.65)' }}>{' '}left — founding price closes April 15</span>
      </p>
    )
  }

  // More than 48h away — show simplified days/hours
  return (
    <p
      className="mt-3 text-sm text-center"
      style={{ fontSize: 14 }}
    >
      <span style={{ color: '#B8622A', fontWeight: 600 }}>
        {timeLeft.days}d {timeLeft.hours}h
      </span>
      <span style={{ color: 'rgba(250,250,246,0.65)' }}>{' '}left at founding price</span>
    </p>
  )
}
