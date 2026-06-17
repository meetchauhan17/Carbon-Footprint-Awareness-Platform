import React from 'react'

/**
 * QuickLogButton - Reusable tap-friendly buttons to easily log carbon footprint activities.
 */
export default function QuickLogButton({
  log,
  onClick,
  flashed = false,
  className = ''
}) {
  if (!log) return null

  const IconComponent = log.emoji

  // Color badge based on emissions count
  let badgeClasses = 'bg-red-50 text-red-600 border border-red-100'
  if (log.co2 < 0) {
    badgeClasses = 'bg-green-100 text-green-700 border border-green-200'
  } else if (log.co2 < 1) {
    badgeClasses = 'bg-blue-50 text-blue-600 border border-blue-100'
  } else if (log.co2 < 3) {
    badgeClasses = 'bg-amber-50 text-amber-600 border border-amber-100'
  }

  return (
    <button
      id={`quick-log-${log.id}`}
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left w-full transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
        flashed
          ? 'border-green-400 bg-green-50 scale-[0.98]'
          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/60 hover:shadow-md hover:scale-[1.01]'
      } ${className}`}
      aria-label={`Log activity: ${log.label}. Emission: ${log.co2} kg CO2.`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50/50 shrink-0 border border-gray-100/50">
        {IconComponent ? (
          <IconComponent className="w-5 h-5 text-gray-500" aria-hidden="true" />
        ) : (
          <span className="text-xl select-none" role="img" aria-hidden="true">
            {log.icon || '🌱'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-gray-800 leading-snug truncate">{log.label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-none font-medium truncate">{log.note}</p>
      </div>

      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide border select-none ${badgeClasses}`}>
        {log.co2 > 0 ? '+' : ''}{log.co2} kg
      </span>
    </button>
  )
}
