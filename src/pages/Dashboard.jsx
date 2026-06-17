import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, PieChart, Pie, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import {
  Car, Zap, Utensils, ShoppingBag, Target, TrendingUp,
  TrendingDown, Award, Flame, ArrowRight, Leaf,
  CheckCircle2, Lightbulb, Calendar, Settings, Lock,
  Thermometer, Quote, RefreshCw, Globe, CloudSun,
} from 'lucide-react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { useCarbonStats } from '../hooks/useCarbonStats.js'
import { getCategoryColor } from '../utils/carbonCalculator.js'
import { formatCO2 } from '../utils/calculations.js'
import { useWeather } from '../hooks/useWeather.js'
import { useQuote } from '../hooks/useQuote.js'
import { useCountryData } from '../hooks/useCountryData.js'
import BadgesGrid from '../components/BadgesGrid.jsx'
import CarbonCard from '../components/CarbonCard.jsx'
import EmissionGauge from '../components/EmissionGauge.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import QuickLogButton from '../components/QuickLogButton.jsx'

// ─── Constants ────────────────────────────────────────────────────────

// Global daily average: 4 t/yr ÷ 365 ≈ 10.96 kg/day
const GLOBAL_DAILY_AVG = parseFloat((4000 / 365).toFixed(2))

const ALL_TIPS = [
  { title: 'Cycle or walk for short trips',        category: 'Transport', impact: 'High',   icon: '🚲', description: 'Replace car trips under 3 km with cycling to save ~0.6 kg CO₂ per trip.' },
  { title: 'Switch to LED lighting',               category: 'Energy',    impact: 'Medium', icon: '💡', description: 'LEDs use 75% less energy and last 25× longer than incandescent bulbs.' },
  { title: 'Eat more plant-based meals',           category: 'Food',      impact: 'High',   icon: '🥗', description: 'A plant-based diet can reduce your food carbon footprint by up to 73%.' },
  { title: 'Use public transit',                   category: 'Transport', impact: 'High',   icon: '🚌', description: 'Buses and trains emit 60–80% less CO₂ per passenger compared to driving alone.' },
  { title: 'Unplug idle electronics',              category: 'Energy',    impact: 'Medium', icon: '🔌', description: 'Phantom loads from standby devices account for 5–10% of home electricity use.' },
  { title: 'Reduce food waste',                    category: 'Food',      impact: 'High',   icon: '🗑️', description: 'Plan meals and store food properly — food waste generates 8–10% of global emissions.' },
  { title: 'Choose reusable products',             category: 'Shopping',  impact: 'High',   icon: '♻️', description: 'Replace single-use items with reusables to drastically cut waste over time.' },
  { title: 'Air-dry your laundry',                 category: 'Energy',    impact: 'Medium', icon: '👔', description: 'Skipping the dryer saves ~2.3 kg CO₂ per load.' },
  { title: 'Buy local & seasonal produce',         category: 'Food',      impact: 'Medium', icon: '🥕', description: 'Locally grown seasonal produce cuts transport-related emissions by up to 50%.' },
  { title: 'Choose green energy providers',        category: 'Energy',    impact: 'High',   icon: '🌱', description: 'Switching to a renewable energy tariff can eliminate household electricity emissions.' },
  { title: 'Carpool with colleagues',              category: 'Transport', impact: 'Medium', icon: '🚗', description: 'Sharing rides halves your transport emissions while cutting fuel costs.' },
  { title: 'Repair before replacing electronics', category: 'Shopping',  impact: 'Medium', icon: '🔧', description: 'Extending product life by just 1 year can reduce its lifetime emissions by 20–30%.' },
]



const QUICK_LOGS = [
  { id: 'drove-work',      label: 'Drove to work',     icon: '🚗', emoji: Car,         co2: 3.15,  category: 'transport', item: 'car_petrol',  note: '15 km trip' },
  { id: 'skipped-meat',    label: 'Skipped meat today', icon: '🥗', emoji: Utensils,   co2: -1.5,  category: 'food',      item: 'vegan',       note: 'Plant-based meal' },
  { id: 'used-ac',         label: 'Used AC (2 hrs)',    icon: '❄️',  emoji: Zap,        co2: 1.64,  category: 'energy',    item: 'electricity', note: '2 kWh @ India grid' },
  { id: 'ordered-online',  label: 'Ordered online',     icon: '📦', emoji: ShoppingBag, co2: 0.5,  category: 'shopping',  item: 'online',      note: 'Packaging emissions' },
]

