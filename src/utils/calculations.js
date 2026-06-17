// CO2 emission factors (kg CO2 per unit)
export const EMISSION_FACTORS = {
  transport: {
    car: 0.21,       // per km
    bus: 0.089,      // per km
    train: 0.041,    // per km
    flight: 0.255,   // per km
    bicycle: 0,      // per km
    walking: 0,      // per km
  },
  energy: {
    electricity: 0.5,  // per kWh
    naturalGas: 2.0,   // per m³
    heating: 0.27,     // per kWh
  },
  food: {
    beef: 27.0,        // per kg
    pork: 12.1,        // per kg
    chicken: 6.9,      // per kg
    fish: 6.1,         // per kg
    dairy: 3.2,        // per kg
    vegetables: 2.0,   // per kg
    fruits: 1.1,       // per kg
    grains: 1.4,       // per kg
  },
  waste: {
    landfill: 0.58,    // per kg
    recycled: 0.03,    // per kg
    composted: 0.01,   // per kg
  }
}

/**
 * Calculate CO2 emissions for a given category, item, and quantity
 */
export function calculateCO2(category, item, quantity) {
  const factor = EMISSION_FACTORS[category]?.[item]
  if (factor === undefined) return 0
  return parseFloat((factor * quantity).toFixed(2))
}

/**
 * Get the total CO2 from an array of entries
 */
export function getTotalCO2(entries) {
  return parseFloat(entries.reduce((sum, e) => sum + (e.totalCO2 || 0), 0).toFixed(2))
}

/**
 * Get CO2 breakdown by category
 */
export function getCategoryBreakdown(entries) {
  const breakdown = { transport: 0, energy: 0, food: 0, waste: 0 }
  entries.forEach(e => {
    if (breakdown[e.category] !== undefined) {
      breakdown[e.category] += e.totalCO2
    }
  })
  return Object.entries(breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: parseFloat(value.toFixed(2)),
  }))
}

/**
 * Get entries grouped by date (last 7 days)
 */
export function getWeeklyData(entries) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayEntries = entries.filter(e => e.date?.startsWith(dateStr))
    const total = dayEntries.reduce((sum, e) => sum + e.totalCO2, 0)
    days.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      co2: parseFloat(total.toFixed(2)),
    })
  }
  return days
}

/**
 * Format kg CO2 with appropriate unit
 */
export function formatCO2(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`
  return `${kg.toFixed(1)} kg`
}

/**
 * Get entries grouped by date (last 30 days)
 */
export function getMonthlyData(entries) {
  const days = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayEntries = entries.filter(e => e.date?.startsWith(dateStr))
    const total = dayEntries.reduce((sum, e) => sum + e.totalCO2, 0)
    days.push({
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      co2: parseFloat(total.toFixed(2)),
    })
  }
  return days
}

