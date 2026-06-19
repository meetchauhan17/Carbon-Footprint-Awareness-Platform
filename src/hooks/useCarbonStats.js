import { useMemo } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { getCategoryBreakdown } from '../utils/calculations.js'

/**
 * Hook to get derived carbon stats from global state.
 * Pulls pre-computed weeklyData/monthlyData from context and adds breakdown + goal progress.
 */
export function useCarbonStats() {
  const { state, getAverageFootprint, compareToGlobalAverage } = useCarbon()

  const stats = useMemo(() => {
    const { carbonEntries, totalFootprint, weeklyData, monthlyData, badges, userProfile } = state
    const breakdown = getCategoryBreakdown(carbonEntries)
    const entryCount = carbonEntries.length
    const monthlyGoal = userProfile?.monthlyGoal ?? 150
    const goalProgress = monthlyGoal > 0 ? Math.min((totalFootprint / monthlyGoal) * 100, 100) : 0
    const avgFootprint = getAverageFootprint()
    const globalComparison = compareToGlobalAverage()

    const profileCompletion = (() => {
      if (!userProfile) return 0
      let score = 0
      if (userProfile.name?.trim()) score += 40
      if (userProfile.location?.trim()) score += 40
      if (userProfile.dietPreference) score += 10
      if (userProfile.vehicleType) score += 10
      return score
    })()

    return {
      total: totalFootprint,
      breakdown,
      weeklyData,
      monthlyData,
      entryCount,
      goalProgress,
      monthlyGoal,
      badges,
      avgFootprint,
      globalComparison,
      userProfile,
      profileCompletion,
    }
  }, [state, getAverageFootprint, compareToGlobalAverage])

  return stats
}
