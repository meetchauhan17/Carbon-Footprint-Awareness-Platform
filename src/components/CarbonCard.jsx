import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

/**
 * CarbonCard - Reusable stat card with icon, value, label, trend indicator, and styling customization.
 */
export default function CarbonCard({
  label,
  value,
  subText,
  icon: Icon,
  trend, // 'up' | 'down' | 'neutral'
  trendText,
  accentColor = '#16a34a', // default green
  delay = 0,
  className = '',
  onClick,
  children
}) {
  const isInteractive = typeof onClick === 'function'

  // Determine trend icon and color
  let TrendIcon = null
  let trendClass = 'text-gray-400 bg-gray-50 border-gray-100'
  if (trend === 'up') {
    TrendIcon = ArrowUpRight
    trendClass = 'text-red-600 bg-red-50 border-red-100'
  } else if (trend === 'down') {
    TrendIcon = ArrowDownRight
    trendClass = 'text-green-700 bg-green-50 border-green-100'
  } else if (trend === 'neutral') {
    TrendIcon = Minus
    trendClass = 'text-gray-500 bg-gray-50 border-gray-200'
  }

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`glass-card p-5 animate-fade-in-up transition-all duration-300 ${
        isInteractive ? 'hover:shadow-md hover:border-green-200 cursor-pointer active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        borderLeft: `3px solid ${accentColor}`
      }}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{value}</p>
          
          {subText && <p className="text-xs text-gray-500 font-medium leading-tight">{subText}</p>}
          
          {(trend || trendText) && (
            <div className="flex items-center gap-1.5 mt-2">
              {TrendIcon && (
                <div className={`flex items-center justify-center p-0.5 rounded-full border ${trendClass}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                </div>
              )}
              {trendText && (
                <span className={`text-xs font-bold ${
                  trend === 'down' ? 'text-green-600' : trend === 'up' ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {trendText}
                </span>
              )}
            </div>
          )}
          {children}
        </div>

        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}15` }}
            aria-hidden="true"
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        )}
      </div>
    </div>
  )
}
