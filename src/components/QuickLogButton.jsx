import React from 'react'
import { Leaf } from 'lucide-react'
import EmojiIcon from './EmojiIcon.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'

/**
 * QuickLogButton - Reusable tap-friendly buttons to easily log carbon footprint activities.
 */
export default function QuickLogButton({
  log,
  onClick,
  flashed = false,
  className = ''
}) {
  const { ref, style, onMouseMove, onMouseLeave } = use3DTilt({ maxTilt: 10, scale: 1.02 })

  if (!log) return null

  const IconComponent = log.emoji

  // Color badge based on emissions count
  let badgeClasses = 'bg-[#0F1115] text-[#EF4444] border border-[#EF4444]/25 rounded-md font-mono'
  if (log.co2 < 0) {
    badgeClasses = 'bg-[#0F1115] text-[#10B981] border border-[#10B981]/25 rounded-md font-mono'
  } else if (log.co2 < 1) {
    badgeClasses = 'bg-[#0F1115] text-[#94A3B8] border border-white/5 rounded-md font-mono'
  } else if (log.co2 < 3) {
    badgeClasses = 'bg-[#0F1115] text-[#FFD600] border border-[#FFD600]/25 rounded-md font-mono'
  }

  return (
    <button
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={style}
      id={`quick-log-${log.id}`}
      type="button"
      onClick={onClick}
      className={`glass-card flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left w-full cursor-pointer focus-visible:ring-2 focus-visible:ring-clay-primary focus:outline-none ${
        flashed
          ? 'border-[#F7931A] bg-[#F7931A]/10 scale-[0.95]'
          : 'active:scale-[0.95]'
      } ${className}`}
      aria-label={`Log activity: ${log.label}. Emission: ${log.co2} kg CO2.`}
    >
      <div className="flex items-center justify-center w-10 h-10 border border-[#F7931A]/20 bg-[#030304] rounded-lg shrink-0 transition-all shadow-[0_0_12px_rgba(247,147,26,0.06)]">
          <EmojiIcon icon={log.emoji || log.icon || Leaf} className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1 ml-1.5 font-sans">
        <p className="text-sm font-bold text-clay-text leading-snug truncate font-display">{log.label}</p>
        <p className="text-xs text-clay-muted mt-0.5 leading-none font-medium truncate font-sans">{log.note}</p>
      </div>

      <span className={`text-[9px] font-bold px-2 py-0.5 shrink-0 uppercase tracking-widest border select-none ${badgeClasses}`}>
        {log.co2 > 0 ? '+' : ''}{log.co2} kg
      </span>
    </button>
  )
}
