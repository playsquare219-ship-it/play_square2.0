"use client"

import { useState, useEffect } from "react"

interface CountdownValues {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function useCountdown(targetDate: string): CountdownValues {
  const [values, setValues] = useState<CountdownValues>(() =>
    calculateDiff(targetDate)
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = calculateDiff(targetDate)
      setValues(diff)
      if (diff.isExpired) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return values
}

function calculateDiff(targetDate: string): CountdownValues {
  const now = Date.now()
  const target = new Date(targetDate).getTime()
  const diff = Math.max(0, target - now)

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false,
  }
}
