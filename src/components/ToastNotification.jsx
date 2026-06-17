import React, { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

// Toast type configs
const typeConfigs = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-green-700 text-white border-green-600 shadow-green-900/10'
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-amber-600 text-white border-amber-500 shadow-amber-900/10'
  },
  error: {
    icon: AlertCircle,
    classes: 'bg-red-600 text-white border-red-500 shadow-red-900/10'
  },
  info: {
    icon: Info,
    classes: 'bg-blue-600 text-white border-blue-500 shadow-blue-900/10'
  }
}

/**
 * ToastNotification - Reusable notification banner that slides in from the bottom right.
 */
export default function ToastNotification({
  message,
  type = 'success',
  show = false,
  onClose,
  duration = 3000,
  className = ''
}) {
  useEffect(() => {
    if (show && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show || !message) return null

  const config = typeConfigs[type] || typeConfigs.success
  const IconComponent = config.icon

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-5 right-5 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border shadow-xl animate-slide-in font-semibold text-xs min-w-[280px] max-w-sm ${config.classes} ${className}`}
    >
      <div className="flex items-center gap-2">
        <IconComponent className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 text-white/80 hover:text-white"
          aria-label="Close notification"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      )}
    </div>
  )
}
