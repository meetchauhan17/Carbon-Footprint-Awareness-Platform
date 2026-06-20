import React from 'react'
import PropTypes from 'prop-types'

/**
 * ProgressBar - Reusable animated progress bar with percentage labels and color configurations.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  labelStyle = 'percentage', // 'percentage' | 'fraction' | 'none'
  color = 'bg-gradient-to-r from-[#EA580C] to-[#F7931A]', // default Bitcoin orange
  className = '',
  labelClassName = ''
}) {
  const safeValue = Math.max(0, Math.min(value, max))
  const percentage = max > 0 ? (safeValue / max) * 100 : 0

  return (
    <div
      className={`w-full ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin="0"
      aria-valuemax={max}
      aria-label={`Progress: ${Math.round(percentage)}%`}
    >
      {showLabel && labelStyle !== 'none' && (
        <div className="flex justify-between items-center mb-1.5 font-sans">
          <span className={`text-[10px] font-bold text-clay-muted uppercase tracking-widest ${labelClassName}`}>
            Progress
          </span>
          <span className="text-xs font-bold text-[#F7931A] bg-[#0F1115] border border-[#F7931A]/20 px-2 py-0.5 rounded-md select-none font-mono">
            {labelStyle === 'percentage' 
              ? `${Math.round(percentage)}%` 
              : `${safeValue} / ${max}`}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-[#1E293B] rounded-full overflow-hidden shadow-inner border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  max: PropTypes.number,
  showLabel: PropTypes.bool,
  labelStyle: PropTypes.oneOf(['percentage', 'fraction', 'none']),
  color: PropTypes.string,
  className: PropTypes.string,
  labelClassName: PropTypes.string
}

