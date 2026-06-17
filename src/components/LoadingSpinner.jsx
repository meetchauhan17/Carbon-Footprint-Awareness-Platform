import React from 'react'
import { Leaf } from 'lucide-react'

// Sizing mapper
const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16'
}

/**
 * LoadingSpinner - Spin indicator with green leaf and customizable text messages.
 */
export default function LoadingSpinner({
  size = 'md',
  text,
  className = ''
}) {
  const sizeClass = sizeClasses[size] || sizeClasses.md

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`flex flex-col items-center justify-center space-y-3 p-4 ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer pulse wave */}
        <div className={`absolute rounded-full bg-green-500/10 animate-ping ${
          size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24'
        }`} />
        
        {/* Spinning leaf container */}
        <div className="animate-spin duration-1000">
          <Leaf className={`text-green-600 ${sizeClass}`} />
        </div>
      </div>

      {text && (
        <p className="text-xs font-bold text-gray-500 animate-pulse tracking-wide select-none">
          {text}
        </p>
      )}
      
      <span className="sr-only">Loading...</span>
    </div>
  )
}
