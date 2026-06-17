import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'

/**
 * EmptyState - A visually pleasing state indicator when no records or data are available.
 */
export default function EmptyState({
  title = 'No data available',
  description = 'Start by adding a record to populate this view!',
  icon: Icon = Leaf,
  actionText,
  onActionClick,
  actionLink,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white/50 border border-green-100/30 rounded-3xl max-w-md mx-auto space-y-4 animate-fade-in ${className}`}
    >
      {/* Icon Circle */}
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600 shadow-inner">
        {typeof Icon === 'string' ? (
          <span className="text-3xl select-none" role="img" aria-label="illustration">{Icon}</span>
        ) : (
          <Icon className="w-8 h-8 text-green-500 animate-pulse" />
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-extrabold text-gray-800 leading-tight">
          {title}
        </h3>
        <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action CTA Link or Button */}
      {actionText && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-bold text-xs shadow-md shadow-green-100 cursor-pointer"
            >
              {actionText}
            </Link>
          ) : (
            onActionClick && (
              <button
                type="button"
                onClick={onActionClick}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all font-bold text-xs shadow-md shadow-green-100 cursor-pointer"
              >
                {actionText}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
