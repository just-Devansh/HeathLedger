import { useRef, useCallback, useEffect } from 'react'

// Returns { start, cancel, move } for adding long-press to multiple rows.
//
// Usage in a list:
//   const lp = useLongPress()
//   <div
//     onPointerDown={lp.start(() => handleLongPress(item))}
//     onPointerUp={lp.cancel}
//     onPointerLeave={lp.cancel}
//     onPointerCancel={lp.cancel}
//     onPointerMove={lp.move}
//   />
//
// The callback passed to lp.start() is captured at press-time, so it always
// sees the current item from the render closure without stale-closure issues.
export function useLongPress({ delay = 450 } = {}) {
  const timerRef = useRef(null)
  const startRef = useRef(null)  // { x, y } of pointer-down, null when idle
  const cbRef    = useRef(null)  // callback to fire on long-press

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Returns an onPointerDown handler bound to `callback`.
  const start = useCallback(
    (callback) => (e) => {
      // Don't intercept taps on interactive children (three-dots, edit buttons, etc.)
      if (e.target.closest('button, a, input, select, textarea')) return
      cbRef.current    = callback
      startRef.current = { x: e.clientX, y: e.clientY }
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        cbRef.current?.()
        startRef.current = null
      }, delay)
    },
    [delay]
  )

  // Cancels any pending long-press timer.
  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
    startRef.current = null
  }, [])

  // Cancels if the pointer has moved more than 8px (user is scrolling).
  const move = useCallback((e) => {
    if (!startRef.current) return
    const dx = Math.abs(e.clientX - startRef.current.x)
    const dy = Math.abs(e.clientY - startRef.current.y)
    if (dx > 8 || dy > 8) {
      clearTimeout(timerRef.current)
      startRef.current = null
    }
  }, [])

  return { start, cancel, move }
}
