/**
 * carbonCalculator.js
 * ─────────────────────────────────────────────────────────────────────
 * Complete carbon footprint calculation logic for CarbonWise.
 * All emission factors are in kg CO₂ per unit unless noted.
 *
 * Sources:
 *   - Transport: DEFRA UK GHG Conversion Factors 2023
 *   - Electricity: CEA India Grid Emission Factor 2022 (0.82 kg CO₂/kWh)
 *   - Food: Poore & Nemecek (2018), Science; Our World in Data
 *   - Shopping: WRAP, Carbon Trust estimates
 */

// ─── Emission Factors ──────────────────────────────────────────────────

export const EMISSION_FACTORS = {
  transport: {
    car_petrol:            { factor: 0.21,  label: 'Car (Petrol)',           unit: 'km' },
    car_diesel:            { factor: 0.17,  label: 'Car (Diesel)',           unit: 'km' },
    car_electric:          { factor: 0.05,  label: 'Car (Electric)',         unit: 'km' },
    bus:                   { factor: 0.089, label: 'Bus',                   unit: 'km' },
    train:                 { factor: 0.041, label: 'Train',                 unit: 'km' },
    flight_domestic:       { factor: 0.255, label: 'Flight (Domestic)',     unit: 'km' },
    flight_international:  { factor: 0.195, label: 'Flight (International)',unit: 'km' },
    motorbike:             { factor: 0.114, label: 'Motorbike',             unit: 'km' },
  },

  energy: {
    electricity: { factor: 0.82,  label: 'Electricity',   unit: 'kWh' },
    natural_gas: { factor: 2.04,  label: 'Natural Gas',   unit: 'm³'  },
    lpg:         { factor: 2.98,  label: 'LPG',           unit: 'kg'  },
  },

  food: {
    beef:       { factor: 27.0, label: 'Beef',       unit: 'kg'   },
    lamb:       { factor: 39.2, label: 'Lamb',       unit: 'kg'   },
    pork:       { factor: 12.1, label: 'Pork',       unit: 'kg'   },
    chicken:    { factor: 6.9,  label: 'Chicken',    unit: 'kg'   },
    fish:       { factor: 6.1,  label: 'Fish',       unit: 'kg'   },
    dairy:      { factor: 3.2,  label: 'Dairy',      unit: 'kg'   },
    vegetables: { factor: 2.0,  label: 'Vegetables', unit: 'kg'   },
    vegan_meal: { factor: 0.5,  label: 'Vegan Meal', unit: 'meal' },
  },

  shopping: {
    clothing:           { factor: 10.0,  label: 'Clothing Item',     unit: 'item' },
    electronics_small:  { factor: 50.0,  label: 'Electronics (Small)',unit: 'item' },
    electronics_large:  { factor: 200.0, label: 'Electronics (Large)',unit: 'item' },
  },
}

// ─── Category Metadata ─────────────────────────────────────────────────

const CATEGORY_META = {
  transport: { color: '#3b82f6', label: 'Transport' },
  energy:    { color: '#f59e0b', label: 'Home Energy' },
  food:      { color: '#16a34a', label: 'Food' },
  shopping:  { color: '#8b5cf6', label: 'Shopping' },
}

// ─── Per-Category Calculators ──────────────────────────────────────────

/**
 * Calculate CO₂ for a transport mode.
 * @param {string} mode  - key from EMISSION_FACTORS.transport
 * @param {number} km    - distance in kilometres
 * @returns {number} kg CO₂
 */
export function calculateTransport(mode, km) {
  const entry = EMISSION_FACTORS.transport[mode]
  if (!entry || isNaN(km) || km < 0) return 0
  return round2(entry.factor * km)
}

/**
 * Calculate CO₂ for a home energy source.
 * @param {string} type   - key from EMISSION_FACTORS.energy
 * @param {number} amount - quantity in the entry's native unit
 * @returns {number} kg CO₂
 */