const IMPACT_BADGE = {
  High:   'bg-red-50 text-red-600 border border-red-200',
  Medium: 'bg-amber-50 text-amber-600 border border-amber-200',
  Low:    'bg-blue-50 text-blue-600 border border-blue-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────

function seededPick3(arr) {
  // Deterministic "random" 3 by day-of-year so they change daily
  const seed = new Date().getDate()
  const a = arr[(seed * 3)     % arr.length]
  const b = arr[(seed * 5 + 2) % arr.length]
  const c = arr[(seed * 7 + 4) % arr.length]
  // Dedupe
  const seen = new Set()
  return [a, b, c].filter(x => { if (seen.has(x.title)) return false; seen.add(x.title); return true })
}

function getDayColor(kg) {
  if (kg < 5)  return '#16a34a'
  if (kg < 10) return '#ca8a04'
  if (kg < 20) return '#ea580c'
  return '#dc2626'
}

function getTodayKg(entries) {
  const todayStr = new Date().toISOString().split('T')[0]
  return entries
    .filter(e => e.date?.startsWith(todayStr))
    .reduce((s, e) => s + e.totalCO2, 0)
}

function getWeeklyKg(entries) {
  const data = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const total = entries.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + e.totalCO2, 0)
    data.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      co2: parseFloat(total.toFixed(2)),
      date: key,
    })
  }
  return data
}

function getWeekCategoryBreakdown(entries) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7)
  const thisWeek = entries.filter(e => new Date(e.date) >= cutoff)
  const cats = { transport: 0, energy: 0, food: 0, shopping: 0 }
  thisWeek.forEach(e => {
    const k = e.category?.toLowerCase()
    if (cats[k] !== undefined) cats[k] = parseFloat((cats[k] + e.totalCO2).toFixed(2))
  })
  return [
    { name: 'Transport', value: cats.transport, color: getCategoryColor('transport') },
    { name: 'Energy',    value: cats.energy,    color: getCategoryColor('energy')    },
    { name: 'Food',      value: cats.food,       color: getCategoryColor('food')      },
    { name: 'Shopping',  value: cats.shopping,   color: getCategoryColor('shopping')  },
  ].filter(d => d.value > 0)
}

function getMonthKg(entries) {
  const now = new Date()
  return entries
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, e) => s + e.totalCO2, 0)
}

function computeStreak(entries, goalKgPerDay) {
  let streak = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayTotal = entries.filter(e => e.date?.startsWith(key)).reduce((s, e) => s + e.totalCO2, 0)
    if (i === 0 && dayTotal === 0) continue // skip today if nothing logged yet
    if (dayTotal <= goalKgPerDay && dayTotal > 0) streak++
    else if (dayTotal > goalKgPerDay) break
  }
  return streak
}

// ─── Sub-components ───────────────────────────────────────────────────

