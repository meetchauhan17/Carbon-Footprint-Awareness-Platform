import React from 'react'
import { Car, Zap, Utensils, ShoppingBag, Leaf, HelpCircle } from 'lucide-react'

// Categories color mapping
const categoryConfigs = {
  transport: {
    label: 'Transport',
    icon: Car,
    classes: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  energy: {
    label: 'Home Energy',
    icon: Zap,
    classes: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  'home energy': {
    label: 'Home Energy',
    icon: Zap,
    classes: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  food: {
    label: 'Food & Diet',
    icon: Utensils,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  'food & diet': {
    label: 'Food & Diet',
    icon: Utensils,
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    classes: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  lifestyle: {
    label: 'Lifestyle',
    icon: Leaf,
    classes: 'bg-green-50 text-green-700 border-green-200'
  }
}

/**
 * CategoryBadge - Small pill badge with icon, name, and color-coding.
 */
export default function CategoryBadge({
  category = '',
  showIcon = true,
  className = ''
}) {
  const normCategory = category.trim().toLowerCase()
  const config = categoryConfigs[normCategory] || {
    label: category || 'General',
    icon: HelpCircle,
    classes: 'bg-gray-50 text-gray-700 border-gray-200'
  }

  const IconComponent = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wide uppercase transition-all select-none ${config.classes} ${className}`}
      aria-label={`Category: ${config.label}`}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}
