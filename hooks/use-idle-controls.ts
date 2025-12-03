'use client'

import { useEffect, useRef, useState } from 'react'

interface UseIdleControlsOptions {
  idleTimeout?: number
  initialVisible?: boolean
}

export function useIdleControls({
  idleTimeout = 3000,
  initialVisible = true,
}: UseIdleControlsOptions = {}) {
  const [isVisible, setIsVisible] = useState(initialVisible)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleUserActivity = () => {
      setIsVisible(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsVisible(false), idleTimeout)
    }

    const events = [
      'mousemove',
      'mousedown',
      'touchstart',
      'touchmove',
      'keydown',
    ]
    for (const e of events) {
      window.addEventListener(e, handleUserActivity, { passive: true })
    }
    handleUserActivity()

    return () => {
      for (const e of events) {
        window.removeEventListener(e, handleUserActivity)
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [idleTimeout])

  const show = () => setIsVisible(true)

  return { isVisible, show }
}
