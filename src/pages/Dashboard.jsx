import React, { useMemo, useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// Recharts components — code-split into separate chunks
const DashboardAreaChart = lazy(() => import('../components/charts/DashboardAreaChart.jsx'));
const DashboardPieChart  = lazy(() => import('../components/charts/DashboardPieChart.jsx'));
// Three.js globe — largest lazy chunk, only loads on Dashboard
const Globe3D = lazy(() => import('../components/Globe3D.jsx'));
import GlobeFallback from '../components/GlobeFallback.jsx'
import {
  Car, Zap, Utensils, ShoppingBag, Target, TrendingUp,
  Award, Flame, Leaf, ArrowRight, Lightbulb,
  CheckCircle2, Calendar, Settings,
  Thermometer, Globe, CloudSun, Quote, RefreshCw,
  Bike, Salad, Bus, Plug, Trash2, Shirt, Wrench, BarChart2, Package, Snowflake
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
import LocationAutocomplete from '../components/LocationAutocomplete.jsx'
import EmojiIcon from '../components/EmojiIcon.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'

// ─── Constants ────────────────────────────────────────────────────────

// Global daily average: 4 t/yr ÷ 365 ≈ 10.96 kg/day
const GLOBAL_DAILY_AVG = parseFloat((4000 / 365).toFixed(2))

const ALL_TIPS = [
  { title: 'Cycle or walk for short trips',        category: 'Transport', impact: 'High',   icon: Bike, description: 'Replace car trips under 3 km with cycling to save ~0.6 kg CO₂ per trip.' },
  { title: 'Switch to LED lighting',               category: 'Energy',    impact: 'Medium', icon: Lightbulb, description: 'LEDs use 75% less energy and last 25× longer than incandescent bulbs.' },
  { title: 'Eat more plant-based meals',           category: 'Food',      impact: 'High',   icon: Salad, description: 'A plant-based diet can reduce your food carbon footprint by up to 73%.' },
  { title: 'Use public transit',                   category: 'Transport', impact: 'High',   icon: Bus, description: 'Buses and trains emit 60–80% less CO₂ per passenger compared to driving alone.' },
  { title: 'Unplug idle electronics',              category: 'Energy',    impact: 'Medium', icon: Plug, description: 'Phantom loads from standby devices account for 5–10% of home electricity use.' },
  { title: 'Reduce food waste',                    category: 'Food',      impact: 'High',   icon: Trash2, description: 'Plan meals and store food properly — food waste generates 8–10% of global emissions.' },
  { title: 'Choose reusable products',             category: 'Shopping',  impact: 'High',   icon: RefreshCw, description: 'Replace single-use items with reusables to drastically cut waste over time.' },
  { title: 'Air-dry your laundry',                 category: 'Energy',    impact: 'Medium', icon: Shirt, description: 'Skipping the dryer saves ~2.3 kg CO₂ per load.' },
  { title: 'Buy local & seasonal produce',         category: 'Food',      impact: 'Medium', icon: Salad, description: 'Locally grown seasonal produce cuts transport-related emissions by up to 50%.' },
  { title: 'Choose green energy providers',        category: 'Energy',    impact: 'High',   icon: Leaf, description: 'Switching to a renewable energy tariff can eliminate household electricity emissions.' },
  { title: 'Carpool with colleagues',              category: 'Transport', impact: 'Medium', icon: Car, description: 'Sharing rides halves your transport emissions while cutting fuel costs.' },
  { title: 'Repair before replacing electronics', category: 'Shopping',  impact: 'Medium', icon: Wrench, description: 'Extending product life by just 1 year can reduce its lifetime emissions by 20–30%.' },
]

const QUICK_LOGS = [
  { id: 'drove-work',      label: 'Drove to work',     icon: Car, emoji: Car,         co2: 3.15,  category: 'transport', item: 'car_petrol',  note: '15 km trip' },
  { id: 'skipped-meat',    label: 'Skipped meat today', icon: Salad, emoji: Salad,   co2: -1.5,  category: 'food',      item: 'vegan',       note: 'Plant-based meal' },
  { id: 'used-ac',         label: 'Used AC (2 hrs)',    icon: Snowflake,  emoji: Snowflake,  co2: 1.64,  category: 'energy',    item: 'electricity', note: '2 kWh @ India grid' },
  { id: 'ordered-online',  label: 'Ordered online',     icon: Package, emoji: Package, co2: 0.5,  category: 'shopping',  item: 'online',      note: 'Packaging emissions' },
]

const IMPACT_BADGE = {
  High:   'bg-red-50 text-red-600 border border-red-200',
  Medium: 'bg-amber-50 text-amber-600 border border-amber-200',
  Low:    'bg-blue-50 text-blue-600 border border-blue-200',
}

// ─── Helpers ──────────────────────────────────────────────────────────

function seededPick3(arr) {
  const seed = new Date().getDate()
  const a = arr[(seed * 3)     % arr.length]
  const b = arr[(seed * 5 + 2) % arr.length]
  const c = arr[(seed * 7 + 4) % arr.length]
  const seen = new Set()
  return [a, b, c].filter(x => { if (seen.has(x.title)) return false; seen.add(x.title); return true })
}

function getDayColor(kg) {
  if (kg < 5)  return '#10B981'
  if (kg < 10) return '#F59E0B'
  if (kg < 20) return '#ea580c'
  return '#DB2777'
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
    if (i === 0 && dayTotal === 0) continue
    if (dayTotal <= goalKgPerDay && dayTotal > 0) streak++
    else if (dayTotal > goalKgPerDay) break
  }
  return streak
}

// ─── Sub-components ───────────────────────────────────────────────────

// Tooltip is moved to chart components

function DashboardBadgeCard({ badge }) {
  const tilt = use3DTilt({ maxTilt: 14, scale: 1.04 })
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      className="flex items-center gap-2 sm:gap-3.5 p-2 sm:p-3.5 bg-[#0F1115] border border-white/10 rounded-2xl animate-fade-in-up transition-all shadow-[0_0_20px_rgba(247,147,26,0.05)] holo-shine"
    >
      <span className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0 bg-[#030304] border border-[#F7931A]/20 shadow-[0_0_10px_rgba(247,147,26,0.06)]">
        <EmojiIcon icon={badge.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-bold text-white truncate font-display">{badge.name}</p>
        <p className="text-[9px] sm:text-[10px] text-clay-muted font-medium truncate mt-0.5 font-sans">{badge.description}</p>
        <span className="text-[8px] sm:text-[9px] font-bold text-[#10B981] bg-[#030304] border border-[#10B981]/25 px-2 py-0.5 rounded-md mt-1 sm:mt-1.5 inline-block shadow-sm font-mono">
          Unlocked {badge.earnedDate}
        </span>
      </div>
    </div>
  )
}

function DashboardTipCard({ tip, i, impactBadge }) {
  const tilt = use3DTilt({ maxTilt: 10, scale: 1.03 })
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{
        ...tilt.style,
        animationDelay: `${750 + i * 80}ms`
      }}
      className="glass-card p-5 group animate-fade-in-up flex flex-col justify-between h-full"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-[#030304] border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
          <EmojiIcon icon={tip.icon} className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 font-sans">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-white leading-tight font-display">{tip.title}</h3>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 border ${impactBadge[tip.impact]}`}>
              {tip.impact}
            </span>
          </div>
          <p className="text-[10px] text-clay-muted mt-1 leading-relaxed font-medium">{tip.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 pt-3 border-t border-white/5 font-sans">
        <span className="w-1.5 h-1.5 rounded-full bg-clay-success" />
        <span className="text-[10px] text-clay-success font-bold font-mono">{tip.category}</span>
      </div>
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

  const { temperature, resolvedCity, weatherTip, isLoading: weatherLoading } = useWeather(userProfile?.location)
  const { quote, nextQuote } = useQuote()
  const { countryData, co2PerCapita, motivationalMsg, isLoading: countryLoading } = useCountryData(userProfile?.location)

  const [flashedId, setFlashedId] = useState(null)
  const [isBadgesOpen, setIsBadgesOpen] = useState(false)
  const [activeTipIndex, setActiveTipIndex] = useState(0)
  const [activeChartTab, setActiveChartTab] = useState('trend')

  // 3D tilt interaction hooks for dashboard containers
  const welcomeTilt = use3DTilt({ maxTilt: 6, scale: 1.01 })
  const globeTilt = use3DTilt({ maxTilt: 6, scale: 1.015 })
  const quickLogTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })
  const goalTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })
  const achievementsTilt = use3DTilt({ maxTilt: 4, scale: 1.01 })
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState(userProfile?.name || '')
  const [settingsLocation, setSettingsLocation] = useState(userProfile?.location || '')
  const [settingsGoal, setSettingsGoal] = useState(monthlyGoal)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const todayKg      = useMemo(() => getTodayKg(carbonEntries),           [carbonEntries])
  const weeklyData   = useMemo(() => getWeeklyKg(carbonEntries),          [carbonEntries])
  const catBreakdown = useMemo(() => getWeekCategoryBreakdown(carbonEntries), [carbonEntries])
  const monthKg      = useMemo(() => getMonthKg(carbonEntries),           [carbonEntries])
  const weekAvgKg    = useMemo(() => {
    const days = weeklyData.filter(d => d.co2 > 0)
    return days.length ? parseFloat((days.reduce((s, d) => s + d.co2, 0) / days.length).toFixed(2)) : 0
  }, [weeklyData])
  const streak       = useMemo(() => computeStreak(carbonEntries, monthlyGoal / 30), [carbonEntries, monthlyGoal])
  const goalProgress = useMemo(() => {
    if (!monthlyGoal || monthlyGoal <= 0 || isNaN(monthlyGoal)) return 0
    return Math.min((monthKg / monthlyGoal) * 100, 100)
  }, [monthKg, monthlyGoal])

  const betterThanPct = useMemo(() => {
    if (weekAvgKg <= 0) return null
    const ratio = weekAvgKg / GLOBAL_DAILY_AVG
    const pct = Math.round(Math.max(5, Math.min(95, (1 - ratio) * 50 + 50)))
    return pct
  }, [weekAvgKg])

  const todayColor   = getDayColor(todayKg)
  const dailyGoal    = parseFloat((monthlyGoal / 30).toFixed(2))
  const tips3        = useMemo(() => seededPick3(ALL_TIPS), [])

  const handleQuickLog = useCallback((log) => {
    addCarbonEntry({
      category: log.category,
      item:     log.item,
      label:    log.label,
      quantity: 1,
      totalCO2: log.co2,
    })
    setFlashedId(log.id)
    setTimeout(() => setFlashedId(null), 800)
  }, [addCarbonEntry])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const userName = userProfile?.name || null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── SECTION 1: HERO CONTEXT (Row 1) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
        {/* Welcome & Context Card */}
        <div
          ref={welcomeTilt.ref}
          onMouseMove={welcomeTilt.onMouseMove}
          onMouseLeave={welcomeTilt.onMouseLeave}
          style={welcomeTilt.style}
          className={`${isMobile ? 'lg:col-span-12' : 'lg:col-span-8'} glass-card p-6 relative overflow-hidden flex flex-col justify-between h-full min-h-0 sm:min-h-[340px] space-y-6`}
        >
          {/* Background ambient glows */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-clay-primary/5 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-clay-success/5 blur-2xl pointer-events-none" />

          <div className="space-y-4">
            {/* Header: Greeting & Leaf Icon & Better Than badge */}
            <div className="flex justify-between items-start gap-3 sm:gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold text-clay-primary uppercase tracking-widest bg-clay-primary/10 px-2.5 py-0.5 rounded-full border border-clay-primary/20 inline-block font-mono">
                  {greeting}{userName ? `, ${userName}` : ''}!
                </p>
                <h1 className="text-lg sm:text-3xl font-bold text-[#FFFFFF] leading-tight font-display flex items-center gap-1.5 flex-wrap">
                  Here's your carbon snapshot <span className="gradient-text inline-flex items-center"><EmojiIcon icon={Leaf} className="w-5 h-5 sm:w-7 sm:h-7 text-clay-success animate-clay-breathe" /></span>
                </h1>
                <p className="text-clay-muted text-[10px] sm:text-xs font-semibold font-sans">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {betterThanPct !== null && (
                  <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1.5 bg-[#0F1115] border border-[#F7931A]/35 text-[#F7931A] text-[9px] sm:text-xs font-bold rounded-full select-none uppercase tracking-wider shadow-[0_0_12px_rgba(247,147,26,0.1)] font-mono">
                    <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-clay-primary animate-clay-breathe" />
                    <span>Top {betterThanPct}%</span>
                  </div>
                )}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="btn-premium flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-white cursor-pointer font-bold text-[9px] sm:text-xs focus-visible:ring-4 focus-visible:ring-clay-primary/30 focus:outline-none shadow-lg border-none rounded-full"
                  id="dashboard-settings-btn-mobile"
                  aria-label="Edit profile and goals settings"
                >
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Integrated mini weather & country comparison side-by-side */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Integrated Mini Weather */}
              <div className="bg-[#0D0F13]/80 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-sky-500/20 transition-all duration-300 min-h-[96px]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#030304] flex items-center justify-center border border-white/5 shrink-0">
                    {weatherLoading ? (
                      <CloudSun className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    ) : (
                      <Thermometer className="w-3.5 h-3.5 text-sky-500" />
                    )}
                  </div>
                  <div className="min-w-0 font-sans">
                    {weatherLoading ? (
                      <div className="h-3 w-12 bg-gray-100/5 rounded animate-pulse" />
                    ) : temperature !== null ? (
                      <div className="flex items-baseline gap-0.5 flex-wrap">
                        <span className="text-xs sm:text-base font-bold text-white">{temperature}°C</span>
                        <span className="text-[8px] sm:text-[10px] text-clay-muted truncate max-w-[60px] sm:max-w-[80px]">({resolvedCity.split(',')[0]})</span>
                      </div>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] text-clay-muted">N/A</span>
                    )}
                  </div>
                </div>
                {weatherLoading ? (
                  <div className="h-2.5 w-20 bg-gray-100/5 rounded animate-pulse mt-2" />
                ) : weatherTip && temperature !== null ? (
                  <p className="text-[9px] sm:text-[11px] text-sky-400 mt-2 font-semibold flex items-center gap-1 font-sans">
                    <EmojiIcon icon={weatherTip.icon} className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate">{weatherTip.message.split('—')[1]?.trim() || weatherTip.message}</span>
                  </p>
                ) : (
                  <p className="text-[9px] sm:text-[11px] text-clay-muted mt-2 font-semibold font-sans">
                    No tips
                  </p>
                )}
              </div>

              {/* Integrated Mini Country Comparison */}
              <div className="bg-[#0D0F13]/80 border border-white/5 rounded-xl p-3 flex flex-col justify-between hover:border-clay-primary/20 transition-all duration-300 min-h-[96px]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#030304] flex items-center justify-center border border-white/5 shrink-0">
                    <Globe className="w-3.5 h-3.5 text-clay-primary" />
                  </div>
                  <div className="min-w-0 font-sans">
                    {countryLoading ? (
                      <div className="h-3 w-16 bg-gray-100/5 rounded animate-pulse" />
                    ) : motivationalMsg ? (
                      <div className="flex items-center gap-1">
                        {countryData?.flag && (
                          <img src={countryData.flag} alt="" className="w-3.5 h-2.5 rounded-sm object-cover" />
                        )}
                        <span className="text-xs font-bold text-white truncate max-w-[60px] sm:max-w-[100px]">{motivationalMsg.country}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] text-clay-muted">Set location</span>
                    )}
                  </div>
                </div>
                {countryLoading ? (
                  <div className="h-2.5 w-16 bg-gray-100/5 rounded animate-pulse mt-2" />
                ) : motivationalMsg ? (
                  <p className="text-[9px] sm:text-[11px] text-clay-primary mt-2 font-semibold truncate font-sans">
                    {co2PerCapita} t/yr avg
                  </p>
                ) : (
                  <p className="text-[9px] sm:text-[11px] text-clay-muted mt-2 font-semibold font-sans">
                    No data
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Integrated Quote Carousel at bottom */}
          {quote && (
            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3 relative">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <Quote className="w-4 h-4 text-clay-success shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 font-sans">
                  <p className="text-xs text-clay-text italic leading-relaxed font-medium line-clamp-2">
                    "{quote.content}"
                  </p>
                  <p className="text-[10px] text-[#F7931A] font-bold mt-0.5 font-mono">— {quote.author}</p>
                </div>
              </div>
              <button
                onClick={nextQuote}
                className="p-1.5 rounded-full hover:bg-white/5 text-clay-muted hover:text-clay-primary transition-all shrink-0 cursor-pointer active:scale-90 shadow-sm border border-white/5"
                title="New quote"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 3D Globe Card */}
        {!isMobile && (
          <div
            ref={globeTilt.ref}
            onMouseMove={globeTilt.onMouseMove}
            onMouseLeave={globeTilt.onMouseLeave}
            style={globeTilt.style}
            className="lg:col-span-4 glass-card p-6 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[340px]"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-clay-primary/5 blur-2xl pointer-events-none" />
            
            {/* Globe container */}
            <div
              className="relative flex items-center justify-center p-2 rounded-full shadow-[0_0_40px_rgba(247,147,26,0.12),0_0_80px_rgba(247,147,26,0.06),inset_0_1px_0_rgba(255,255,255,0.08)] border border-[#F7931A]/20"
              style={{
                borderRadius: '50%',
              }}
            >
              <Suspense fallback={<GlobeFallback />}>
                <Globe3D
                  latitude={countryData?.latlng?.[0] ?? null}
                  longitude={countryData?.latlng?.[1] ?? null}
                />
              </Suspense>
            </div>

            {/* Floating Settings Button at bottom right */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="absolute bottom-4 right-4 btn-premium flex items-center gap-1.5 px-3.5 py-2 text-white cursor-pointer font-bold text-xs focus-visible:ring-4 focus-visible:ring-clay-primary/30 focus:outline-none shadow-lg border-none"
              id="dashboard-settings-btn"
              aria-label="Edit profile and goals settings"
            >
              <Settings className="w-3.5 h-3.5 text-white" />
              Settings
            </button>
          </div>
        )}
      </div>

      {/* ── SECTION 2: STATS BANNER (Row 2) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Footprint */}
        <CarbonCard
          label="Today's Footprint"
          value={`${todayKg.toFixed(1)}`}
          subText="kg CO₂"
          accentColor={todayColor}
          trend={todayKg <= dailyGoal ? 'down' : 'up'}
          trendText={
            todayKg < 5 ? 'Low emissions day' :
            todayKg < 10 ? 'Moderate day' :
            todayKg < 20 ? 'High emissions day' : 'Critical — take action!'
          }
        />

        {/* 7-Day Average */}
        <CarbonCard
          label="7-Day Average"
          value={weekAvgKg > 0 ? `${weekAvgKg.toFixed(1)} kg` : '—'}
          subText={`Daily goal: ${dailyGoal} kg`}
          icon={TrendingUp}
          accentColor="#0EA5E9"
          trend={weekAvgKg > 0 ? (weekAvgKg <= dailyGoal ? 'down' : 'up') : undefined}
          trendText={
            weekAvgKg > 0
              ? weekAvgKg <= dailyGoal
                ? `${((dailyGoal - weekAvgKg) / dailyGoal * 100).toFixed(0)}% below target`
                : `${((weekAvgKg - dailyGoal) / dailyGoal * 100).toFixed(0)}% above target`
              : undefined
          }
        />

        {/* Combined Budget Gauge & Streak Card */}
        <div
          ref={goalTilt.ref}
          onMouseMove={goalTilt.onMouseMove}
          onMouseLeave={goalTilt.onMouseLeave}
          style={{
            ...goalTilt.style,
            borderLeft: `3px solid ${goalProgress >= 100 ? '#DB2777' : goalProgress >= 75 ? '#ea580c' : '#10B981'}`,
            animationDelay: '200ms'
          }}
          className="col-span-2 md:col-span-1 glass-card shimmer-container p-5 flex flex-col justify-between animate-fade-in-up"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold text-clay-muted uppercase tracking-widest font-mono">Monthly Budget</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-clay-text font-display">{formatCO2(monthKg)}</span>
                <span className="text-xs text-clay-muted font-medium font-sans">/ {formatCO2(monthlyGoal)}</span>
              </div>
              
              {/* Flame Streak Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#030304]/60 border border-[#F7931A]/35 text-[#F7931A] text-[10px] font-bold rounded-lg font-mono shadow-[0_0_10px_rgba(247,147,26,0.06)] mt-1">
                <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-[#F7931A] fill-[#F7931A]/10' : 'text-gray-600 animate-pulse'}`} />
                <span>{streak} Day Streak</span>
              </div>
            </div>

            {/* Mini EmissionGauge */}
            <div className="shrink-0 scale-90 sm:scale-75 -my-4 sm:-my-6 -mx-2 sm:-mx-4">
              <EmissionGauge
                value={goalProgress}
                max={100}
                label="used"
                levelText={goalProgress >= 100 ? 'exceeded' : 'on track'}
                colorOverride={goalProgress >= 100 ? '#DB2777' : goalProgress >= 75 ? '#ea580c' : '#10B981'}
              />
            </div>
          </div>

          {/* Budget Progress Bar */}
          <div className="mt-2.5">
            <ProgressBar
              value={goalProgress}
              max={100}
              color={goalProgress >= 100 ? 'bg-[#EF4444]' : goalProgress >= 75 ? 'bg-[#EA580C]' : 'bg-[#10B981]'}
            />
            <div className="flex justify-between items-center mt-2 text-[10px] font-sans font-semibold text-clay-muted">
              <span>
                {monthKg >= monthlyGoal ? 'Goal exceeded!' : `${formatCO2(monthlyGoal - monthKg)} remaining`}
              </span>
              <span className="font-mono">
                Daily target: {dailyGoal} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PROFILE COMPLETION BAR ────────────────────────────────── */}
      {profileCompletion < 100 && (
        <div className="glass-card p-5 animate-fade-in-up border-l-4 border-l-[#F7931A] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-clay-warning/5 blur-xl" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F7931A] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F7931A]"></span>
                </span>
                <h2 className="text-sm font-bold text-clay-text font-display">Complete your profile to unlock local tips!</h2>
              </div>
              <p className="text-xs text-clay-muted font-medium font-sans">
                Your profile setup is <span className="font-extrabold text-[#F7931A]">{profileCompletion}%</span> complete. Fill in your details to refine carbon estimates.
              </p>
            </div>
            <div className="flex items-center gap-4 min-w-[200px] sm:justify-end">
              <div className="flex-1 max-w-[150px]">
                <ProgressBar
                  value={profileCompletion}
                  max={100}
                  color="bg-gradient-to-r from-[#EA580C] to-[#F7931A]"
                />
              </div>
              <Link 
                to="/about?tab=profile" 
                className="btn-premium px-4 py-2 text-white font-bold text-xs cursor-pointer shrink-0"
              >
                Complete Setup
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 3: ANALYTICS ROW (Row 3) ──────────────────────── */}
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex gap-2.5 pb-2">
        <button
          type="button"
          onClick={() => setActiveChartTab('trend')}
          className={`flex-1 h-10 px-4 text-xs font-bold rounded-full border transition-all cursor-pointer ${
            activeChartTab === 'trend'
              ? 'btn-premium text-white border-none'
              : 'bg-[#0F1115]/80 text-[#94A3B8] border-white/10 hover:text-white hover:bg-[#0F1115]'
          }`}
        >
          Trend Line
        </button>
        <button
          type="button"
          onClick={() => setActiveChartTab('breakdown')}
          className={`flex-1 h-10 px-4 text-xs font-bold rounded-full border transition-all cursor-pointer ${
            activeChartTab === 'breakdown'
              ? 'btn-premium text-white border-none'
              : 'bg-[#0F1115]/80 text-[#94A3B8] border-white/10 hover:text-white hover:bg-[#0F1115]'
          }`}
        >
          Breakdown
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line chart — 7-day trend */}
        <div className={`${activeChartTab === 'trend' ? 'block' : 'hidden'} lg:block lg:col-span-8 glass-card p-6 animate-fade-in-up`} style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4 font-sans">
            <div>
              <h2 className="text-base font-bold text-clay-text font-display">7-Day Emissions Trend</h2>
              <p className="text-xs text-clay-muted font-semibold mt-0.5 font-sans">Daily CO₂ vs your goal line</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-clay-muted font-bold font-mono">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-clay-primary rounded-full inline-block" />
                Your goal
              </span>
            </div>
          </div>
          {weeklyData.some(d => d.co2 > 0) ? (
            <Suspense fallback={<div className="h-[240px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#F7931A]/20 border-t-[#F7931A] rounded-full animate-spin"></div></div>}>
              <DashboardAreaChart weeklyData={weeklyData} dailyGoal={dailyGoal} onChartClick={() => navigate('/history')} />
            </Suspense>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-clay-muted gap-2 font-sans">
              <Leaf className="w-8 h-8 text-clay-primary animate-clay-breathe" />
              <p className="text-sm font-bold">No data yet — log your first entry!</p>
              <Link to="/calculator" className="text-xs text-clay-primary font-black hover:underline font-mono">
                Open Calculator →
              </Link>
            </div>
          )}
        </div>

        {/* Pie chart — category breakdown this week */}
        <div className={`${activeChartTab === 'breakdown' ? 'block' : 'hidden'} lg:block lg:col-span-4 glass-card p-6 animate-fade-in-up`} style={{ animationDelay: '400ms' }}>
          <div className="mb-4 text-center">
            <h2 className="text-base font-bold text-clay-text font-display">This Week by Category</h2>
            <p className="text-xs text-clay-muted font-semibold mt-0.5 font-sans">Where your emissions are coming from</p>
          </div>
          {catBreakdown.length > 0 ? (
            <Suspense fallback={<div className="h-[240px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#F7931A]/20 border-t-[#F7931A] rounded-full animate-spin"></div></div>}>
              <DashboardPieChart catBreakdown={catBreakdown} />
            </Suspense>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-clay-muted gap-2 font-sans">
              <Leaf className="w-8 h-8 text-clay-primary animate-clay-breathe" />
              <p className="text-sm font-bold">Log activities to see your breakdown.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 4: INTERACTIVE HUB (Row 4) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Quick Log + Eco Tips) */}
        <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
          {/* Quick Log */}
          <div
            ref={quickLogTilt.ref}
            onMouseMove={quickLogTilt.onMouseMove}
            onMouseLeave={quickLogTilt.onMouseLeave}
            style={{
              ...quickLogTilt.style,
              animationDelay: '500ms'
            }}
            className="glass-card p-6 animate-fade-in-up flex-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-clay-warning" />
                <h2 className="text-base font-bold text-white font-display">Quick Log</h2>
                <span className="text-xs text-clay-muted font-medium ml-1 font-sans">— tap to instantly log</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {QUICK_LOGS.map(log => (
                  <QuickLogButton
                    key={log.id}
                    log={log}
                    flashed={flashedId === log.id}
                    onClick={() => handleQuickLog(log)}
                  />
                ))}
              </div>
            </div>
            {flashedId && (
              <div className="mt-3 flex items-center gap-2 text-xs text-clay-success bg-green-50/10 border border-[#10B981]/25 rounded-xl px-3 py-2 animate-fade-in-up font-bold font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Entry logged and saved to your history!
              </div>
            )}
          </div>

          {/* Today's Eco Tips */}
          <div className="animate-fade-in-up space-y-4" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-clay-warning animate-clay-breathe" />
                <h2 className="text-base font-bold text-white font-display">Today's Eco Tips</h2>
                <button
                  type="button"
                  onClick={() => setActiveTipIndex(prev => (prev + 1) % 3)}
                  className="sm:hidden flex items-center justify-center w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:border-[#F7931A]/40 text-[#94A3B8] hover:text-white transition-all active:scale-95 cursor-pointer"
                  title="Show another tip"
                  aria-label="Show next eco tip"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <Link
                to="/tips"
                className="flex items-center gap-1 text-sm font-bold text-[#F7931A] hover:underline transition-colors font-sans"
              >
                See all tips <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {/* Desktop layout */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-3.5">
              {tips3.map((tip, i) => (
                <div key={tip.title} className="w-auto">
                  <DashboardTipCard tip={tip} i={i} impactBadge={IMPACT_BADGE} />
                </div>
              ))}
            </div>
            {/* Mobile layout */}
            <div className="sm:hidden block">
              <DashboardTipCard tip={tips3[activeTipIndex]} i={activeTipIndex} impactBadge={IMPACT_BADGE} />
            </div>
          </div>
        </div>

        {/* Right Column (Achievements) */}
        <div
          ref={achievementsTilt.ref}
          onMouseMove={achievementsTilt.onMouseMove}
          onMouseLeave={achievementsTilt.onMouseLeave}
          style={{
            ...achievementsTilt.style,
            animationDelay: '650ms'
          }}
          className="lg:col-span-5 glass-card p-6 flex flex-col justify-between animate-fade-in-up"
        >
          <div className="space-y-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between flex-wrap gap-3 font-sans">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-clay-primary animate-clay-breathe" />
                <div>
                  <h2 className="text-base font-bold text-white font-display">My Achievements</h2>
                  <p className="text-xs text-clay-muted font-semibold mt-0.5 font-sans">Unlocked milestones</p>
                </div>
              </div>
              <button
                onClick={() => setIsBadgesOpen(true)}
                className="btn-premium flex items-center gap-1.5 px-3 py-1.5 text-white cursor-pointer font-bold text-xs focus-visible:ring-4 focus-visible:ring-[#F7931A]/30 focus:outline-none border-none"
                aria-label={`View All Badges, unlocked ${badges?.length || 0} of 17`}
              >
                View All ({badges?.length || 0}/17)
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges Progress Bar */}
            <div className="bg-[#030304]/40 border border-white/5 rounded-xl p-3">
              <div className="flex justify-between items-center mb-1.5 text-[10px] font-sans font-bold text-clay-muted">
                <span>Badge Completion</span>
                <span className="font-mono text-[#F7931A]">{((badges?.length || 0) / 17 * 100).toFixed(0)}%</span>
              </div>
              <ProgressBar
                value={(badges?.length || 0)}
                max={17}
                color="bg-gradient-to-r from-clay-primary to-clay-success"
              />
            </div>

            {/* Badges Grid (2x2 on desktop / 2-column grid on mobile) */}
            {badges && badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                {badges.slice(0, 4).map(badge => (
                  <DashboardBadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            ) : (
              <div className="bg-[#0F1115]/40 border border-white/5 shadow-inner rounded-xl p-5 text-center text-clay-muted space-y-2 font-sans my-auto">
                <Award className="w-7 h-7 text-clay-muted/30 mx-auto" />
                <p className="text-xs font-bold text-white font-display">No achievements yet</p>
                <p className="text-[10px] leading-relaxed font-medium">
                  Log activities or complete eco tips to earn badges!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* ── PROFILE & GOALS SETTINGS MODAL ───────────────────────── */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md bg-[#0F1115] rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(247,147,26,0.25)] p-6 relative overflow-visible animate-fade-in-up"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#F7931A]/5 blur-2xl" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#EA580C]/5 blur-2xl" />

            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
                <Settings className="w-5 h-5 text-clay-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">Profile & Goals</h2>
                <p className="text-xs text-clay-muted font-bold font-sans">Configure your dashboard preferences</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 relative">
              <div>
                <label htmlFor="settings-name-input" className="block text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-1.5 font-mono">
                  Your Name
                </label>
                <input
                  type="text"
                  id="settings-name-input"
                  value={settingsName}
                  onChange={e => setSettingsName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-12 px-4 focus:outline-none text-sm transition-all font-sans"
                  aria-label="Your name"
                />
              </div>

              <div>
                <label htmlFor="settings-location-input" className="block text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-1.5 font-mono">
                  Location
                </label>
                <LocationAutocomplete
                  id="settings-location-input"
                  value={settingsLocation}
                  onChange={setSettingsLocation}
                  placeholder="e.g. Mumbai, India"
                  className="w-full h-12 px-4 focus:outline-none text-sm transition-all font-sans"
                  showIcon={false}
                  ariaLabel="Location"
                />
              </div>

              <div>
                <label htmlFor="settings-goal-input" className="block text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-1.5 font-mono">
                  Monthly CO₂ Goal (kg)
                </label>
                <input
                  type="number"
                  id="settings-goal-input"
                  min="10"
                  max="5000"
                  value={settingsGoal}
                  onChange={e => setSettingsGoal(e.target.value)}
                  className="w-full h-12 px-4 focus:outline-none text-sm transition-all font-mono"
                  aria-label="Monthly carbon goal in kilograms"
                />
                <p className="text-[10px] text-clay-muted font-bold mt-1.5 font-sans">
                  Global average is ~333 kg CO₂/month. A lower goal helps reduce your impact!
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 font-sans">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="btn-3d-secondary flex-1 h-11 flex items-center justify-center text-xs focus-visible:ring-4 focus-visible:ring-[#F7931A]/30 focus:outline-none"
                  aria-label="Cancel profile changes"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-premium flex-1 h-11 flex items-center justify-center text-xs focus-visible:ring-4 focus-visible:ring-[#F7931A]/30 focus:outline-none border-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-4xl bg-[#0F1115] rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(247,147,26,0.25)] p-6 relative overflow-hidden max-h-[85vh] overflow-y-auto"
          >
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[#F7931A]/5 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-[#EA580C]/5 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
                  <Award className="w-5 h-5 text-clay-primary animate-clay-breathe" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white font-display">Achievements Showcase</h2>
                  <p className="text-xs text-clay-muted font-bold font-sans">You've unlocked {badges?.length || 0} of 17 milestones</p>
                </div>
              </div>
              <button
                onClick={() => setIsBadgesOpen(false)}
                className="btn-premium px-5 py-2 text-white cursor-pointer font-bold text-xs focus-visible:ring-4 focus-visible:ring-clay-primary/30 focus:outline-none border-none"
                aria-label="Close achievements modal"
              >
                Close View
              </button>
            </div>

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
