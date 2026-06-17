import { Award, Lock } from 'lucide-react'
import { BADGE_DEFINITIONS } from '../utils/badges.js'

function BadgesGrid({ earnedBadges = [] }) {
  // Group definitions by category for better organization
  const categories = {
    streak: { label: 'Streaks', color: 'text-orange-600 bg-orange-50 border-orange-100' },
    emission: { label: 'Emissions', color: 'text-green-700 bg-green-50 border-green-100' },
    improvement: { label: 'Improvements', color: 'text-blue-600 bg-blue-50 border-blue-100' },
    tips: { label: 'Tips Completed', color: 'text-purple-600 bg-purple-50 border-purple-100' },
  }

  return (
    <div className="space-y-6">
      {Object.entries(categories).map(([catKey, catMeta]) => {
        const catBadges = BADGE_DEFINITIONS.filter(b => b.category === catKey)
        
        return (
          <div key={catKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${catMeta.color}`}>
                {catMeta.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {catBadges.map(badge => {
                const earnedMatch = earnedBadges.find(b => b.id === badge.id)
                const isEarned = !!earnedMatch

                return (
                  <div
                    key={badge.id}
                    className={`relative flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all duration-300 group ${
                      isEarned
                        ? 'border-green-100 bg-gradient-to-br from-green-50/50 to-emerald-50/50 hover:shadow-md hover:scale-[1.02]'
                        : 'border-dashed border-gray-200 bg-white opacity-65 hover:opacity-85'
                    }`}
                    title={badge.description}
                  >
                    {/* Lock Indicator for locked badges */}
                    {!isEarned && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                    )}

                    {/* Badge Icon */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2.5 shadow-sm ${
                      isEarned ? 'bg-white' : 'bg-gray-100 filter grayscale'
                    }`}>
                      {badge.icon}
                    </div>

                    {/* Badge Details */}
                    <p className={`text-xs font-black leading-tight ${isEarned ? 'text-gray-800' : 'text-gray-500'}`}>
                      {badge.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                      {isEarned ? `Unlocked ${earnedMatch.earnedDate}` : badge.description}
                    </p>
                  </div>
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