export function calculateEnergy(type, amount) {
  const entry = EMISSION_FACTORS.energy[type]
  if (!entry || isNaN(amount) || amount < 0) return 0
  return round2(entry.factor * amount)
}

/**
 * Calculate CO₂ for a food type.
 * @param {string} type   - key from EMISSION_FACTORS.food
 * @param {number} amount - quantity in the entry's native unit (kg or meals)
 * @returns {number} kg CO₂
 */
export function calculateFood(type, amount) {
  const entry = EMISSION_FACTORS.food[type]
  if (!entry || isNaN(amount) || amount < 0) return 0
  return round2(entry.factor * amount)
}

/**
 * Calculate CO₂ for a shopping item.
 * @param {string} type     - key from EMISSION_FACTORS.shopping
 * @param {number} quantity - number of items
 * @returns {number} kg CO₂
 */
export function calculateShopping(type, quantity) {
  const entry = EMISSION_FACTORS.shopping[type]
  if (!entry || isNaN(quantity) || quantity < 0) return 0
  return round2(entry.factor * quantity)
}

// ─── Total Calculator ─────────────────────────────────────────────────

/**
 * Calculate the complete carbon footprint from all input categories.
 *
 * @param {Object} allInputs - shape:
 *   {
 *     transport?: Array<{ mode: string, km: number }>,
 *     energy?:    Array<{ type: string, amount: number }>,
 *     food?:      Array<{ type: string, amount: number }>,
 *     shopping?:  Array<{ type: string, quantity: number }>,
 *   }
 *
 * @returns {{
 *   total: number,
 *   breakdown: Array<{ category, label, item, amount, unit, co2 }>,
 *   category_totals: { transport, energy, food, shopping },
 *   comparison_to_average: {
 *     globalAverageYearlyKg: number,
 *     globalAverageMonthlyKg: number,
 *     userTotal: number,
 *     percentOfMonthlyAverage: number,
 *     percentOfYearlyAverage: number,
 *     status: 'below'|'above',
 *     differenceKg: number,
 *   }
 * }}
 */
export function calculateTotal(allInputs = {}) {
  const breakdown = []
  const category_totals = { transport: 0, energy: 0, food: 0, shopping: 0 }

  // — Transport —
  const transportInputs = allInputs.transport ?? []
  transportInputs.forEach(({ mode, km }) => {
    const co2 = calculateTransport(mode, km)
    const meta = EMISSION_FACTORS.transport[mode]
    if (meta) {
      breakdown.push({ category: 'transport', label: meta.label, item: mode, amount: km, unit: meta.unit, co2 })
      category_totals.transport = round2(category_totals.transport + co2)
    }
  })

  // — Energy —
  const energyInputs = allInputs.energy ?? []
  energyInputs.forEach(({ type, amount }) => {
    const co2 = calculateEnergy(type, amount)
    const meta = EMISSION_FACTORS.energy[type]
    if (meta) {
      breakdown.push({ category: 'energy', label: meta.label, item: type, amount, unit: meta.unit, co2 })
      category_totals.energy = round2(category_totals.energy + co2)
    }
  })

  // — Food —
  const foodInputs = allInputs.food ?? []
  foodInputs.forEach(({ type, amount }) => {
    const co2 = calculateFood(type, amount)
    const meta = EMISSION_FACTORS.food[type]
    if (meta) {
      breakdown.push({ category: 'food', label: meta.label, item: type, amount, unit: meta.unit, co2 })
      category_totals.food = round2(category_totals.food + co2)
    }
  })

  // — Shopping —
  const shoppingInputs = allInputs.shopping ?? []
  shoppingInputs.forEach(({ type, quantity }) => {
    const co2 = calculateShopping(type, quantity)
    const meta = EMISSION_FACTORS.shopping[type]
    if (meta) {
      breakdown.push({ category: 'shopping', label: meta.label, item: type, amount: quantity, unit: meta.unit, co2 })
      category_totals.shopping = round2(category_totals.shopping + co2)
    }
  })

  const total = round2(
    category_totals.transport +
    category_totals.energy +
    category_totals.food +
    category_totals.shopping
  )

  // — Comparison to global average (4 tons CO₂ / year / person) —
  const globalAverageYearlyKg  = 4000
  const globalAverageMonthlyKg = round2(globalAverageYearlyKg / 12)
  const differenceKg           = round2(total - globalAverageMonthlyKg)
  const percentOfMonthlyAverage = globalAverageMonthlyKg > 0
    ? round2((total / globalAverageMonthlyKg) * 100)
    : 0
  const percentOfYearlyAverage = globalAverageYearlyKg > 0
    ? round2((total / globalAverageYearlyKg) * 100)
    : 0

  const comparison_to_average = {
    globalAverageYearlyKg,
    globalAverageMonthlyKg,
    userTotal: total,
    percentOfMonthlyAverage,
    percentOfYearlyAverage,
    status: differenceKg <= 0 ? 'below' : 'above',
    differenceKg,
  }

  return { total, breakdown, category_totals, comparison_to_average }
}

