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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        tabIndex="-1"
        className={`w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-2xl p-6 relative overflow-hidden animate-fade-in-up animate-duration-300 focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking dialog content
      >
        {/* Background design accents */}
        <div className={`absolute -top-12 -left-12 w-32 h-32 rounded-full blur-2xl opacity-10 ${isDestructive ? 'bg-red-500' : 'bg-green-500'}`} />
        <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-10 ${isDestructive ? 'bg-orange-500' : 'bg-emerald-500'}`} />

        {/* Close Icon (Top Right) */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-1 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}

        <div className="flex items-start gap-4 mt-2">
          {/* Warning Icon Banner */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-2 flex-1">
            <h3
              id="confirm-dialog-title"
              className="text-base font-extrabold text-gray-900 leading-tight"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-desc"
              className="text-xs text-gray-500 leading-relaxed font-medium"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-3.5 pt-6 mt-4 border-t border-gray-100/60 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer min-w-[80px] text-center"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-2xl text-white text-xs font-bold transition-all cursor-pointer min-w-[80px] text-center shadow-md ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                : 'bg-green-600 hover:bg-green-700 shadow-green-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
