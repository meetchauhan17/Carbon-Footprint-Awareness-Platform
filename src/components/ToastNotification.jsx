import React, { useEffect } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

// Toast type configs with Clay gradients and shadows
// Toast type configs with Gatsby colors
const typeConfigs = {
  success: {
    icon: CheckCircle2,
    classes: 'bg-[#0F1115] text-[#10B981] border border-[#10B981]/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-[#0F1115] text-[#FFD600] border border-[#FFD600]/30 shadow-[0_0_20px_rgba(255,214,0,0.1)]'
  },
  error: {
    icon: AlertCircle,
    classes: 'bg-[#0F1115] text-[#EF4444] border border-[#EF4444]/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
  },
  info: {
    icon: Info,
    classes: 'bg-[#0F1115] text-[#94A3B8] border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
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
      className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-4 px-5 py-4 rounded-xl animate-slide-in font-bold text-xs min-w-[280px] max-w-sm transition-all duration-300 font-sans ${config.classes} ${className}`}
    >
      <div className="flex items-center gap-3">
        <IconComponent className="w-5 h-5 shrink-0" aria-hidden="true" />
        <span className="leading-snug">{message}</span>
      </div>
      
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-full border border-current/25 hover:bg-white/10 transition-all duration-200 cursor-pointer shrink-0 text-white hover:scale-105 active:scale-95"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
