'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Returns whether a top bar should be visible based on scroll direction.
 *
 * Scrolling down hides it (to maximize reading space); scrolling up reveals it
 * again. Always visible near the top of the page. A small threshold avoids
 * flicker from tiny scroll jitters and the iOS rubber-band overscroll.
 *
 * @param threshold Minimum scroll delta (px) before toggling. Defaults to 8.
 */
export function useHideOnScroll(threshold = 8): boolean {
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    function onScroll() {
      const currentY = window.scrollY
      const delta = currentY - lastScrollY.current

      // Near the top: always show.
      if (currentY <= 0) {
        setVisible(true)
        lastScrollY.current = currentY
        return
      }

      if (Math.abs(delta) < threshold) return

      setVisible(delta < 0)
      lastScrollY.current = currentY
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return visible
}
