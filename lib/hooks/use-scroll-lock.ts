'use client'

import { useEffect } from 'react'

/**
 * Locks body scroll while a modal/dialog is open.
 *
 * On iOS Safari, `overflow: hidden` on the body is not enough — the page still
 * scroll-chains behind a fixed overlay. Pinning the body with `position: fixed`
 * and a negative top offset stops the background from moving, and the original
 * scroll position is restored on unlock.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const scrollY = window.scrollY
    const { body } = document
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    }

    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
