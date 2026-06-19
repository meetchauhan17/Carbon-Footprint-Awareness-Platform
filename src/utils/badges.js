/**
 * badges.js
 * ─────────────────────────────────────────────────────────────────────
 * Badge & Achievement System for CarbonWise.
 * Defines 17 distinct badges across 4 categories and checks them
 * dynamically against the user's logged entries, profile, and tips.
 */

// Helper to calculate maximum consecutive days logged (streak)
function getLoggingStreak(entries) {
  if (!entries || entries.length === 0) return 0
  
  // Extract unique sorted dates (YYYY-MM-DD)
  const dates = Array.from(
    new Set(entries.map(e => e.date ? e.date.split('T')[0] : ''))
  ).filter(Boolean).sort()

  if (dates.length === 0) return 0

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    
    // Difference in days
    const diffTime = Math.abs(curr - prev)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak
      }
    } else if (diffDays > 1) {
      currentStreak = 1
    }
  }

  return maxStreak
}

// Helper to group entries by day
function groupEntriesByDay(entries) {
  const groups = {}
  entries.forEach(e => {
    const dateKey = e.date ? e.date.split('T')[0] : ''
    if (!dateKey) return
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        transport: 0,
        energy: 0,
        food: 0,
        shopping: 0,
        total: 0,
        rawEntries: []
      }
    }
    const cat = e.category?.toLowerCase()
    if (cat === 'transport') groups[dateKey].transport += e.totalCO2
    else if (cat === 'energy') groups[dateKey].energy += e.totalCO2
    else if (cat === 'food') groups[dateKey].food += e.totalCO2
    else if (cat === 'shopping') groups[dateKey].shopping += e.totalCO2
    
    groups[dateKey].total += e.totalCO2
    groups[dateKey].rawEntries.push(e)
  })
  return Object.values(groups)
}

