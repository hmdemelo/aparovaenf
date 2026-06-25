'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const BOTTOM_SLACK = 4 // px tolerance for "scrolled to the bottom"
const TRIGGER_DISTANCE = 90 // overscroll px past the bottom to fire advance
const RESISTANCE = 0.45 // damping so the pull feels elastic, not 1:1

type PullState = {
  /** Damped overscroll distance in px (0 when not pulling past the bottom). */
  pullDistance: number
  /** True once the pull crosses TRIGGER_DISTANCE; release will advance. */
  ready: boolean
}

/**
 * Instagram-style pull-up-to-advance, scoped to the bottom of the page.
 *
 * Only engages when the document is already scrolled to the very bottom and the
 * finger keeps dragging up — so it never competes with normal reading scroll.
 * Releasing past the threshold calls `onAdvance`. Returns a damped distance and
 * a ready flag for rendering an elastic indicator.
 *
 * No-op when `enabled` is false (e.g. before the answer is submitted).
 */
export function usePullToAdvance(
  onAdvance: () => void,
  enabled: boolean,
): PullState {
  const [state, setState] = useState<PullState>({ pullDistance: 0, ready: false })

  // Pull origin Y; null means we are not in an active bottom-pull gesture.
  const pullStartY = useRef<number | null>(null)
  const distanceRef = useRef(0)

  const atBottom = useCallback(() => {
    const scrollBottom = window.scrollY + window.innerHeight
    return scrollBottom >= document.documentElement.scrollHeight - BOTTOM_SLACK
  }, [])

  const reset = useCallback(() => {
    pullStartY.current = null
    distanceRef.current = 0
    setState((prev) =>
      prev.pullDistance === 0 && !prev.ready
        ? prev
        : { pullDistance: 0, ready: false },
    )
  }, [])

  useEffect(() => {
    // Only the active (enabled) gesture mutates state; when disabled we just
    // clear the refs so a stale pull origin can't carry into the next question.
    pullStartY.current = null
    distanceRef.current = 0
    if (!enabled) return

    function onTouchStart(e: TouchEvent) {
      // Only arm the gesture when the reader is already at the bottom.
      pullStartY.current = atBottom() ? e.touches[0].clientY : null
    }

    function onTouchMove(e: TouchEvent) {
      if (pullStartY.current === null) return
      const dragUp = pullStartY.current - e.touches[0].clientY
      if (dragUp <= 0 || !atBottom()) {
        // Scrolled away from the bottom or dragging down: cancel the gesture.
        if (distanceRef.current !== 0) reset()
        return
      }
      const distance = dragUp * RESISTANCE
      distanceRef.current = distance
      setState({ pullDistance: distance, ready: distance >= TRIGGER_DISTANCE })
    }

    function onTouchEnd() {
      if (pullStartY.current === null) {
        reset()
        return
      }
      const shouldAdvance = distanceRef.current >= TRIGGER_DISTANCE
      reset()
      if (shouldAdvance) onAdvance()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', reset, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', reset)
    }
  }, [enabled, onAdvance, atBottom, reset])

  return state
}
