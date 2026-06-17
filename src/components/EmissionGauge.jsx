import React, { useState, useEffect } from 'react'

/**
 * Helper to get status label and color for carbon values (in kg CO2)
 */
function getDailyLevel(kg) {
  if (kg < 5)  return { label: 'Low',      color: '#16a34a' }
  if (kg < 10) return { label: 'Moderate', color: '#ca8a04' }
  if (kg < 20) return { label: 'High',     color: '#ea580c' }
  return          { label: 'Critical',  color: '#dc2626' }
}

/**
 * EmissionGauge - Circular SVG progress gauge representing carbon output.
 * Animates from 0 to the target value on mount.
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

  // Smooth animation from 0 to target value on mount or change
  useEffect(() => {
    const duration = 1200 // 1.2s animation
    const startTime = performance.now()
    const startValue = animatedValue

    let animId
    const update = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimatedValue(startValue + (value - startValue) * ease)

      if (progress < 1) {
        animId = requestAnimationFrame(update)
      } else {
        setAnimatedValue(value)
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

  // Determine color based on original target value (so the level is correct)
  const level = getDailyLevel(value)
  const strokeColor = colorOverride || level.color

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="progressbar"
      aria-valuenow={parseFloat(value.toFixed(1))}
      aria-valuemin="0"
      aria-valuemax={max}
      aria-label={`Carbon emission gauge: ${value.toFixed(1)} ${label}`}
    >
      <div className="relative w-52 h-52">
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
          {/* Background Track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="14"
            aria-hidden="true"
          />
          {/* Progress Arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke 0.4s ease' }}
            aria-hidden="true"
          />
          {/* Glow Overlay */}
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
            opacity="0.25"
            style={{ filter: 'blur(4px)', transition: 'stroke 0.4s ease' }}
            aria-hidden="true"
          />
          {/* Center Text Information */}
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="#111827"
            fontSize="30"
            fontWeight="900"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {animatedValue.toFixed(1)}
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="12"
            fontWeight="500"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {label}
          </text>
          <text
            x={cx}
            y={cy + 34}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="11"
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            {levelText || level.label}
          </text>
        </svg>
      </div>
    </div>
  )
}