/** Custom recharts tooltip */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-green-100 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-bold">{parseFloat(p.value).toFixed(2)} kg CO₂</span>
        </p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()
  const { state, addCarbonEntry, updateProfile } = useCarbon()
  const { profileCompletion } = useCarbonStats()
  const { carbonEntries, userProfile, badges } = state
  const monthlyGoal = userProfile?.monthlyGoal ?? 150

  // ── API Hooks ──────────────────────────────────────────────────
  // Pass user's location — hook geocodes it to real lat/lon, falls back to Surat
  const { temperature, resolvedCity, weatherTip, isLoading: weatherLoading, error: weatherError } = useWeather(userProfile?.location)
  const { quote, isLoading: quoteLoading, nextQuote } = useQuote()
  const { countryData, co2PerCapita, motivationalMsg, isLoading: countryLoading } = useCountryData(userProfile?.location)

  const [flashedId, setFlashedId] = useState(null)
  const [isBadgesOpen, setIsBadgesOpen] = useState(false)
  
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState(userProfile?.name || '')
  const [settingsLocation, setSettingsLocation] = useState(userProfile?.location || '')
  const [settingsGoal, setSettingsGoal] = useState(monthlyGoal)

  // Sync settings inputs when userProfile updates
  useEffect(() => {
    if (isSettingsOpen) {
      setSettingsName(userProfile?.name || '')
      setSettingsLocation(userProfile?.location || '')
      setSettingsGoal(monthlyGoal)
    }
  }, [isSettingsOpen, userProfile, monthlyGoal])

  const handleSaveSettings = useCallback((e) => {
    e.preventDefault()
    updateProfile({
      name: settingsName,
      location: settingsLocation,
      monthlyGoal: parseFloat(settingsGoal) || 150,
    })
    setIsSettingsOpen(false)
  }, [updateProfile, settingsName, settingsLocation, settingsGoal])

  // ── Derived data ─────────────────────────────────────────────────
  const todayKg      = useMemo(() => getTodayKg(carbonEntries),           [carbonEntries])
  const weeklyData   = useMemo(() => getWeeklyKg(carbonEntries),          [carbonEntries])
  const catBreakdown = useMemo(() => getWeekCategoryBreakdown(carbonEntries), [carbonEntries])
  const monthKg      = useMemo(() => getMonthKg(carbonEntries),           [carbonEntries])
  const weekAvgKg    = useMemo(() => {
    const days = weeklyData.filter(d => d.co2 > 0)
    return days.length ? parseFloat((days.reduce((s, d) => s + d.co2, 0) / days.length).toFixed(2)) : 0
  }, [weeklyData])
  const streak       = useMemo(() => computeStreak(carbonEntries, monthlyGoal / 30), [carbonEntries, monthlyGoal])
  const goalProgress = useMemo(() => Math.min((monthKg / monthlyGoal) * 100, 100), [monthKg, monthlyGoal])

  // Comparison to global: percentile approximation
  const betterThanPct = useMemo(() => {
    if (weekAvgKg <= 0) return null
    // Simple linear approximation: global avg = 10.96, better than 50% at avg
    const ratio = weekAvgKg / GLOBAL_DAILY_AVG
    const pct = Math.round(Math.max(5, Math.min(95, (1 - ratio) * 50 + 50)))
    return pct
  }, [weekAvgKg])

  const todayColor   = getDayColor(todayKg)
  const dailyGoal    = parseFloat((monthlyGoal / 30).toFixed(2))
  const tips3        = useMemo(() => seededPick3(ALL_TIPS), [])

  // ── Quick log handler ────────────────────────────────────────────
  const handleQuickLog = useCallback((log) => {
    const absCo2 = Math.abs(log.co2)
    addCarbonEntry({
      category: log.category,
      item:     log.item,
      label:    log.label,
      quantity: 1,
      totalCO2: absCo2,
    })
    setFlashedId(log.id)
    setTimeout(() => setFlashedId(null), 800)
  }, [addCarbonEntry])

  // ── Greeting ─────────────────────────────────────────────────────
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const userName = userProfile?.name || null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        {/* Greeting + Quote */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-green-600 mb-1">{greeting}{userName ? `, ${userName}` : ''}!</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
              Here's your carbon snapshot <span className="gradient-text">🌱</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {betterThanPct !== null && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-green-50 border border-green-200">
                <Award className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Better than {betterThanPct}% of users
                </span>
              </div>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-green-700 hover:border-green-300 hover:bg-green-50/40 shadow-sm hover:shadow transition-all cursor-pointer font-semibold text-sm focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
              id="dashboard-settings-btn"
              aria-label="Edit profile and goals settings"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Completion Motivational Bar */}
        {profileCompletion < 100 && (
          <div className="glass-card p-4 mb-6 border-l-4 border-l-amber-500 animate-fade-in-up relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-amber-500/5 blur-xl" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <h3 className="text-sm font-bold text-gray-800">Complete your profile to unlock local tips!</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Your profile setup is <span className="font-extrabold text-amber-600">{profileCompletion}%</span> complete. Fill in your details to refine carbon estimates.
                </p>
              </div>
              <div className="flex items-center gap-4 min-w-[200px] sm:justify-end">
                <div className="flex-1 max-w-[150px]">
                  <ProgressBar
                    value={profileCompletion}
                    max={100}
                    color="bg-gradient-to-r from-amber-500 to-amber-600"
                  />
                </div>
                <Link 
                  to="/about?tab=profile" 
                  className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors shadow-sm font-bold text-xs cursor-pointer shrink-0"
                >
                  Complete Setup
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── ENVIRONMENTAL QUOTE ──────────────────────────────── */}
        {quote && (
          <div className="glass-card p-4 mb-6 relative overflow-hidden border-l-4 border-l-emerald-500 animate-fade-in-up">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-emerald-500/5 blur-xl" />
            <div className="flex items-start gap-3 relative">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                <Quote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  "{quote.content}"
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">— {quote.author}</p>
              </div>
              <button
                onClick={nextQuote}
                className="p-1.5 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-all shrink-0 cursor-pointer"
                title="New quote"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── WEATHER + COUNTRY ROW ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Weather Widget */}
          <div className="glass-card p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-sky-500/5 blur-xl" />
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center shrink-0">
                {weatherLoading ? (
                  <CloudSun className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : (
                  <Thermometer className="w-5 h-5 text-sky-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                {weatherLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-50 rounded animate-pulse" />
                  </div>
                ) : temperature !== null ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold text-gray-900">{temperature}°C</span>
                      <span className="text-xs text-gray-400 font-medium">{resolvedCity}</span>
                    </div>
                    {weatherTip && (
                      <p className="text-xs text-sky-600 mt-0.5 leading-relaxed">
                        {weatherTip.icon} {weatherTip.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Weather data unavailable</p>
                )}
              </div>
            </div>
            {weatherTip && temperature !== null && (
              <div className="mt-3 pt-3 border-t border-gray-100/80">
                <p className="text-[10px] text-gray-400">
                  💡 <span className="font-semibold text-gray-500">{weatherTip.savings}</span>
                </p>
              </div>
            )}
          </div>

          {/* Country Comparison Widget */}
          <div className="glass-card p-4 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-violet-500/5 blur-xl" />
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                {countryLoading ? (
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-50 rounded animate-pulse" />
                  </div>
                ) : motivationalMsg ? (
                  <>
                    <div className="flex items-center gap-2">
                      {countryData?.flag && (
                        <img src={countryData.flag} alt={`${motivationalMsg.country} flag`} className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                      )}
                      <span className="text-sm font-bold text-gray-800">{motivationalMsg.country}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 font-semibold border border-violet-100">
                        {co2PerCapita} t/yr per capita
                      </span>
                    </div>
                    <p className="text-xs text-violet-600 mt-1">
                      {motivationalMsg.text} — you're at {formatCO2(monthKg)}/month
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-gray-700">Country Comparison</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Set your location in{' '}
                      <Link to="/about?tab=profile" className="text-violet-600 underline underline-offset-2 font-semibold">
                        Profile
                      </Link>{' '}
                      to see your country's CO₂ average
                    </p>
                  </>
                )}
              </div>
            </div>
            {motivationalMsg && (
              <div className="mt-3 pt-3 border-t border-gray-100/80">
                <p className="text-[10px] text-gray-400">
                  📊 <span className="font-semibold text-gray-500">{motivationalMsg.detail}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hero metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today */}
          <CarbonCard
            label="Today's Footprint"
            value={`${todayKg.toFixed(1)}`}
            subText="kg CO₂"
            accentColor={todayColor}
            trend={todayKg <= dailyGoal ? 'down' : 'up'}
            trendText={
              todayKg < 5 ? 'Low emissions day 🎉' :
              todayKg < 10 ? 'Moderate day' :
              todayKg < 20 ? 'High emissions day' : 'Critical — take action!'
            }
          />

          {/* Weekly avg */}
          <CarbonCard
            label="7-Day Average"
            value={weekAvgKg > 0 ? `${weekAvgKg.toFixed(1)} kg` : '—'}
            subText={`Daily goal: ${dailyGoal} kg`}
            icon={TrendingUp}
            accentColor="#3b82f6"
            delay={100}
            trend={weekAvgKg > 0 ? (weekAvgKg <= dailyGoal ? 'down' : 'up') : undefined}
            trendText={
              weekAvgKg > 0
                ? weekAvgKg <= dailyGoal
                  ? `${((dailyGoal - weekAvgKg) / dailyGoal * 100).toFixed(0)}% below target`
                  : `${((weekAvgKg - dailyGoal) / dailyGoal * 100).toFixed(0)}% above target`
                : undefined
            }
          />

          {/* Monthly total */}
          <CarbonCard
            label="Monthly Total"
            value={formatCO2(monthKg)}
            subText={`of ${formatCO2(monthlyGoal)} goal`}
            icon={Calendar}
            accentColor={goalProgress >= 100 ? '#dc2626' : goalProgress >= 75 ? '#ea580c' : '#16a34a'}
            delay={200}
          >
            <ProgressBar
              value={goalProgress}
              max={100}
              className="mt-3"
              color={goalProgress >= 100 ? 'bg-red-600' : goalProgress >= 75 ? 'bg-orange-500' : 'bg-green-600'}
            />
            <p className="text-xs text-gray-400 mt-1">{goalProgress.toFixed(0)}% of monthly budget used</p>
          </CarbonCard>
        </div>
      </div>

      {/* ── CHARTS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart — 7-day trend */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">7-Day Emissions Trend</h2>
              <p className="text-xs text-gray-400 mt-0.5">Daily CO₂ vs your goal line</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-green-500 rounded-full inline-block" />
                Your goal
              </span>
            </div>
          </div>
          {weeklyData.some(d => d.co2 > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart 
                data={weeklyData} 
                margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activePayload && e.activePayload.length > 0) {
                    // Navigate to history or just set something. The user asks to "navigate to that day's history entry"
                    // History page doesn't currently support a direct hash or query param for day, but we can navigate to /history
                    navigate('/history')
                  }
                }}
                className="cursor-pointer"
              >
                <defs>
                  <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="day" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 30]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} unit=" kg" />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine
                  y={dailyGoal}
                  stroke="#9ca3af"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{ value: `Goal ${dailyGoal}kg`, position: 'insideTopRight', fontSize: 10, fill: '#9ca3af' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="co2" 
                  name="Emissions" 
                  stroke="#16a34a" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorCo2)" 
                  activeDot={{ r: 6, fill: '#16a34a' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Leaf className="w-8 h-8 text-green-200" />
              <p className="text-sm">No data yet — log your first entry!</p>
              <Link to="/calculator" className="text-xs text-green-600 font-semibold hover:underline">
                Open Calculator →
              </Link>
            </div>
          )}
        </div>

        {/* Pie chart — category breakdown this week */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="mb-4 text-center">
            <h2 className="text-base font-bold text-gray-800">This Week by Category</h2>
            <p className="text-xs text-gray-400 mt-0.5">Where your emissions are coming from</p>
          </div>
          {catBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={catBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={800}
                >
                  {catBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={v => [`${v.toFixed(2)} kg CO₂`]} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  content={(props) => {
                    const { payload } = props;
                    return (
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {payload.map((entry, index) => (
                          <div key={`item-${index}`} className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs font-semibold text-gray-600">{entry.value}</span>
                            <span className="text-xs text-gray-400">({((catBreakdown.find(c => c.name === entry.value)?.value / catBreakdown.reduce((a,b)=>a+b.value,0)) * 100).toFixed(0)}%)</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-gray-800">
                  {catBreakdown.reduce((a,b) => a+b.value, 0).toFixed(1)} kg
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-gray-400 uppercase tracking-wider">
                  Total
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Leaf className="w-8 h-8 text-green-200" />
              <p className="text-sm">Log activities to see your breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── QUICK LOG + GOALS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick log — 3/5 width */}
        <div className="lg:col-span-3 glass-card p-6 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">Quick Log</h2>
            <span className="text-xs text-gray-400 ml-1">— tap to instantly log an activity</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_LOGS.map(log => (
              <QuickLogButton
                key={log.id}
                log={log}
                flashed={flashedId === log.id}
                onClick={() => handleQuickLog(log)}
              />
            ))}
          </div>
          {flashedId && (
            <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 animate-fade-in-up">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Entry logged and saved to your history!
            </div>
          )}
        </div>

        {/* Goals — 2/5 width */}
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-green-600" />
            <h2 className="text-base font-bold text-gray-800">Monthly Goal</h2>
          </div>

          {/* Goal ring */}
          <div className="flex justify-center mb-5">
            <EmissionGauge
              value={goalProgress}
              max={100}
              label="used"
              levelText={goalProgress >= 100 ? 'exceeded' : 'on track'}
              colorOverride={goalProgress >= 100 ? '#dc2626' : goalProgress >= 75 ? '#ea580c' : '#16a34a'}
              className="scale-75 -my-6"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Current</span>
              <span className="font-bold text-gray-800">{formatCO2(monthKg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Goal</span>
              <span className="font-bold text-gray-800">{formatCO2(monthlyGoal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Remaining</span>
              <span className={`font-bold ${monthKg >= monthlyGoal ? 'text-red-600' : 'text-green-600'}`}>
                {monthKg >= monthlyGoal ? 'Goal exceeded!' : formatCO2(monthlyGoal - monthKg)}
              </span>
            </div>
          </div>

          {/* Streak */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
            <div>
              <p className="text-sm font-bold text-gray-800">
                {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} below goal!` : 'No streak yet'}
              </p>
              <p className="text-xs text-gray-400">
                {streak > 0 ? 'Keep it up — you\'re on a roll 🔥' : 'Log entries to start a streak'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACHIEVEMENTS ──────────────────────────────────────────── */}
      <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '650ms' }}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600 animate-bounce" />
            <div>
              <h2 className="text-base font-bold text-gray-800">My Achievements</h2>
              <p className="text-xs text-gray-400 mt-0.5">Track your unlocked badges and eco-milestones</p>
            </div>
          </div>
          <button
            onClick={() => setIsBadgesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100/50 transition-all text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
            aria-label={`View All Badges, unlocked ${badges?.length || 0} of 17`}
          >
            View All Badges ({badges?.length || 0}/17)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recently Earned Row */}
        {badges && badges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {badges.slice(0, 4).map(badge => (
              <div
                key={badge.id}
                className="flex items-center gap-3.5 p-3.5 bg-gradient-to-br from-green-50/60 to-emerald-50/60 border border-green-100 rounded-2xl animate-fade-in-up hover:shadow-sm transition-all"
              >
                <span className="text-3xl shrink-0 p-1.5 bg-white rounded-full shadow-sm">{badge.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-gray-800 truncate">{badge.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{badge.description}</p>
                  <span className="text-[9px] font-semibold text-green-600 bg-white/80 border border-green-100/80 px-1.5 py-0.5 rounded-full mt-1.5 inline-block">
                    Unlocked {badge.earnedDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 text-center text-gray-400 space-y-2 max-w-md mx-auto">
            <Award className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-600">No achievements unlocked yet</p>
            <p className="text-[11px] leading-relaxed">
              Log activities in the Carbon Calculator or mark eco tips as done to unlock badges!
            </p>
          </div>
        )}
      </div>

      {/* ── TIPS PREVIEW ──────────────────────────────────────────── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">Today's Eco Tips</h2>
          </div>
          <Link
            to="/tips"
            className="flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
          >
            See all tips <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tips3.map((tip, i) => (
            <div
              key={tip.title}
              className="glass-card p-5 group animate-fade-in-up"
              style={{ animationDelay: `${750 + i * 80}ms` }}
            >
              <div className="flex items-start gap-3 mb-2">
                <span className="text-xl shrink-0">{tip.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-800 leading-tight">{tip.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${IMPACT_BADGE[tip.impact]}`}>
                      {tip.impact}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">{tip.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-green-600 font-medium">{tip.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROFILE & GOALS SETTINGS MODAL ───────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-white rounded-3xl border border-green-100 shadow-2xl p-6 relative overflow-hidden animate-fade-in-up animate-duration-300"
          >
            {/* Background design accents */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-green-500/5 blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl" />

            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Profile & Goals</h3>
                <p className="text-xs text-gray-400">Configure your dashboard preferences</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 relative">
              <div>
                <label htmlFor="settings-name-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  id="settings-name-input"
                  value={settingsName}
                  onChange={e => setSettingsName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-green-500 text-sm transition-all"
                  aria-label="Your name"
                />
              </div>

              <div>
                <label htmlFor="settings-location-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="settings-location-input"
                  value={settingsLocation}
                  onChange={e => setSettingsLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-green-500 text-sm transition-all"
                  aria-label="Location"
                />
              </div>

              <div>
                <label htmlFor="settings-goal-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Monthly CO₂ Goal (kg)
                </label>
                <input
                  type="number"
                  id="settings-goal-input"
                  min="10"
                  max="5000"
                  value={settingsGoal}
                  onChange={e => setSettingsGoal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-green-500 text-sm transition-all"
                  aria-label="Monthly carbon goal in kilograms"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Global average is ~333 kg CO₂/month. A lower goal helps reduce your impact!
                </p>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
                  aria-label="Cancel profile changes"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 text-sm font-semibold transition-colors cursor-pointer shadow-md shadow-green-200 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
                  aria-label="Save profile changes"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── ALL BADGES DIALOG MODAL ──────────────────────────────── */}
      {isBadgesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-4xl bg-[#f8faf9] rounded-3xl border border-green-100 shadow-2xl p-6 relative overflow-hidden animate-fade-in-up animate-duration-300 max-h-[85vh] overflow-y-auto"
          >
            {/* Background design accents */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-green-500/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Achievements Showcase</h3>
                  <p className="text-xs text-gray-400">You've unlocked {badges?.length || 0} of 17 milestones</p>
                </div>
              </div>
              <button
                onClick={() => setIsBadgesOpen(false)}
                className="px-3 py-1.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-500 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
                aria-label="Close achievements modal"
              >
                Close View
              </button>
            </div>

            {/* Badges Grid component */}
            <div className="relative">
              <BadgesGrid earnedBadges={badges} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
