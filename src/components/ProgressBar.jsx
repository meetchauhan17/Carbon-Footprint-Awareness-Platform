import React from 'react'

/**
 * ProgressBar - Reusable animated progress bar with percentage labels and color configurations.
 */
export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = false,
  labelStyle = 'percentage', // 'percentage' | 'fraction' | 'none'
  color = 'bg-gradient-to-r from-green-500 to-emerald-600', // default gradient
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
        <div className="flex justify-between items-center mb-1.5">
          <span className={`text-[10px] font-bold text-gray-400 uppercase tracking-wide ${labelClassName}`}>
            Progress
          </span>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full select-none">
            {labelStyle === 'percentage' 
              ? `${Math.round(percentage)}%` 
              : `${safeValue} / ${max}`}
          </span>
        </div>
      )}

      {/* Progress Track */}
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-100/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
