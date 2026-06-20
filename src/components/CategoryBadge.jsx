import React from 'react'
import PropTypes from 'prop-types'
import { Car, Zap, Utensils, ShoppingBag, Leaf, HelpCircle } from 'lucide-react'

// Categories color mapping following Claymorphism Palette
// Categories color mapping following Gatsby Dark Luxury Palette
const categoryConfigs = {
  transport: {
    label: 'Transport',
    icon: Car,
    classes: 'bg-[#0F1115] text-[#94A3B8] border border-white/10 rounded-full'
  },
  energy: {
    label: 'Home Energy',
    icon: Zap,
    classes: 'bg-[#0F1115] text-[#FFD600] border border-[#FFD600]/25 rounded-full'
  },
  'home energy': {
    label: 'Home Energy',
    icon: Zap,
    classes: 'bg-[#0F1115] text-[#FFD600] border border-[#FFD600]/25 rounded-full'
  },
  food: {
    label: 'Food & Diet',
    icon: Utensils,
    classes: 'bg-[#0F1115] text-[#10B981] border border-[#10B981]/25 rounded-full'
  },
  'food & diet': {
    label: 'Food & Diet',
    icon: Utensils,
    classes: 'bg-[#0F1115] text-[#10B981] border border-[#10B981]/25 rounded-full'
  },
  shopping: {
    label: 'Shopping',
    icon: ShoppingBag,
    classes: 'bg-[#0F1115] text-[#EF4444] border border-[#EF4444]/25 rounded-full'
  },
  lifestyle: {
    label: 'Lifestyle',
    icon: Leaf,
    classes: 'bg-[#0F1115] text-[#F7931A] border border-[#F7931A]/25 rounded-full'
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
    classes: 'bg-[#0F1115] text-clay-muted border border-white/5 rounded-full'
  }

  const IconComponent = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-bold tracking-wider uppercase select-none font-mono ${config.classes} ${className}`}
      aria-label={`Category: ${config.label}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 shrink-0" aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  )
}

CategoryBadge.propTypes = {
  category: PropTypes.string,
  showIcon: PropTypes.bool,
  className: PropTypes.string
}
