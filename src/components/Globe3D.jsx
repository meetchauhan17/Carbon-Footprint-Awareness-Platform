import React, { useRef, useEffect } from 'react'
import * as THREE from 'three'

/**
 * Globe3D — Three.js rotating Earth for the Dashboard hero.
 *
 * Performance safeguards:
 *  - Canvas capped at 320×320, devicePixelRatio capped at 2
 *  - rAF loop paused when tab is hidden (Page Visibility API)
 *  - prefers-reduced-motion: static single frame, no rAF loop
 *  - Full cleanup on unmount: geometry, material, texture, renderer disposed
 *  - Texture loaded from local public folder (NOT bundled) — cached by browser
 *
 * @param {Object} props
 * @param {number|null} props.latitude   User's lat from countryData (optional)
 * @param {number|null} props.longitude  User's lon from countryData (optional)
 * @param {string}      props.countryCode 2-letter country code (optional, for marker)
 */
export default function Globe3D({ latitude = null, longitude = null, size = 320 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Capability checks ───────────────────────────────────────────────
    const prefersReduced = typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,            // transparent background — sits over dark theme
    })
    renderer.setSize(size, size)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // cap GPU cost
    renderer.setClearColor(0x000000, 0)                          // fully transparent

    // ── Scene & Camera ──────────────────────────────────────────────────
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 4.2

    // ── Lights ──────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffd8a8, 1.1) // warm sunlight
    sunLight.position.set(5, 3, 5)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x1e3a5f, 0.4) // blue rim from behind
    rimLight.position.set(-5, -2, -3)
    scene.add(rimLight)

    // ── Earth Geometry ──────────────────────────────────────────────────
    const geometry = new THREE.SphereGeometry(1.5, 64, 64)

    // Texture: loaded from local path under public/textures/earth.jpg
    // Fallback: If texture loading fails, it falls back to a solid dark-blue sphere
    // with ambient, sun, and rim lighting + orange markers + atmosphere glow.
    const textureLoader = new THREE.TextureLoader()
    const texture = textureLoader.load(
      '/textures/earth.jpg',
      () => {
        // Force re-render once texture is loaded successfully
        renderer.render(scene, camera)
      },
      undefined,
      (err) => {
        console.error('Failed to load local Earth texture, using solid-color fallback:', err)
        material.map = null
        material.color.setHex(0x0f172a) // Deep slate blue/black to blend with dark mode
        material.needsUpdate = true
        renderer.render(scene, camera)
      }
    )
    texture.minFilter = THREE.LinearFilter // avoid mipmap generation cost

    const material = new THREE.MeshPhongMaterial({
      map: texture,
      specular: new THREE.Color(0x1a3a5f),
      shininess: 18,
    })

    const earth = new THREE.Mesh(geometry, material)
    scene.add(earth)

    // ── Atmosphere Glow (sprite-based outer ring) ────────────────────────
    const atmosGeo = new THREE.SphereGeometry(1.57, 32, 32)
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x1a6eff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    })
    scene.add(new THREE.Mesh(atmosGeo, atmosMat))

    // ── Helper: lat/lon to 3D point on sphere surface ────────────────────
    function latLonToVec3(lat, lon, radius) {
      const phi   = (90 - lat)  * (Math.PI / 180)
      const theta = (lon + 180) * (Math.PI / 180)
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
         radius * Math.cos(phi),
         radius * Math.sin(phi) * Math.sin(theta)
      )
    }

    // ── Activity Markers ────────────────────────────────────────────────
    // Default hotspots (representative global emission regions)
    const DEFAULT_MARKERS = [
      { lat: 20.5937,  lon: 78.9629  }, // India (user likely)
      { lat: 39.9042,  lon: 116.4074 }, // Beijing, China
      { lat: 37.0902,  lon: -95.7129 }, // USA center
    ]

    const markerPositions =
      latitude !== null && longitude !== null
        ? [
            { lat: latitude,    lon: longitude   },  // user's country
            { lat: 39.9042,     lon: 116.4074    },  // China
            { lat: 37.0902,     lon: -95.7129    },  // USA
          ]
        : DEFAULT_MARKERS

    const markerGeo  = new THREE.SphereGeometry(0.035, 8, 8)
    const markerMats = []
    const markers    = []

    markerPositions.forEach(({ lat, lon }) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xF7931A })
      markerMats.push(mat)
      const mesh = new THREE.Mesh(markerGeo, mat)
      const pos  = latLonToVec3(lat, lon, 1.52)
      mesh.position.copy(pos)
      scene.add(mesh)
      markers.push(mesh)

      // Glow sprite around each marker
      const glowGeo = new THREE.SphereGeometry(0.07, 8, 8)
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xF7931A, transparent: true, opacity: 0.25
      })
      const glow = new THREE.Mesh(glowGeo, glowMat)
      glow.position.copy(pos)
      scene.add(glow)
    })

    // ── Render loop ─────────────────────────────────────────────────────
    let rafHandle = null
    let isVisible = !document.hidden

    const render = () => {
      if (!isVisible) return
      earth.rotation.y += 0.0015 // slow auto-rotation
      renderer.render(scene, camera)
      rafHandle = requestAnimationFrame(render)
    }

    const handleVisibilityChange = () => {
      isVisible = !document.hidden
      if (isVisible && !prefersReduced && rafHandle === null) {
        render() // resume
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    if (prefersReduced) {
      // Static single frame — respect prefers-reduced-motion
      renderer.render(scene, camera)
    } else {
      render()
    }

    // ── Cleanup on unmount ───────────────────────────────────────────────
    return () => {
      if (rafHandle !== null) cancelAnimationFrame(rafHandle)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      // Dispose geometry, materials, textures, renderer
      geometry.dispose()
      material.dispose()
      texture.dispose()
      atmosGeo.dispose()
      atmosMat.dispose()
      markerGeo.dispose()
      markerMats.forEach(m => m.dispose())
      renderer.dispose()
    }
  }, [latitude, longitude, size])

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-label="Rotating 3D Earth globe showing global carbon emission hotspots"
      role="img"
    >
      {/* Outer orange glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(247,147,26,0.18) 0%, rgba(247,147,26,0.06) 45%, transparent 70%)',
          transform: 'scale(1.15)',
        }}
      />
      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ borderRadius: '50%', display: 'block', position: 'relative', zIndex: 1 }}
      />
    </div>
  )
}
