import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react'
import { getCategoryBreakdown, getWeeklyData, getMonthlyData, getTotalCO2 } from '../utils/calculations.js'
import { evaluateBadges } from '../utils/badges.js'
import { checkGoalAlert } from '../utils/notifications.js'

const CarbonContext = createContext(null)

const STORAGE_KEY = 'carbonwise-data'

// Global average: ~4 tons CO2/year per person (source: Our World in Data)
const GLOBAL_AVERAGE_YEARLY_KG = 4000



// ─── Sample Data Generator ────────────────────────────────────────────
function generateSampleData() {
  const entries = []
  const sampleActivities = [
    { category: 'transport', item: 'car',         label: 'Car',                quantity: 25,  totalCO2: 5.25  },
    { category: 'transport', item: 'bus',         label: 'Bus',                quantity: 15,  totalCO2: 1.34  },
    { category: 'transport', item: 'train',       label: 'Train',              quantity: 40,  totalCO2: 1.64  },
    { category: 'energy',    item: 'electricity', label: 'Electricity (kWh)',   quantity: 12,  totalCO2: 6.0   },
    { category: 'energy',    item: 'naturalGas',  label: 'Natural Gas (m³)',    quantity: 3,   totalCO2: 6.0   },
    { category: 'food',      item: 'beef',        label: 'Beef',               quantity: 0.5, totalCO2: 13.5  },
    { category: 'food',      item: 'chicken',     label: 'Chicken',            quantity: 0.8, totalCO2: 5.52  },
    { category: 'food',      item: 'vegetables',  label: 'Vegetables',         quantity: 2,   totalCO2: 4.0   },
    { category: 'food',      item: 'dairy',       label: 'Dairy',              quantity: 1,   totalCO2: 3.2   },
    { category: 'waste',     item: 'landfill',    label: 'Landfill',           quantity: 2,   totalCO2: 1.16  },
    { category: 'waste',     item: 'recycled',    label: 'Recycled',           quantity: 3,   totalCO2: 0.09  },
    { category: 'transport', item: 'car',         label: 'Car',                quantity: 18,  totalCO2: 3.78  },
    { category: 'energy',    item: 'electricity', label: 'Electricity (kWh)',   quantity: 8,   totalCO2: 4.0   },
    { category: 'food',      item: 'fish',        label: 'Fish',               quantity: 0.4, totalCO2: 2.44  },
  ]

  // Spread entries across the last 7 days (2 entries per day)
  for (let i = 0; i < sampleActivities.length; i++) {
    const daysAgo = Math.floor(i / 2) // 2 entries per day
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    date.setHours(8 + (i % 3) * 4, Math.floor(Math.random() * 60), 0, 0) // varied hours

    entries.push({
      ...sampleActivities[i],
      id: Date.now() - (i * 100000), // unique IDs spread in time
      date: date.toISOString(),
    })
  }

  return entries
}

// ─── Load from localStorage ───────────────────────────────────────────
function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// ─── Initial State ────────────────────────────────────────────────────
function buildInitialState() {
  const stored = loadFromStorage()
  if (stored) {
    // Recompute derived fields from stored data
    const carbonEntries = stored.carbonEntries || []
    const totalFootprint = getTotalCO2(carbonEntries)
    const weeklyData = getWeeklyData(carbonEntries)
    const monthlyData = getMonthlyData(carbonEntries)
    const badges = evaluateBadges({ ...stored, carbonEntries })
    const userProfile = {
      name: '',
      location: '',
      monthlyGoal: 150,
      dietPreference: 'omnivore',
      vehicleType: 'petrol',
      notifications: { weeklyReport: true, goalAlerts: true, ecoTips: false },
      ...stored.userProfile
    }
    return { completedTips: [], ...stored, carbonEntries, userProfile, totalFootprint, weeklyData, monthlyData, badges }
  }

  // First load → seed with sample data
  const sampleEntries = generateSampleData()
  const totalFootprint = getTotalCO2(sampleEntries)
  const weeklyData = getWeeklyData(sampleEntries)
  const monthlyData = getMonthlyData(sampleEntries)

  const state = {
    userProfile: {
      name: '',
      location: '',
      monthlyGoal: 150, // default 150kg
      dietPreference: 'omnivore',
      vehicleType: 'petrol',
      notifications: { weeklyReport: true, goalAlerts: true, ecoTips: false }
    },
    carbonEntries: sampleEntries,
    totalFootprint,
    weeklyData,
    monthlyData,
    badges: [],
    completedTips: [],
  }
  state.badges = evaluateBadges(state)
  return state
}



