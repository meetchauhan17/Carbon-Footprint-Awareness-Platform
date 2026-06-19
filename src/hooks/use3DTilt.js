import { useRef, useCallback, useEffect } from 'react'

// Capability checks (stable across renders, evaluated once at module scope level)
const isTouchOnly = typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches

const prefersReduced = typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * use3DTilt — High-performance 3D card tilt + holographic cursor tracking.
 *
 * Performance features:
 *  - rAF-throttled mousemove: only one frame update queued at a time,
 *    skips duplicate events that arrive within the same frame (~16ms).
 *  - Direct DOM mutation for transforms: bypasses React state during move,
 *    so NO React re-renders fire on mousemove (previously caused 60-120
 *    setState calls/sec per card).
 *  - Touch-device guard: pointer:coarse / hover:none devices skip all
 *    listener setup entirely — no wasted event handler memory on mobile.
 *  - prefers-reduced-motion guard: JS check mirrors the CSS media query so
 *    the JS-driven rotateX/Y also respects the user's OS accessibility setting.
 *
 * @param {Object} options
 * @param {number} options.maxTilt     Maximum rotation in degrees (default: 12)
 * @param {number} options.scale       Scale factor on hover (default: 1.02)
 * @param {number} options.perspective CSS perspective depth in px (default: 1000)
 */
export function use3DTilt({ maxTilt = 12, scale = 1.02, perspective = 1000 } = {}) {
  const ref = useRef(null)
  const rafId = useRef(null)           // rAF handle — prevents queuing multiple frames
  const pendingEvent = useRef(null)    // stores the latest mousemove event data

  // Apply initial identity transform to element once mounted
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`
    el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
    el.style.setProperty('--holo-x', '50%')
    el.style.setProperty('--holo-y', '50%')
  }, [perspective])

  // ── rAF frame processor ────────────────────────────────────────────────
  const processFrame = useCallback(() => {
    rafId.current = null // mark as free so next event can queue a new frame

    const el = ref.current
    const ev = pendingEvent.current
    if (!el || !ev) return

    const rect = el.getBoundingClientRect()
    const x = ev.clientX - rect.left
    const y = ev.clientY - rect.top

    const normalizedX = (x / rect.width) - 0.5
    const normalizedY = (y / rect.height) - 0.5

    const rotateX = (-normalizedY * maxTilt).toFixed(2)
    const rotateY = (normalizedX * maxTilt).toFixed(2)
    const holoX   = ((x / rect.width)  * 100).toFixed(1)
    const holoY   = ((y / rect.height) * 100).toFixed(1)

    // Direct DOM mutation — zero React re-renders
    el.style.transform  = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale},${scale},${scale})`
    el.style.transition = 'transform 0.08s ease-out'
    el.style.setProperty('--holo-x', `${holoX}%`)
    el.style.setProperty('--holo-y', `${holoY}%`)
  }, [maxTilt, scale, perspective])

  // ── Event handlers ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    // Guard 1: touch-only devices — skip entirely
    if (isTouchOnly) return
    // Guard 2: reduced motion — skip tilt transforms
    if (prefersReduced) return

    pendingEvent.current = e  // store latest event data

    // rAF throttle: only queue one frame at a time
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(processFrame)
    }
    // else: a frame is already queued; processFrame will pick up pendingEvent
  }, [processFrame])

  const handleMouseLeave = useCallback(() => {
    if (isTouchOnly) return

    // Cancel any pending rAF (event left element mid-frame)
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current)
      rafId.current = null
    }
    pendingEvent.current = null

    const el = ref.current
    if (!el) return

    // Reset to identity — direct DOM mutation, no setState
    el.style.transform  = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`
    el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
    el.style.setProperty('--holo-x', '50%')
    el.style.setProperty('--holo-y', '50%')
  }, [perspective])

  // Cleanup on unmount — cancel any queued rAF
  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [])

  return {
    ref,
    style: {},
    onMouseMove:  isTouchOnly || prefersReduced ? undefined : handleMouseMove,
    onMouseLeave: isTouchOnly || prefersReduced ? undefined : handleMouseLeave,
  }
}
