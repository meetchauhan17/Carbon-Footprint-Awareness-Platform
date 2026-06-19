import React from 'react'
import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import EmojiIcon from './EmojiIcon.jsx'

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
      className={`flex flex-col items-center justify-center text-center p-8 bg-white/60 border border-white/50 rounded-[32px] shadow-[var(--shadow-clay-card)] max-w-md mx-auto space-y-4 animate-fade-in ${className}`}
    >
      {/* Icon Circle */}
      <div className="w-16 h-16 rounded-full bg-clay-bg flex items-center justify-center shadow-[var(--shadow-clay-pressed)] border border-white/50">
        <EmojiIcon icon={Icon} className="w-8 h-8 text-clay-primary animate-clay-breathe" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-extrabold text-clay-text leading-tight" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {title}
        </h3>
        <p className="text-xs text-clay-muted max-w-xs mx-auto leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Action CTA Link or Button */}
      {actionText && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-br from-clay-primary to-clay-secondary text-white rounded-2xl hover:scale-[1.02] active:scale-[0.95] active:shadow-[var(--shadow-clay-pressed)] transition-all font-bold text-xs shadow-[var(--shadow-clay-button)] cursor-pointer"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {actionText}
            </Link>
          ) : (
            onActionClick && (
              <button
                type="button"
                onClick={onActionClick}
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-gradient-to-br from-clay-primary to-clay-secondary text-white rounded-2xl hover:scale-[1.02] active:scale-[0.95] active:shadow-[var(--shadow-clay-pressed)] transition-all font-bold text-xs shadow-[var(--shadow-clay-button)] cursor-pointer"
                style={{ fontFamily: 'Nunito, sans-serif' }}
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