// ─── Reducer ──────────────────────────────────────────────────────────
function carbonReducer(state, action) {
  let next
  switch (action.type) {
    case 'ADD_ENTRY': {
      const newEntry = {
        ...action.payload,
        id: Date.now(),
        date: new Date().toISOString(),
      }
      const carbonEntries = [...state.carbonEntries, newEntry]
      const totalFootprint = getTotalCO2(carbonEntries)
      const weeklyData = getWeeklyData(carbonEntries)
      const monthlyData = getMonthlyData(carbonEntries)
      next = { ...state, carbonEntries, totalFootprint, weeklyData, monthlyData }
      next.badges = evaluateBadges(next)
      return next
    }
    case 'DELETE_ENTRY': {
      const carbonEntries = state.carbonEntries.filter(e => e.id !== action.payload)
      const totalFootprint = getTotalCO2(carbonEntries)
      const weeklyData = getWeeklyData(carbonEntries)
      const monthlyData = getMonthlyData(carbonEntries)
      next = { ...state, carbonEntries, totalFootprint, weeklyData, monthlyData }
      next.badges = evaluateBadges(next)
      return next
    }
    case 'UPDATE_PROFILE': {
      next = { ...state, userProfile: { ...state.userProfile, ...action.payload } }
      next.badges = evaluateBadges(next)
      return next
    }
    case 'CLEAR_HISTORY': {
      next = {
        ...state,
        carbonEntries: [],
        totalFootprint: 0,
        weeklyData: getWeeklyData([]),
        monthlyData: getMonthlyData([]),
        badges: [],
        completedTips: [],
      }
      return next
    }
    case 'TOGGLE_TIP_COMPLETED': {
      const completedTips = state.completedTips || []
      const tipId = action.payload
      const isCompleted = completedTips.includes(tipId)
      const nextCompleted = isCompleted
        ? completedTips.filter(id => id !== tipId)
        : [...completedTips, tipId]
      next = { ...state, completedTips: nextCompleted }
      next.badges = evaluateBadges(next)
      return next
    }
    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────
export function CarbonProvider({ children }) {
  const [state, dispatch] = useReducer(carbonReducer, null, buildInitialState)

  // Persist to localStorage on every state change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Trigger goal alerts on new entries added during the session
  const prevEntriesLength = useRef(state?.carbonEntries?.length || 0)
  useEffect(() => {
    if (state?.carbonEntries && state.carbonEntries.length > prevEntriesLength.current) {
      checkGoalAlert(state.carbonEntries, state.userProfile?.monthlyGoal ?? 150)
    }
    if (state?.carbonEntries) {
      prevEntriesLength.current = state.carbonEntries.length
    }
  }, [state?.carbonEntries, state?.userProfile?.monthlyGoal])

  // ── Exposed action functions ──────────────────────────────────────
  const addCarbonEntry = useCallback((entry) => {
    dispatch({ type: 'ADD_ENTRY', payload: entry })
  }, [])

  const deleteEntry = useCallback((id) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id })
  }, [])

  const updateProfile = useCallback((profile) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: profile })
  }, [])

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [])

  const getAverageFootprint = useCallback(() => {
    if (state.carbonEntries.length === 0) return 0
    return parseFloat((state.totalFootprint / state.carbonEntries.length).toFixed(2))
  }, [state.totalFootprint, state.carbonEntries.length])

  const compareToGlobalAverage = useCallback(() => {
    // Global average: 4 tons CO2/year = ~333.33 kg/month = ~10.96 kg/day
    const globalMonthlyKg = GLOBAL_AVERAGE_YEARLY_KG / 12

    // Get last 30 days of user entries
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const last30 = state.carbonEntries.filter(e => new Date(e.date) >= cutoff)
    const userMonthlyKg = last30.reduce((sum, e) => sum + e.totalCO2, 0)

    const difference = userMonthlyKg - globalMonthlyKg
    const percentDiff = globalMonthlyKg > 0
      ? parseFloat(((difference / globalMonthlyKg) * 100).toFixed(1))
      : 0

    return {
      userMonthlyKg: parseFloat(userMonthlyKg.toFixed(2)),
      globalMonthlyKg: parseFloat(globalMonthlyKg.toFixed(2)),
      differenceKg: parseFloat(difference.toFixed(2)),
      percentDiff,
      status: difference <= 0 ? 'below' : 'above',
    }
  }, [state.carbonEntries])

  const toggleTipCompleted = useCallback((tipId) => {
    dispatch({ type: 'TOGGLE_TIP_COMPLETED', payload: tipId })
  }, [])

  // ── Memoized context value ────────────────────────────────────────
  const value = useMemo(() => ({
    state,
    addCarbonEntry,
    deleteEntry,
    updateProfile,
    clearHistory,
    getAverageFootprint,
    compareToGlobalAverage,
    toggleTipCompleted,
  }), [state, addCarbonEntry, deleteEntry, updateProfile, clearHistory, getAverageFootprint, compareToGlobalAverage, toggleTipCompleted])

  return (
    <CarbonContext.Provider value={value}>
      {children}
    </CarbonContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────
export function useCarbon() {
  const context = useContext(CarbonContext)
  if (!context) throw new Error('useCarbon must be used within a CarbonProvider')
  return context
}

export default CarbonContext
