import { useEffect, useState } from 'react'

const DEADLINE = new Date('2026-04-15T23:59:59+08:00')

interface TimeLeft {
  days: number
  hours: number
}

function getTimeLeft(): TimeLeft | null {
  const diff = DEADLINE.getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return { days, hours }
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
