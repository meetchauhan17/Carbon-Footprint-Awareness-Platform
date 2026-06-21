import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { use3DTilt } from './use3DTilt'

describe('use3DTilt Hook', () => {
  let mockElement

  beforeEach(() => {
    // Setup a dummy DOM element to bind the ref to
    mockElement = document.createElement('div')
    mockElement.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 10,
      top: 10,
      width: 200,
      height: 100,
    })

    // Mock requestAnimationFrame and cancelAnimationFrame
    vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns standard object with ref, style, and mouse event handlers', () => {
    const { result } = renderHook(() => use3DTilt())
    expect(result.current.ref).toBeDefined()
    expect(result.current.style).toEqual({})
    expect(result.current.onMouseMove).toBeTypeOf('function')
    expect(result.current.onMouseLeave).toBeTypeOf('function')
  })

  it('mutates target element transform on mouse move and mouse leave', async () => {
    const { result } = renderHook(() => use3DTilt({ maxTilt: 10, scale: 1.05 }))
    
    // Bind ref to our mock element
    result.current.ref.current = mockElement

    // Call onMouseMove
    result.current.onMouseMove({
      clientX: 110, // middle X: 10 + 200/2 = 110
      clientY: 60,  // middle Y: 10 + 100/2 = 60
    })

    // Wait for requestAnimationFrame mock callback
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Middle coordinate should have 0deg rotation
    expect(mockElement.style.transform).toContain('rotateX(0.00deg)')
    expect(mockElement.style.transform).toContain('rotateY(0.00deg)')
    expect(mockElement.style.transform).toContain('scale3d(1.05,1.05,1.05)')

    // Call onMouseLeave
    result.current.onMouseLeave()
    expect(mockElement.style.transform).toContain('rotateX(0deg)')
    expect(mockElement.style.transform).toContain('rotateY(0deg)')
    expect(mockElement.style.transform).toContain('scale3d(1,1,1)')
  })
})
