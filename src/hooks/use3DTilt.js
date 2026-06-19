import { useState, useRef, useCallback } from 'react'

/**
 * use3DTilt - Custom hook to compute 3D tilt transformation styles and
 * set CSS variables for holographic shimmer effects based on mouse position.
 *
 * @param {Object} options Configuration parameters
 * @param {number} options.maxTilt Maximum degrees of rotation (default: 12)
 * @param {number} options.scale Scaling factor on hover (default: 1.02)
 * @param {number} options.perspective 3D perspective depth in px (default: 1000)
 */
export function use3DTilt({ maxTilt = 12, scale = 1.02, perspective = 1000 } = {}) {
  const ref = useRef(null)
  const [style, setStyle] = useState({
    transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
  })

  const handleMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Normalize coordinates from -0.5 to 0.5 relative to center
    const normalizedX = (x / rect.width) - 0.5
    const normalizedY = (y / rect.height) - 0.5

    // Calculate rotation angles
    const rotateX = (-normalizedY * maxTilt).toFixed(2)
    const rotateY = (normalizedX * maxTilt).toFixed(2)

    // Calculate holographic positions in percentage (0 to 100)
    const holoX = ((x / rect.width) * 100).toFixed(1)
    const holoY = ((y / rect.height) * 100).toFixed(1)

    // Apply CSS custom properties directly to the element for performance
    el.style.setProperty('--holo-x', `${holoX}%`)
    el.style.setProperty('--holo-y', `${holoY}%`)

    setStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s ease-out'
    })
  }, [maxTilt, scale, perspective])

  const handleMouseLeave = useCallback(() => {
    const el = ref.current
    if (el) {
      el.style.setProperty('--holo-x', '50%')
      el.style.setProperty('--holo-y', '50%')
    }

    setStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)'
    })
  }, [perspective])

  return {
    ref,
    style,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  }
}
