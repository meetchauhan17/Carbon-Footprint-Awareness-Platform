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
      className={`glass-card flex items-center gap-2 sm:gap-3.5 px-2.5 py-3 sm:px-4 sm:py-3.5 rounded-xl text-left w-full cursor-pointer focus-visible:ring-2 focus-visible:ring-clay-primary focus:outline-none ${
        flashed
          ? 'border-[#F7931A] bg-[#F7931A]/10 scale-[0.95]'
          : 'active:scale-[0.95]'
      } ${className}`}
      aria-label={`Log activity: ${log.label}. Emission: ${log.co2} kg CO2.`}
    >
      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 border border-[#F7931A]/20 bg-[#030304] rounded-lg shrink-0 transition-all shadow-[0_0_12px_rgba(247,147,26,0.06)]">
          <EmojiIcon icon={log.emoji || log.icon || Leaf} className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      <div className="min-w-0 flex-1 ml-0.5 sm:ml-1.5 font-sans">
        <p className="text-xs sm:text-sm font-bold text-clay-text leading-snug truncate font-display">{log.label}</p>
        <p className="text-[10px] sm:text-xs text-clay-muted mt-0.5 leading-none font-medium truncate font-sans">{log.note}</p>
      </div>

      <span className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 shrink-0 uppercase tracking-wider sm:tracking-widest border select-none ${badgeClasses}`}>
        {log.co2 > 0 ? '+' : ''}{log.co2} kg
      </span>
    </button>
  )
}
