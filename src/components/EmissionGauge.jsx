import React, { useState, useEffect } from 'react'
import { use3DTilt } from '../hooks/use3DTilt.js'

/**
 * Helper to get status label and color for carbon values (in kg CO2)
 */
function getDailyLevel(kg) {
  if (kg < 5)  return { label: 'Low',      color: '#10B981', glow: 'rgba(16, 185, 129, 0.4)' } // Emerald green
  if (kg < 10) return { label: 'Moderate', color: '#FFD600', glow: 'rgba(255, 214, 0, 0.4)' } // Digital gold
  if (kg < 20) return { label: 'High',     color: '#F7931A', glow: 'rgba(247, 147, 26, 0.4)' } // Bitcoin Orange
  return          { label: 'Critical',  color: '#EF4444', glow: 'rgba(239, 68, 68, 0.4)' } // Red
}

/**
 * EmissionGauge - Circular 3D progress dial representing carbon output.
 * Featuring metallic casings, diagonal glass glare reflections, back-glows,
 * and 3D mouse tilt responsiveness.
 */
export default function EmissionGauge({
  value,
  max = 30,
  label = 'kg CO₂ today',
  levelText,
  colorOverride,
  className = ''
}) {
  const [animatedValue, setAnimatedValue] = useState(0)
  
  // 3D tilt responsiveness for the outer dial casing
  const tilt = use3DTilt({ maxTilt: 14, scale: 1.025 })

  const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0

  // Smooth ease-out animation on mount or value change
  useEffect(() => {
    const duration = 1200 // 1.2s animation
    const startTime = performance.now()
    const startValue = animatedValue
    const targetValue = safeValue

    let animId
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(startValue + (targetValue - startValue) * ease)

      if (progress < 1) {
        animId = requestAnimationFrame(update)
      } else {
        setAnimatedValue(targetValue)
      }
    }

    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [value])

  const r = 78
  const cx = 100
  const cy = 100
  const circumference = 2 * Math.PI * r
  
  // Calculate percentage based on current animated value
  const pct = Math.min(animatedValue / max, 1)
  const dashOffset = circumference * (1 - pct)

  // Determine levels and gradients based on target values
  const level = getDailyLevel(safeValue)
  const strokeColor = colorOverride || level.color
  const glowColor = colorOverride || level.glow

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{
        ...tilt.style,
        transformStyle: 'preserve-3d'
      }}
      className={`flex flex-col items-center justify-center p-6 rounded-[36px] bg-[#0A0D14]/90 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-all duration-300 relative group overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={parseFloat(safeValue.toFixed(1))}
      aria-valuemin="0"
      aria-valuemax={max}
      aria-label={`Carbon emission gauge: ${safeValue.toFixed(1)} ${label}`}
    >
      {/* 3D Concave backing panel */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#141A29] to-[#05070B] -z-10 opacity-90"
        style={{ transform: 'translateZ(-10px)' }}
      />
      
      {/* Dynamic LED ambient illumination behind the casing */}
      <div 
        className="absolute w-44 h-44 rounded-full blur-3xl opacity-20 transition-all duration-500 pointer-events-none"
        style={{
          background: strokeColor,
          transform: 'translateZ(-20px)',
          boxShadow: `0 0 60px 20px ${strokeColor}`
        }}
      />

      <div className="relative w-52 h-52 preserve-3d" style={{ transform: 'translateZ(15px)' }}>
        {/* Curved Glass Glare Cover effect overlay */}
        <div 
          className="absolute inset-2.5 rounded-full pointer-events-none z-20 gauge-glass-glare opacity-75 border border-white/10" 
          aria-hidden="true" 
        />

        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
          <defs>
            {/* 3D drop shadow filter */}
            <filter id="gauge-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
            </filter>
            
            {/* Metallic radial gradient for casing rim */}
            <radialGradient id="metallic-grad" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
              <stop offset="0%" stopColor="#4A5568" />
              <stop offset="60%" stopColor="#1C2433" />
              <stop offset="100%" stopColor="#0B0E17" />
            </radialGradient>

            {/* Inner dial plate gradient */}
            <radialGradient id="dial-plate" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="#080A10" />
              <stop offset="100%" stopColor="#141B2B" />
            </radialGradient>

            {/* Neon indicator progress gradient */}
            <linearGradient id="neon-glow-stroke" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.6} />
              <stop offset="100%" stopColor={strokeColor} />
            </linearGradient>
          </defs>

          {/* 1. Outer 3D Beveled Metallic Ring Casing */}
          <circle
            cx={cx}
            cy={cy}
            r="94"
            fill="url(#metallic-grad)"
            stroke="#2D3748"
            strokeWidth="2"
            filter="url(#gauge-shadow)"
          />

          {/* 2. Inner Dial Face Plate */}
          <circle
            cx={cx}
            cy={cy}
            r="88"
            fill="url(#dial-plate)"
            stroke="#0D1117"
            strokeWidth="1.5"
          />

          {/* 3. Engraved Radial Ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180
            const x1 = cx + 80 * Math.cos(angle)
            const y1 = cy + 80 * Math.sin(angle)
            const x2 = cx + 84 * Math.cos(angle)
            const y2 = cy + 84 * Math.sin(angle)
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#1E293B"
                strokeWidth="1.5"
                opacity="0.7"
              />
            )
          })}

          {/* 4. Inset Channel Track for Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#020305"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.9"
            aria-hidden="true"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#121824"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.9"
            aria-hidden="true"
          />

          {/* 5. Glowing Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="url(#neon-glow-stroke)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke 0.4s ease' }}
            aria-hidden="true"
          />

          {/* 6. Neon glow propagation */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity="0.65"
            style={{ filter: `drop-shadow(0 0 5px ${strokeColor})`, transition: 'stroke 0.4s ease' }}
            aria-hidden="true"
          />

          {/* 7. Center metallic hub boundary ring */}
          <circle
            cx={cx}
            cy={cy}
            r="44"
            fill="#07090F"
            stroke="#1E293B"
            strokeWidth="1"
            opacity="0.6"
          />

          {/* 8. Text Information (Values and Levels) */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="28"
            fontWeight="800"
            fontFamily="JetBrains Mono, monospace"
            style={{ fill: '#FFFFFF', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
            className="select-none text-glow-neon"
          >
            {animatedValue.toFixed(1)}
          </text>
          
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="10"
            fontWeight="700"
            fontFamily="Space Grotesk, sans-serif"
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
            className="select-none"
          >
            {label}
          </text>
          
          <text
            x={cx}
            y={cy + 32}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="10"
            fontWeight="800"
            fontFamily="Space Grotesk, sans-serif"
            style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fill: strokeColor }}
            className="select-none text-glow-neon"
          >
            {levelText || level.label}
          </text>
        </svg>
      </div>
    </div>
  )
}
