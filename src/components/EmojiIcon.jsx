import React from 'react'
import {
  Leaf, Flame, Trophy, Zap, Car, CarFront, Bike, Bus, Train, Plane, PlaneTakeoff, Plug,
  CookingPot, Snowflake, Beef, Drumstick, Fish, Milk, Salad, Shirt, Smartphone, Package,
  TrendingDown, TrendingUp, Target, Heart, BookOpen, Globe, Sun, ShoppingBag, Laptop,
  ShoppingCart, Award, Star, Home, Sparkles, Utensils, Calendar, BarChart2, Waves,
  Settings, Wrench, Gauge, Droplets, Rainbow, Flag
} from 'lucide-react'

// Minification-safe icon component dictionary
export const iconComponentMap = {
  Leaf, Flame, Trophy, Zap, Car, CarFront, Bike, Bus, Train, Plane, PlaneTakeoff, Plug,
  CookingPot, Snowflake, Beef, Drumstick, Fish, Milk, Salad, Shirt, Smartphone, Package,
  TrendingDown, TrendingUp, Target, Heart, BookOpen, Globe, Sun, ShoppingBag, Laptop,
  ShoppingCart, Award, Star, Home, Sparkles, Utensils, Calendar, BarChart2, Waves,
  Settings, Wrench, Gauge, Droplets, Rainbow, Flag
}

// Map of semantic styles (colors) for each standard icon type to match old emoji aesthetics
const themeColors = {
  Leaf: 'text-emerald-500',
  Flame: 'text-orange-500',
  Trophy: 'text-amber-500',
  Zap: 'text-amber-500',
  Car: 'text-indigo-500',
  CarFront: 'text-sky-500',
  Bike: 'text-green-500',
  Bus: 'text-blue-500',
  Train: 'text-blue-500',
  Plane: 'text-blue-500',
  PlaneTakeoff: 'text-sky-500',
  Plug: 'text-amber-500',
  CookingPot: 'text-amber-600',
  Snowflake: 'text-sky-400',
  Beef: 'text-red-500',
  Drumstick: 'text-amber-600',
  Fish: 'text-sky-500',
  Milk: 'text-slate-300',
  Salad: 'text-green-500',
  Shirt: 'text-violet-500',
  Smartphone: 'text-blue-500',
  Package: 'text-amber-700',
  TrendingDown: 'text-green-500',
  TrendingUp: 'text-red-500',
  Target: 'text-red-500',
  Heart: 'text-rose-500',
  BookOpen: 'text-violet-500',
  Globe: 'text-sky-500',
  Sun: 'text-amber-500',
  ShoppingBag: 'text-purple-500',
  Laptop: 'text-slate-600',
  ShoppingCart: 'text-purple-500',
  Award: 'text-amber-500',
  Star: 'text-yellow-500',
  Home: 'text-green-500',
  Sparkles: 'text-yellow-500',
  Utensils: 'text-emerald-500',
  Calendar: 'text-indigo-500',
  BarChart2: 'text-violet-500',
  Waves: 'text-sky-500',
  Settings: 'text-slate-500',
  Wrench: 'text-slate-500',
  Gauge: 'text-indigo-500',
  Droplets: 'text-teal-400',
  Rainbow: 'text-violet-500',
  Flag: 'text-slate-400'
}

export function StyledIcon({
  icon,
  size = 'md',
  variant = 'default',
  bg = false,
  className = '',
  colorOverride,
  ...props
}) {
  // Resolve string icon names to Lucide components
  const IconComponent = typeof icon === 'string' ? iconComponentMap[icon] : icon

  if (!IconComponent) return null

  // Sizing mapping
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
  }[size] || 'w-5 h-5'

  // Variant/Color mapping
  let colorClass = ''
  if (colorOverride) {
    colorClass = colorOverride
  } else if (variant === 'default') {
    // Minification-safe name lookup
    const componentName = typeof icon === 'string' 
      ? icon 
      : Object.keys(iconComponentMap).find(key => iconComponentMap[key] === icon) || ''
    colorClass = themeColors[componentName] || 'text-white'
  } else {
    colorClass = {
      primary: 'text-[#F7931A]',
      success: 'text-[#10B981]',
      warning: 'text-[#F59E0B]',
      danger: 'text-[#EF4444]',
      info: 'text-[#0EA5E9]',
      muted: 'text-[#94A3B8]',
      white: 'text-white',
    }[variant] || 'text-white'
  }

  const bgClasses = bg
    ? 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#030304] border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]'
    : ''

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${bgClasses} ${className}`} {...props}>
      <IconComponent className={`${bg ? 'w-5 h-5' : sizeClasses} ${colorClass} shrink-0`} aria-hidden="true" />
    </span>
  )
}

/**
 * EmojiIcon - Refactored adapter component.
 * Allows seamless drop-in transition from unicode emojis to Lucide icons.
 * Receives either a Lucide component directly or a string representing the icon name.
 */
export default function EmojiIcon({ emoji, icon, className = 'w-5 h-5', colorOverride }) {
  const targetIcon = icon || emoji

  return (
    <StyledIcon
      icon={targetIcon}
      className={className}
      colorOverride={colorOverride}
    />
  )
}
