import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, useState } from 'react'
import { getWeeklyData, getMonthlyData, getTotalCO2 } from '../utils/calculations.js'
import { evaluateBadges } from '../utils/badges.js'
import { checkGoalAlert } from '../utils/notifications.js'
import { useAuth } from './AuthContext.jsx'
import ToastNotification from '../components/ToastNotification.jsx'

const CarbonContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const STORAGE_KEY = 'carbonwise-data'

// Global average: ~4 tons CO2/year per person (source: Our World in Data)
const GLOBAL_AVERAGE_YEARLY_KG = 4000



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

  // First load → initialize with empty database
  const state = {
    userProfile: {
      name: '',
      location: '',
      monthlyGoal: 150, // default 150kg
      dietPreference: 'omnivore',
      vehicleType: 'petrol',
      notifications: { weeklyReport: true, goalAlerts: true, ecoTips: false }
    },
    carbonEntries: [],
    totalFootprint: 0,
    weeklyData: [],
    monthlyData: [],
    badges: [],
    completedTips: [],
  }
  return state
}



// ─── Reducer ──────────────────────────────────────────────────────────
function carbonReducer(state, action) {
  let next
  switch (action.type) {
    case 'SET_DATA': {
      const { carbonEntries = [], completedTips = [], userProfile = {} } = action.payload
      const totalFootprint = getTotalCO2(carbonEntries)
      const weeklyData = getWeeklyData(carbonEntries)
      const monthlyData = getMonthlyData(carbonEntries)
      next = {
        ...state,
        carbonEntries,
        completedTips,
        userProfile: { ...state.userProfile, ...userProfile },
        totalFootprint,
        weeklyData,
        monthlyData,
      }
      next.badges = evaluateBadges(next)
      return next
    }
    case 'SET_COMPLETED_TIPS': {
      next = { ...state, completedTips: action.payload }
      next.badges = evaluateBadges(next)
      return next
    }
    case 'ADD_ENTRY': {
      const newEntry = action.payload.id ? action.payload : {
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
  const { token, user, updateLocalUser } = useAuth()
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  const showErrorToast = (message) => {
    setToast({ show: true, message, type: 'error' })
  }

  // Persist to localStorage on every state change (fallback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  // Sync data from local PostgreSQL backend when authenticated
  useEffect(() => {
    async function syncFromDb() {
      if (!token) {
        // If not logged in, reset/clear DB-dependent state (or use local guest data)
        return
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` }

        // Fetch entries
        const entriesRes = await fetch(`${API_URL}/entries`, { headers })
        const entries = entriesRes.ok ? await entriesRes.json() : []

        // Fetch completed tips
        const tipsRes = await fetch(`${API_URL}/tips`, { headers })
        const tips = tipsRes.ok ? await tipsRes.json() : []

        // Dispatch full set
        dispatch({
          type: 'SET_DATA',
          payload: {
            carbonEntries: entries,
            completedTips: tips,
            userProfile: user || {}
          }
        })
      } catch (err) {
        console.error('Error syncing data from local PostgreSQL backend:', err)
      }
    }

    syncFromDb()
  }, [token, user])

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
  const addCarbonEntry = useCallback(async (entry) => {
    if (token) {
      try {
        const res = await fetch(`${API_URL}/entries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(entry)
        })
        if (res.ok) {
          const savedEntry = await res.json()
          dispatch({ type: 'ADD_ENTRY', payload: savedEntry })
          return
        }
      } catch (err) {
        console.error('Failed to save carbon entry to DB:', err)
        showErrorToast('Failed to sync entry with server. Saved locally.')
      }
    }
    // Fallback/Guest
    dispatch({ type: 'ADD_ENTRY', payload: entry })
  }, [token])

  const deleteEntry = useCallback(async (id) => {
    if (token) {
      try {
        const res = await fetch(`${API_URL}/entries/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          dispatch({ type: 'DELETE_ENTRY', payload: id })
          return
        }
      } catch (err) {
        console.error('Failed to delete entry from DB:', err)
        showErrorToast('Failed to delete entry from server. Removed locally.')
      }
    }
    // Fallback/Guest
    dispatch({ type: 'DELETE_ENTRY', payload: id })
  }, [token])

  const updateProfile = useCallback(async (profile) => {
    if (token) {
      try {
        const res = await fetch(`${API_URL}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(profile)
        })
        if (res.ok) {
          const updatedProfile = await res.json()
          updateLocalUser(updatedProfile)
          dispatch({ type: 'UPDATE_PROFILE', payload: updatedProfile })
          return
        }
      } catch (err) {
        console.error('Failed to update profile in DB:', err)
        showErrorToast('Failed to sync profile with server. Saved locally.')
      }
    }
    // Fallback/Guest
    dispatch({ type: 'UPDATE_PROFILE', payload: profile })
  }, [token, updateLocalUser])

  const clearHistory = useCallback(async () => {
    if (token) {
      try {
        await fetch(`${API_URL}/entries`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      } catch (err) {
        console.error('Failed to clear history from DB:', err)
        showErrorToast('Failed to clear history from server. Cleared locally.')
      }
    }
    dispatch({ type: 'CLEAR_HISTORY' })
  }, [token])

  const getAverageFootprint = useCallback(() => {
    if (!state?.carbonEntries || state.carbonEntries.length === 0) return 0
    return parseFloat((state.totalFootprint / state.carbonEntries.length).toFixed(2))
  }, [state])

  const compareToGlobalAverage = useCallback(() => {
    const globalMonthlyKg = GLOBAL_AVERAGE_YEARLY_KG / 12
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const entries = state?.carbonEntries || []
    const last30 = entries.filter(e => new Date(e.date) >= cutoff)
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
  }, [state?.carbonEntries])

  const toggleTipCompleted = useCallback(async (tipId) => {
    const completedTips = state?.completedTips || []
    const isCompleted = completedTips.includes(tipId)
    if (token) {
      try {
        const res = await fetch(`${API_URL}/tips`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tipId, completed: !isCompleted })
        })
        if (res.ok) {
          const updatedTips = await res.json()
          dispatch({ type: 'SET_COMPLETED_TIPS', payload: updatedTips })
          return
        }
      } catch (err) {
        console.error('Failed to toggle eco tip in DB:', err)
        showErrorToast('Failed to sync tip progress with server. Saved locally.')
      }
    }
    // Fallback/Guest
    dispatch({ type: 'TOGGLE_TIP_COMPLETED', payload: tipId })
  }, [token, state?.completedTips])

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
      <ToastNotification 
        message={toast.message} 
        show={toast.show} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, show: false }))} 
      />
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
