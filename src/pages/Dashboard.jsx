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
      className="flex items-center gap-3.5 p-3.5 bg-[#0F1115] border border-white/10 rounded-2xl animate-fade-in-up transition-all shadow-[0_0_20px_rgba(247,147,26,0.05)] holo-shine"
    >
      <span className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-[#030304] border border-[#F7931A]/20 shadow-[0_0_10px_rgba(247,147,26,0.06)]">
        <EmojiIcon icon={badge.icon} className="w-6 h-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white truncate font-display">{badge.name}</p>
        <p className="text-[10px] text-clay-muted font-medium truncate mt-0.5 font-sans">{badge.description}</p>
        <span className="text-[9px] font-bold text-[#10B981] bg-[#030304] border border-[#10B981]/25 px-2.5 py-0.5 rounded-md mt-1.5 inline-block shadow-sm font-mono">
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
      className="glass-card p-5 group animate-fade-in-up flex flex-col justify-between"
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

  // 3D tilt interaction hooks for dashboard containers
  const weatherTilt = use3DTilt({ maxTilt: 8, scale: 1.015 })
  const countryTilt = use3DTilt({ maxTilt: 8, scale: 1.015 })
  const quickLogTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })
  const goalTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })
  const achievementsTilt = use3DTilt({ maxTilt: 4, scale: 1.01 })
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState(userProfile?.name || '')
  const [settingsLocation, setSettingsLocation] = useState(userProfile?.location || '')
  const [settingsGoal, setSettingsGoal] = useState(monthlyGoal)

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

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="animate-fade-in-up">
        {/* Hero: Greeting + Globe side-by-side on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">

          {/* Left: text content */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 flex-1">
            <div className="space-y-1">
              <p className="text-xs font-bold text-clay-primary uppercase tracking-widest bg-clay-primary/10 px-3 py-1 rounded-full border border-clay-primary/20 inline-block font-mono">
                {greeting}{userName ? `, ${userName}` : ''}!
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#FFFFFF] leading-tight font-display">
                Here's your carbon snapshot <span className="gradient-text inline-flex items-center gap-1"><EmojiIcon icon={Leaf} className="w-8 h-8" /></span>
              </h1>
              <p className="text-clay-muted text-sm font-semibold font-sans">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap font-mono">
            {betterThanPct !== null && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0F1115] border border-[#F7931A]/35 text-[#F7931A] text-xs font-bold rounded-full select-none uppercase tracking-wider shadow-[0_0_12px_rgba(247,147,26,0.1)]">
                <Award className="w-4 h-4 text-clay-primary" />
                <span>
                  Better than {betterThanPct}% of users
                </span>
              </div>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="btn-premium flex items-center gap-2 px-5 py-2.5 text-white cursor-pointer font-bold text-xs focus-visible:ring-4 focus-visible:ring-clay-primary/30 focus:outline-none"
              id="dashboard-settings-btn"
              aria-label="Edit profile and goals settings"
            >
              <Settings className="w-4 h-4 text-white" />
              Edit Profile
            </button>
            </div>
          </div>{/* end left text */}

          {/* Right: 3D Globe — lazy-loaded, shown only on Dashboard */}
          <div className="flex justify-center lg:justify-end lg:shrink-0">
            <div
              className="glass-card p-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, rgba(15,17,21,0.95) 0%, rgba(8,10,15,0.98) 100%)',
                boxShadow: '0 0 40px rgba(247,147,26,0.12), 0 0 80px rgba(247,147,26,0.06), inset 0 1px 0 rgba(255,255,255,0.08)',
                border: '1px solid rgba(247,147,26,0.2)',
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
          </div>
        </div>{/* end hero flex row */}

        {/* Profile Completion Motivational Bar */}
        {profileCompletion < 100 && (
          <div className="glass-card p-5 mb-6 animate-fade-in-up border-l-4 border-l-[#F7931A] relative overflow-hidden">
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

        {/* Hero metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Today */}
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

          {/* Weekly avg */}
          <CarbonCard
            label="7-Day Average"
            value={weekAvgKg > 0 ? `${weekAvgKg.toFixed(1)} kg` : '—'}
            subText={`Daily goal: ${dailyGoal} kg`}
            icon={TrendingUp}
            accentColor="#0EA5E9"
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
            accentColor={goalProgress >= 100 ? '#DB2777' : goalProgress >= 75 ? '#ea580c' : '#10B981'}
            delay={200}
          >
            <ProgressBar
              value={goalProgress}
              max={100}
              className="mt-3"
              color={goalProgress >= 100 ? 'bg-[#EF4444]' : goalProgress >= 75 ? 'bg-[#EA580C]' : 'bg-[#10B981]'}
            />
            <p className="text-[10px] text-clay-muted font-bold mt-1.5 font-sans">{goalProgress.toFixed(0)}% of monthly budget used</p>
          </CarbonCard>
        </div>

        {/* ── WEATHER + COUNTRY ROW ─────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weather Widget */}
          <div
            ref={weatherTilt.ref}
            onMouseMove={weatherTilt.onMouseMove}
            onMouseLeave={weatherTilt.onMouseLeave}
            style={weatherTilt.style}
            className="glass-card shimmer-container p-5 relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-sky-500/5 blur-xl" />
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center shrink-0 border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
                {weatherLoading ? (
                  <CloudSun className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : (
                  <Thermometer className="w-5 h-5 text-sky-500" />
                )}
              </div>
              <div className="flex-1 min-w-0 font-sans">
                {weatherLoading ? (
                  <div className="space-y-1.5 font-sans">
                    <div className="h-4 w-24 bg-gray-100/5 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-50/5 rounded animate-pulse" />
                  </div>
                ) : temperature !== null ? (
                  <>
                    <div className="flex items-baseline gap-1.5 font-sans">
                      <span className="text-xl font-bold text-white font-display">{temperature}°C</span>
                      <span className="text-xs text-clay-muted font-medium">{resolvedCity}</span>
                    </div>
                    {weatherTip && (
                      <p className="text-xs text-sky-400 mt-1 leading-relaxed font-semibold flex items-center gap-1 font-sans">
                        <EmojiIcon icon={weatherTip.icon} className="w-4 h-4" />
                        {weatherTip.message}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-clay-muted font-bold">Weather data unavailable</p>
                )}
              </div>
            </div>
            {weatherTip && temperature !== null && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 font-sans">
                <EmojiIcon icon={Lightbulb} className="w-3.5 h-3.5" />
                <p className="text-[10px] text-clay-muted font-bold">
                  <span className="text-white">{weatherTip.savings}</span>
                </p>
              </div>
            )}
          </div>

          {/* Country Comparison Widget */}
          <div
            ref={countryTilt.ref}
            onMouseMove={countryTilt.onMouseMove}
            onMouseLeave={countryTilt.onMouseLeave}
            style={countryTilt.style}
            className="glass-card shimmer-container p-5 relative overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full bg-violet-500/5 blur-xl" />
            <div className="flex items-center gap-3 relative">
              <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center shrink-0 border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
                <Globe className="w-5 h-5 text-clay-primary" />
              </div>
              <div className="flex-1 min-w-0 font-sans">
                {countryLoading ? (
                  <div className="space-y-1.5 font-sans">
                    <div className="h-4 w-28 bg-gray-100/5 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-gray-50/5 rounded animate-pulse" />
                  </div>
                ) : motivationalMsg ? (
                  <>
                    <div className="flex items-center gap-2 font-sans">
                      {countryData?.flag && (
                        <img src={countryData.flag} alt={`${motivationalMsg.country} flag`} className="w-5 h-3.5 rounded-sm object-cover shadow-sm" />
                      )}
                      <span className="text-sm font-bold text-white font-display">{motivationalMsg.country}</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#030304] text-[#FFD600] font-bold border border-[#FFD600]/25 shadow-[0_0_10px_rgba(255,214,0,0.06)] font-mono">
                        {co2PerCapita} t/yr per capita
                      </span>
                    </div>
                    <p className="text-xs text-clay-primary mt-1.5 font-bold font-sans">
                      {motivationalMsg.text} — you're at {formatCO2(monthKg)}/month
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-white font-display">Country Comparison</p>
                    <p className="text-xs text-clay-muted mt-1 font-semibold font-sans">
                      Set your location in{' '}
                      <Link to="/about?tab=profile" className="text-clay-primary underline underline-offset-2 font-bold">
                        Profile
                      </Link>{' '}
                      to see your country's CO₂ average
                    </p>
                  </>
                )}
              </div>
            </div>
            {motivationalMsg && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1 font-sans">
                <EmojiIcon icon={BarChart2} className="w-3.5 h-3.5" />
                <p className="text-[10px] text-clay-muted font-bold">
                  <span className="text-white">{motivationalMsg.detail}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CHARTS ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart — 7-day trend */}
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
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
        <div className="glass-card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
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

      {/* ── QUICK LOG + GOALS ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick log — 3/5 width */}
        <div
          ref={quickLogTilt.ref}
          onMouseMove={quickLogTilt.onMouseMove}
          onMouseLeave={quickLogTilt.onMouseLeave}
          style={{
            ...quickLogTilt.style,
            animationDelay: '500ms'
          }}
          className="lg:col-span-3 glass-card p-6 animate-fade-in-up"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-clay-warning" />
            <h2 className="text-base font-bold text-white font-display">Quick Log</h2>
            <span className="text-xs text-clay-muted font-medium ml-1 font-sans">— tap to instantly log an activity</span>
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
            <div className="mt-3 flex items-center gap-2 text-xs text-clay-success bg-green-50/10 border border-[#10B981]/25 rounded-xl px-3 py-2 animate-fade-in-up font-bold font-sans">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Entry logged and saved to your history!
            </div>
          )}
        </div>

        {/* Goals — 2/5 width */}
        <div
          ref={goalTilt.ref}
          onMouseMove={goalTilt.onMouseMove}
          onMouseLeave={goalTilt.onMouseLeave}
          style={{
            ...goalTilt.style,
            animationDelay: '600ms'
          }}
          className="lg:col-span-2 glass-card p-6 animate-fade-in-up"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-clay-primary" />
            <h2 className="text-base font-bold text-white font-display">Monthly Goal</h2>
          </div>

          <div className="flex justify-center mb-4">
            <EmissionGauge
              value={goalProgress}
              max={100}
              label="used"
              levelText={goalProgress >= 100 ? 'exceeded' : 'on track'}
              colorOverride={goalProgress >= 100 ? '#DB2777' : goalProgress >= 75 ? '#ea580c' : '#10B981'}
              className="scale-75 -my-6"
            />
          </div>

          <div className="space-y-2 text-xs font-bold" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <div className="flex justify-between">
              <span className="text-clay-muted">Current</span>
              <span className="text-clay-text">{formatCO2(monthKg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-clay-muted">Goal</span>
              <span className="text-clay-text">{formatCO2(monthlyGoal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-clay-muted">Remaining</span>
              <span className={`${monthKg >= monthlyGoal ? 'text-clay-secondary font-black' : 'text-clay-success font-black'}`}>
                {monthKg >= monthlyGoal ? 'Goal exceeded!' : formatCO2(monthlyGoal - monthKg)}
              </span>
            </div>
          </div>

          {/* Streak */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-[#F7931A]' : 'text-gray-600 animate-pulse'}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-white font-sans">
                {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} below goal!` : 'No streak yet'}
              </p>
              <p className="text-[10px] text-clay-muted font-medium mt-0.5 font-sans">
                {streak > 0 ? 'Keep it up — you\'re on a roll' : 'Log entries to start a streak'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACHIEVEMENTS ──────────────────────────────────────────── */}
      <div
        ref={achievementsTilt.ref}
        onMouseMove={achievementsTilt.onMouseMove}
        onMouseLeave={achievementsTilt.onMouseLeave}
        style={{
          ...achievementsTilt.style,
          animationDelay: '650ms'
        }}
        className="glass-card p-6 animate-fade-in-up"
      >
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5 font-sans">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-clay-primary animate-clay-breathe" />
            <div>
              <h2 className="text-base font-bold text-white font-display">My Achievements</h2>
              <p className="text-xs text-clay-muted font-semibold mt-0.5 font-sans">Track your unlocked badges and eco-milestones</p>
            </div>
          </div>
          <button
            onClick={() => setIsBadgesOpen(true)}
            className="btn-premium flex items-center gap-1.5 px-4 py-2 text-white cursor-pointer font-bold text-xs focus-visible:ring-4 focus-visible:ring-[#F7931A]/30 focus:outline-none border-none"
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
              <DashboardBadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        ) : (
          <div className="bg-[#0F1115]/40 border border-white/5 shadow-inner rounded-xl p-6 text-center text-clay-muted space-y-2 max-w-md mx-auto font-sans">
            <Award className="w-8 h-8 text-clay-muted/30 mx-auto" />
            <p className="text-xs font-bold text-white font-display">No achievements unlocked yet</p>
            <p className="text-[10px] leading-relaxed font-medium">
              Log activities in the Carbon Calculator or mark eco tips as done to unlock badges!
            </p>
          </div>
        )}
      </div>

      {/* ── DAILY ECO TIPS PREVIEW ────────────────────────────────── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '700ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-clay-warning" />
            <h2 className="text-base font-bold text-white font-display">Today's Eco Tips</h2>
          </div>
          <Link
            to="/tips"
            className="flex items-center gap-1 text-sm font-bold text-[#F7931A] hover:underline transition-colors font-sans"
          >
            See all tips <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tips3.map((tip, i) => (
            <DashboardTipCard key={tip.title} tip={tip} i={i} impactBadge={IMPACT_BADGE} />
          ))}
        </div>
      </div>

      {/* ── ENVIRONMENTAL QUOTE ──────────────────────────────── */}
      {quote && (
        <div className="glass-card shimmer-container p-5 relative overflow-hidden border-l-4 border-l-[#10B981] animate-fade-in-up" style={{ animationDelay: '750ms' }}>
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#10B981]/5 blur-xl animate-pulse" />
          <div className="flex items-start gap-3 relative">
            <div className="w-10 h-10 rounded-lg bg-[#030304] flex items-center justify-center shrink-0 border border-white/5 shadow-[0_0_12px_rgba(247,147,26,0.05)]">
              <Quote className="w-4 h-4 text-[#F7931A]" />
            </div>
            <div className="flex-1 min-w-0 font-sans">
              <p className="text-sm text-clay-text italic leading-relaxed font-medium">
                "{quote.content}"
              </p>
              <p className="text-xs text-[#F7931A] font-bold mt-1.5 font-mono">— {quote.author}</p>
            </div>
            <button
              onClick={nextQuote}
              className="p-1.5 rounded-full hover:bg-white/5 text-clay-muted hover:text-clay-primary transition-all shrink-0 cursor-pointer active:scale-90 shadow-sm"
              title="New quote"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