// ─── Chart Color Helper ───────────────────────────────────────────────

/**
 * Returns the hex color assigned to a given category for use in charts.
 * @param {string} category - 'transport' | 'energy' | 'food' | 'shopping'
 * @returns {string} hex color string
 */
export function getCategoryColor(category) {
  return CATEGORY_META[category]?.color ?? '#94a3b8'
}

/**
 * Returns the display label for a category.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryLabel(category) {
  return CATEGORY_META[category]?.label ?? category
}

// ─── Emission Level Classifier ────────────────────────────────────────

/**
 * Classify a CO₂ value into a named emission level.
 *
 * Thresholds (monthly kg CO₂):
 *   low      < 100 kg   — well below global average
 *   medium   100–333 kg — around or below global monthly avg (~333 kg/month)
 *   high     333–667 kg — up to 2× the global monthly average
 *   critical > 667 kg   — more than 2× the global monthly average
 *
 * @param {number} kgCO2
 * @returns {{
 *   level: 'low'|'medium'|'high'|'critical',
 *   label: string,
 *   color: string,
 *   description: string,
 *   thresholdKg: number,
 * }}
 */
export function getEmissionLevel(kgCO2) {
  const levels = [
    {
      level: 'low',
      label: 'Low',
      color: '#16a34a',
      thresholdKg: 100,
      description: 'Excellent! Well below the global monthly average.',
    },
    {
      level: 'medium',
      label: 'Medium',
      color: '#ca8a04',
      thresholdKg: 333,
      description: 'Moderate — around the global monthly average of 333 kg.',
    },
    {
      level: 'high',
      label: 'High',
      color: '#ea580c',
      thresholdKg: 667,
      description: 'High — up to twice the global monthly average.',
    },
    {
      level: 'critical',
      label: 'Critical',
      color: '#dc2626',
      thresholdKg: Infinity,
      description: 'Critical — more than twice the global monthly average.',
    },
  ]

  const match = levels.find(l => kgCO2 < l.thresholdKg) ?? levels[levels.length - 1]
  return match
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Round to 2 decimal places */
function round2(n) {
  return parseFloat(n.toFixed(2))
}

/**
 * Get a flat list of all items in a category, useful for building form selects.
 * @param {'transport'|'energy'|'food'|'shopping'} category
 * @returns {Array<{ key: string, label: string, unit: string, factor: number }>}
 */
export function getCategoryItems(category) {
  const map = EMISSION_FACTORS[category]
  if (!map) return []
  return Object.entries(map).map(([key, { factor, label, unit }]) => ({
    key,
    label,
    unit,
    factor,
  }))
}

/**
 * Convenience: get the emission factor for a specific category + item key.
 * Returns 0 if not found.
 */
export function getEmissionFactor(category, item) {
  return EMISSION_FACTORS[category]?.[item]?.factor ?? 0
}
