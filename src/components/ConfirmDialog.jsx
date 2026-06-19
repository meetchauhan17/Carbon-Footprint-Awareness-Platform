import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'

/**
 * ConfirmDialog - A fully accessible modal overlay for destructive or important actions.
 */
export default function ConfirmDialog({
  isOpen = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  className = ''
}) {
  const modalRef = useRef(null)

  // Listen for Escape key to dismiss dialog
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen && onCancel) {
        onCancel()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      // Focus the modal for accessibility
      modalRef.current?.focus()
      // Lock body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex="-1"
        className={`w-full max-w-md bg-[#0F1115] rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(247,147,26,0.18)] p-8 relative overflow-hidden animate-fade-in-up focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking dialog content
      >
        {/* Background design accents */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#F7931A]/5 blur-2xl pointer-events-none" />

        {/* Close Icon (Top Right) */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-5 right-5 p-2 rounded-full border border-white/10 text-[#94A3B8] hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer shadow-sm"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-5 mt-2">
          {/* Warning Icon Banner */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isDestructive ? 'border-red-500/30 bg-red-950/20 text-red-500' : 'border-[#F7931A]/35 bg-[#F7931A]/10 text-[#F7931A]'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-2.5 flex-1 font-sans">
            <h3
              id="confirm-dialog-title"
              className="text-lg font-bold text-clay-text uppercase tracking-wider font-display"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="text-xs text-clay-muted leading-relaxed font-medium"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3 pt-6 mt-6 border-t border-white/10 justify-end font-sans">
          <button
            type="button"
            onClick={onCancel}
            className="btn-3d-secondary h-10 px-5 text-xs min-w-[90px] text-center"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={`h-10 px-5 text-xs min-w-[90px] text-center ${
              isDestructive
                ? 'btn-3d-destructive'
                : 'btn-premium'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
