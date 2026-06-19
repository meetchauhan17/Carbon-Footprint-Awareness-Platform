import React from 'react'
import { Lock } from 'lucide-react'
import { BADGE_DEFINITIONS } from '../utils/badges.js'
import EmojiIcon from './EmojiIcon.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'

/**
 * BadgeCard - Renders an individual badge with 3D tilting and dynamic holographic shine if unlocked.
 */
function BadgeCard({ badge, earnedMatch }) {
  const isEarned = !!earnedMatch
  // Earned badges have high-tilt responsiveness (15deg) and rainbow gloss reflections.
  // Locked badges have standard card interaction.
  const tilt = use3DTilt({ maxTilt: isEarned ? 15 : 6, scale: 1.05 })

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 group ${
        isEarned
          ? 'bg-[#0F1115] border-[#F7931A]/35 shadow-[0_0_15px_rgba(247,147,26,0.08)] hover:border-[#F7931A]/60 holo-shine'
          : 'bg-[#0F1115]/30 border-white/5 opacity-60 hover:opacity-100'
      }`}
      title={badge.description}
    >
      {/* Lock Indicator for locked badges */}
      {!isEarned && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-md bg-[#030304] border border-white/5 flex items-center justify-center shadow-sm">
          <Lock className="w-2.5 h-2.5 text-gray-500" />
        </div>
      )}

      {/* Badge Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3.5 border transition-all ${
        isEarned 
          ? 'bg-[#030304] border-[#F7931A]/35 group-hover:border-[#F7931A] group-hover:scale-105 group-hover:shadow-[0_0_12px_rgba(247,147,26,0.25)]' 
          : 'bg-[#030304] border-white/5 filter grayscale'
      }`}>
        <div className="flex items-center justify-center">
          <EmojiIcon icon={badge.icon} className="w-5 h-5" colorOverride={!isEarned ? 'text-gray-600' : undefined} />
        </div>
      </div>

      {/* Badge Details */}
      <p className={`text-xs font-bold leading-tight font-display ${isEarned ? 'text-white' : 'text-clay-muted'}`}>
        {badge.name}
      </p>
      <p className="text-[10px] text-clay-muted mt-1 leading-normal font-sans">
        {isEarned ? `Unlocked ${earnedMatch.earnedDate}` : badge.description}
      </p>
    </div>
  )
}

function BadgesGrid({ earnedBadges = [] }) {
  // Group definitions by category for better organization
  const categories = {
    streak: { label: 'Streaks', color: 'text-[#F7931A] bg-[#0F1115] border-[#F7931A]/20 rounded-md' },
    emission: { label: 'Emissions', color: 'text-[#10B981] bg-[#0F1115] border-[#10B981]/20 rounded-md' },
    improvement: { label: 'Improvements', color: 'text-[#94A3B8] bg-[#0F1115] border-white/10 rounded-md' },
    tips: { label: 'Tips Completed', color: 'text-[#FFD600] bg-[#0F1115] border-[#FFD600]/25 rounded-md' },
  }

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([catKey, catMeta]) => {
        const catBadges = BADGE_DEFINITIONS.filter(b => b.category === catKey)
        
        return (
          <div key={catKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 border font-mono ${catMeta.color}`}>
                {catMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {catBadges.map(badge => {
                const earnedMatch = earnedBadges.find(b => b.id === badge.id)
                return (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earnedMatch={earnedMatch}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default BadgesGrid