export const BADGE_DEFINITIONS = [
  // ─── STREAK BADGES ─────────────────────────────────────────────────
  {
    id: 'streak-1',
    name: 'First Step',
    description: 'Log your very first carbon entry to start your tracking journey.',
    icon: 'Leaf',
    category: 'streak',
    check: (entries) => entries.length >= 1,
    getEarnedDate: (entries) => {
      const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date))
      return sorted[0]?.date || null
    }
  },
  {
    id: 'streak-3',
    name: '3-Day Streak',
    description: 'Log carbon footprint entries on 3 consecutive days.',
    icon: 'Flame',
    category: 'streak',
    check: (entries) => getLoggingStreak(entries) >= 3,
    getEarnedDate: (entries) => {
      // Approximate earned date as the latest logged entry
      const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
      return sorted[0]?.date || null
    }
  },
  {
    id: 'streak-7',
    name: 'Week Warrior',
    description: 'Log your daily footprints for 7 consecutive days.',
    icon: 'Zap',
    category: 'streak',
    check: (entries) => getLoggingStreak(entries) >= 7,
    getEarnedDate: (entries) => {
      const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
      return sorted[0]?.date || null
    }
  },
  {
    id: 'streak-30',
    name: 'Monthly Master',
    description: 'Log your carbon footprint for 30 consecutive days.',
    icon: 'Trophy',
    category: 'streak',
    check: (entries) => getLoggingStreak(entries) >= 30,
    getEarnedDate: (entries) => {
      const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
      return sorted[0]?.date || null
    }
  },

  // ─── EMISSION BADGES ───────────────────────────────────────────────
  {
    id: 'emission-low-5',
    name: 'Green Day',
    description: 'Log a day with total emissions under 5 kg CO₂.',
    icon: 'Leaf',
    category: 'emission',
    check: (entries) => {
      const days = groupEntriesByDay(entries)
      return days.some(d => d.total > 0 && d.total < 5)
    },
    getEarnedDate: (entries) => {
      const days = groupEntriesByDay(entries).filter(d => d.total > 0 && d.total < 5)
      const sorted = days.sort((a, b) => a.date.localeCompare(b.date))
      return sorted[0] ? new Date(sorted[0].date).toISOString() : null
    }
  },
  {
    id: 'emission-low-3',
    name: 'Super Green',
    description: 'Achieve a daily emission of less than 3 kg CO₂.',
    icon: 'Zap',
    category: 'emission',
    check: (entries) => {
      const days = groupEntriesByDay(entries)
      return days.some(d => d.total > 0 && d.total < 3)
    },
    getEarnedDate: (entries) => {
      const days = groupEntriesByDay(entries).filter(d => d.total > 0 && d.total < 3)
      const sorted = days.sort((a, b) => a.date.localeCompare(b.date))
      return sorted[0] ? new Date(sorted[0].date).toISOString() : null
    }
  },
  {
    id: 'emission-carfree',
    name: 'Car-Free Day',
    description: 'Log a day with zero transport emissions.',
    icon: 'Car',
    category: 'emission',
    check: (entries) => {
      const days = groupEntriesByDay(entries)
      // Must have logged something on that day, and transport is 0
      return days.some(d => d.total > 0 && d.transport === 0)
    },
    getEarnedDate: (entries) => {
      const days = groupEntriesByDay(entries).filter(d => d.total > 0 && d.transport === 0)
      const sorted = days.sort((a, b) => a.date.localeCompare(b.date))
      return sorted[0] ? new Date(sorted[0].date).toISOString() : null
    }
  },
  {
    id: 'emission-vegan',
    name: 'Plant-Powered',
    description: 'Eat entirely vegan meals on any logged day.',
    icon: 'Leaf',
    category: 'emission',
    check: (entries, completedTips) => {
      // Checked if user marked the "skipped-meat" quick log or has a vegan item, OR finished vegan tips
      const hasVeganQuickLog = entries.some(e => e.item === 'vegan' || e.item === 'vegan_meal')
      const hasVeganTip = completedTips.includes('f-plantbased') || completedTips.includes('f-meatfree')
      return hasVeganQuickLog || hasVeganTip
    },
    getEarnedDate: (entries) => {
      const veganEntries = entries.filter(e => e.item === 'vegan' || e.item === 'vegan_meal')
      return veganEntries[0]?.date || new Date().toISOString()
    }
  },
  {
    id: 'emission-noflight',
    name: 'Grounded',
    description: 'Maintain zero flight emissions over the last 7 days of logging.',
    icon: 'Plane',
    category: 'emission',
    check: (entries) => {
      if (entries.length === 0) return false
      // Check if there are any domestic/international flight logs in the last 7 days
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      const recentFlight = entries.some(e => 
        new Date(e.date) >= cutoff && 
        (e.item === 'flight_domestic' || e.item === 'flight_international' || e.item === 'flight')
      )
      return !recentFlight
    },
    getEarnedDate: () => new Date().toISOString()
  },

  // ─── IMPROVEMENT BADGES ─────────────────────────────────────────────
  {
    id: 'improve-10',
    name: 'Getting Better',
    description: 'Reduce your daily average footprint by 10% compared to the previous week.',
    icon: 'TrendingDown',
    category: 'improvement',
    check: (entries) => {
      const days = groupEntriesByDay(entries).sort((a, b) => b.date.localeCompare(a.date))
      if (days.length < 14) return false
      
      const thisWeek = days.slice(0, 7)
      const lastWeek = days.slice(7, 14)
      
      const thisWeekAvg = thisWeek.reduce((sum, d) => sum + d.total, 0) / 7
      const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.total, 0) / 7

      return thisWeekAvg > 0 && lastWeekAvg > 0 && (lastWeekAvg - thisWeekAvg) / lastWeekAvg >= 0.1
    },
    getEarnedDate: () => new Date().toISOString()
  },
  {
    id: 'improve-goal',
    name: 'Goal Crusher',
    description: 'Finish the current month within your monthly carbon goal.',
    icon: 'Target',
    category: 'improvement',
    check: (entries, completedTips, goal) => {
      const now = new Date()
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const monthlyTotal = entries
        .filter(e => e.date?.startsWith(currentMonthStr))
        .reduce((sum, e) => sum + e.totalCO2, 0)
      
      return entries.length > 0 && monthlyTotal > 0 && monthlyTotal <= goal
    },
    getEarnedDate: () => new Date().toISOString()
  },
  {
    id: 'improve-half',
    name: 'Half Carbon',
    description: 'Maintain a footprint 50% below the global daily average of 11 kg CO₂.',
    icon: 'Heart',
    category: 'improvement',
    check: (entries) => {
      const days = groupEntriesByDay(entries)
      if (days.length === 0) return false
      const totalCO2 = days.reduce((sum, d) => sum + d.total, 0)
      const avgDaily = totalCO2 / days.length
      return avgDaily > 0 && avgDaily <= 5.48 // 10.96 / 2
    },
    getEarnedDate: () => new Date().toISOString()
  },

  // ─── TIPS BADGES ───────────────────────────────────────────────────
  {
    id: 'tips-student',
    name: 'Eco Student',
    description: 'Complete and mark 5 ecological tips as completed.',
    icon: 'BookOpen',
    category: 'tips',
    check: (entries, completedTips) => completedTips.length >= 5,
    getEarnedDate: () => new Date().toISOString()
  },
  {
    id: 'tips-champion',
    name: 'Eco Champion',
    description: 'Complete and mark 20 ecological tips as completed.',
    icon: 'Globe',
    category: 'tips',
    check: (entries, completedTips) => completedTips.length >= 20,
    getEarnedDate: () => new Date().toISOString()
  },

  // ─── ADDITIONAL UTILITY BADGES ────────────────────────────────────
  {
    id: 'utility-solar',
    name: 'Solar Powered',
    description: 'Mark the renewable solar energy tariff tip as completed.',
    icon: 'Sun',
    category: 'tips',
    check: (entries, completedTips) => completedTips.includes('e-solar'),
    getEarnedDate: () => new Date().toISOString()
  },
  {
    id: 'utility-commute',
    name: 'Active Commute',
    description: 'Log a cycling or walking trip, or mark the walking short trips tip as completed.',
    icon: 'Bike',
    category: 'streak',
    check: (entries, completedTips) => {
      const hasActiveLog = entries.some(e => e.item === 'bicycle' || e.item === 'walking')
      const hasActiveTip = completedTips.includes('t-cycle')
      return hasActiveLog || hasActiveTip
    },
    getEarnedDate: (entries) => {
      const active = entries.filter(e => e.item === 'bicycle' || e.item === 'walking')
      return active[0]?.date || new Date().toISOString()
    }
  },
  {
    id: 'utility-minimalist',
    name: 'Minimalist',
    description: 'Log a tracking day with zero shopping emissions.',
    icon: 'ShoppingBag',
    category: 'emission',
    check: (entries) => {
      const days = groupEntriesByDay(entries)
      return days.some(d => d.total > 0 && d.shopping === 0)
    },
    getEarnedDate: (entries) => {
      const days = groupEntriesByDay(entries).filter(d => d.total > 0 && d.shopping === 0)
      const sorted = days.sort((a, b) => a.date.localeCompare(b.date))
      return sorted[0] ? new Date(sorted[0].date).toISOString() : null
    }
  }
]

/**
 * Evaluates the current state and returns an array of earned badge objects.
 * 
 * @param {Object} state - context state containing carbonEntries, completedTips, userProfile
 * @returns {Array<{ id, name, description, icon, category, earned: true, earnedDate }>}
 */
export function evaluateBadges(state) {
  const entries = state.carbonEntries || []
  const completedTips = state.completedTips || []
  const goal = state.userProfile?.monthlyGoal || 500

  return BADGE_DEFINITIONS
    .filter(b => b.check(entries, completedTips, goal))
    .map(b => {
      const rawDate = b.getEarnedDate ? b.getEarnedDate(entries, completedTips) : new Date().toISOString()
      const formattedDate = rawDate
        ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recently'
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        earned: true,
        earnedDate: formattedDate
      }
    })
}
