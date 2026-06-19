import React from 'react'

/**
 * GlobeFallback — Pure CSS/SVG static globe shown while Globe3D chunk loads.
 * Renders instantly with zero JS/network cost.
 */
export default function GlobeFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 320,
        height: 320,
        borderRadius: '50%',
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Outer orange glow ring */}
      <div style={{
        position: 'absolute',
        inset: -8,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(247,147,26,0.15) 0%, transparent 70%)',
        animation: 'pulse 2s cubic-bezier(.4,0,.6,1) infinite',
      }} />

      {/* Globe SVG — simplified world silhouette */}
      <svg
        viewBox="0 0 200 200"
        width="320"
        height="320"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <radialGradient id="globe-bg" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#1E3A5F" />
            <stop offset="50%" stopColor="#0F2440" />
            <stop offset="100%" stopColor="#050D1A" />
          </radialGradient>
          <radialGradient id="globe-shine" cx="30%" cy="25%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <clipPath id="globe-clip">
            <circle cx="100" cy="100" r="90" />
          </clipPath>
          <filter id="globe-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Base sphere */}
        <circle cx="100" cy="100" r="90" fill="url(#globe-bg)" />

        {/* Continent silhouettes (simplified) */}
        <g clipPath="url(#globe-clip)" opacity="0.7">
          {/* North America */}
          <path d="M30,55 L55,45 L70,50 L75,65 L65,80 L55,85 L45,80 L35,70 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* South America */}
          <path d="M55,95 L70,90 L78,100 L75,120 L65,135 L55,130 L48,115 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* Europe */}
          <path d="M95,45 L115,42 L118,52 L108,58 L98,55 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* Africa */}
          <path d="M100,65 L120,62 L128,75 L125,100 L115,115 L100,112 L92,100 L90,80 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* Asia */}
          <path d="M115,40 L155,38 L165,50 L160,65 L145,70 L130,65 L120,58 L112,50 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* Australia */}
          <path d="M148,100 L168,98 L172,112 L162,122 L148,118 L142,108 Z"
            fill="#2D6A4F" opacity="0.8" />
          {/* Latitude lines */}
          {[40, 70, 100, 130, 160].map(cy => (
            <ellipse key={cy} cx="100" cy={cy} rx="89" ry="8"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8" />
          ))}
          {/* Longitude lines */}
          {[0, 36, 72, 108, 144].map(rot => (
            <ellipse key={rot} cx="100" cy="100" rx="20" ry="89"
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"
              transform={`rotate(${rot} 100 100)`} />
          ))}
        </g>

        {/* Glass shine overlay */}
        <circle cx="100" cy="100" r="90" fill="url(#globe-shine)" />

        {/* Outer rim with orange accent */}
        <circle cx="100" cy="100" r="90" fill="none"
          stroke="rgba(247,147,26,0.35)" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="88" fill="none"
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Loading dots — hint at interactivity */}
        {[
          { cx: 62, cy: 60 },
          { cx: 130, cy: 52 },
          { cx: 145, cy: 108 },
        ].map((pt, i) => (
          <circle key={i} cx={pt.cx} cy={pt.cy} r="3.5"
            fill="#F7931A" opacity="0.85"
            filter="url(#globe-glow)" />
        ))}
      </svg>
    </div>
  )
}
