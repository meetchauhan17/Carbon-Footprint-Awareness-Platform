import React, { useState, useMemo, useCallback, Fragment, Suspense, lazy } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { formatCO2 } from '../utils/calculations.js'
import {
  Calendar, ChevronLeft, ChevronRight, Download, Trash2,
  ChevronDown, ChevronUp, AlertCircle,
  Clock, SlidersHorizontal, Eye, ShieldAlert, Sparkles,
  Car, Zap, Leaf, ShoppingBag
} from 'lucide-react'

import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import EmojiIcon from '../components/EmojiIcon.jsx'
// Recharts component code-split
const HistoryChart = lazy(() => import('../components/charts/HistoryChart.jsx'));

import { use3DTilt } from '../hooks/use3DTilt.js'

// Daily emissions levels mapping
const DAILY_LEVELS = {
  low: { label: 'Low', color: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' },
  medium: { label: 'Medium', color: 'bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30' },
  high: { label: 'High', color: 'bg-[#F7931A]/15 text-[#F7931A] border border-[#F7931A]/30' },
  critical: { label: 'Critical', color: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' },
}

function getDailyLevelKey(kg) {
  if (kg < 5) return 'low'
  if (kg < 10) return 'medium'
  if (kg < 20) return 'high'
  return 'critical'
}

function getDayColorClass(kg) {
  if (kg === 0) return 'bg-[#0F1115] text-[#94A3B8] border border-white/5 rounded-md hover:border-[#F7931A]/30'
  if (kg < 5) return 'bg-[#10B981]/10 text-white border border-[#10B981]/30 rounded-md hover:border-[#10B981] hover:scale-105'
  if (kg < 10) return 'bg-[#FFD600]/10 text-[#FFD600] border border-[#FFD600]/30 rounded-md hover:border-[#FFD600] hover:scale-105'
  if (kg < 20) return 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/40 rounded-md hover:border-[#F7931A] hover:scale-105'
  return 'bg-[#EA580C]/20 text-[#FFD600] border border-[#EA580C] rounded-md font-bold hover:scale-105 shadow-[0_0_15px_rgba(234,88,12,0.4)]'
}

// 3D Stat Card subcomponent
function StatCard({ label, value, subtext, labelColor = 'text-[#94A3B8]', valueColor = 'text-[#F7931A]', delay = '0ms', className = '' }) {
  const { ref, style, onMouseMove, onMouseLeave } = use3DTilt({ maxTilt: 10, scale: 1.03 })
  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ ...style, animationDelay: delay }}
      className={`glass-card p-6 text-center rounded-2xl flex flex-col justify-center animate-fade-in-up ${className}`}
    >
      <p className={`text-[10px] font-bold ${labelColor} uppercase tracking-wider font-display`}>{label}</p>
      <p className={`text-3xl font-bold ${valueColor} mt-1.5 font-mono`}>{value}</p>
      <p className="text-[10px] text-clay-muted mt-1 font-sans font-medium">{subtext}</p>
    </div>
  )
}

// 3D Calendar Day Cell subcomponent
function CalendarDayCell({ d, isSelected, onClick }) {
  const { ref, style, onMouseMove, onMouseLeave } = use3DTilt({ maxTilt: 20, scale: 1.12, perspective: 400 })
  const colorClass = getDayColorClass(d.co2)
  return (
    <button
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ ...style, transformStyle: 'preserve-3d' }}
      className={`aspect-square rounded-md border-0 transition-all relative flex flex-col items-center justify-center text-xs font-bold cursor-pointer focus:outline-none preserve-3d shadow-[0_4px_10px_rgba(0,0,0,0.4)] ${colorClass} ${
        isSelected ? 'border border-[#F7931A] ring-2 ring-[#F7931A]/50 z-20 shadow-[0_0_15px_rgba(247,147,26,0.5)]' : 'hover:z-10'
      }`}
      title={`${d.date}: ${d.co2.toFixed(1)} kg CO₂`}
      aria-label={`Select ${d.date} to view details`}
    >
      <span className="font-mono" style={{ transform: 'translateZ(12px)', display: 'inline-block' }}>{d.day}</span>
      {d.co2 > 0 && (
        <span 
          className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-70" 
          style={{ transform: 'translateZ(6px)', display: 'inline-block' }}
        />
      )}
    </button>
  )
}

// 3D Activity Breakdown Card subcomponent
function ActivityBreakdownCard({ entry }) {
  const { ref, style, onMouseMove, onMouseLeave } = use3DTilt({ maxTilt: 8, scale: 1.02 })
  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={style}
      className="glass-card p-4 flex items-center justify-between shadow-sm transition-all duration-200"
    >
      <div>
        <p className="text-xs font-bold text-white font-display">{entry.label}</p>
        <div className="flex items-center gap-2 mt-1.5 select-none">
          <CategoryBadge category={entry.category} showIcon={true} />
          <span className="text-[9px] text-clay-muted font-bold font-mono">Qty: {entry.quantity}</span>
        </div>
      </div>
      <div className="text-right font-mono">
        <p className="text-xs font-bold text-[#10B981]">{entry.totalCO2.toFixed(2)} kg</p>
        <p className="text-[9px] text-clay-muted font-bold uppercase tracking-wider">CO₂</p>
      </div>
    </div>
  )
}

function History() {
  const { state, deleteEntry, clearHistory } = useCarbon()
  const { carbonEntries } = state

  // 3D tilt hooks for containers
  const trendChartTilt = use3DTilt({ maxTilt: 3, scale: 1.01 })
  const heatmapContainerTilt = use3DTilt({ maxTilt: 3, scale: 1.005 })
  const selectedDetailsTilt = use3DTilt({ maxTilt: 6, scale: 1.01 })
  const filtersTilt = use3DTilt({ maxTilt: 2, scale: 1.002 })

  // Navigation states for Heatmap
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear())
  const [heatmapMonth, setHeatmapMonth] = useState(new Date().getMonth())
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState(null)

  // Bar Chart State
  const [chartDays, setChartDays] = useState(14)

  // Filtering states
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest') // 'newest' | 'oldest' | 'highest' | 'lowest'

  // Row expansion state
  const [expandedRow, setExpandedRow] = useState(null)

  // ConfirmDialog states
  const [deleteDayDate, setDeleteDayDate] = useState(null)
  const [isClearAllOpen, setIsClearAllOpen] = useState(false)

  // ── 1. Group Carbon Entries by Date (YYYY-MM-DD) ──────────────────────
  const groupedByDate = useMemo(() => {
    const groups = {}
    
    carbonEntries.forEach(entry => {
      const dateKey = entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          transport: 0,
          energy: 0,
          food: 0,
          shopping: 0,
          waste: 0,
          totalCO2: 0,
          entries: []
        }
      }
      
      const cat = entry.category?.toLowerCase()
      if (cat === 'transport') groups[dateKey].transport += entry.totalCO2
      else if (cat === 'energy') groups[dateKey].energy += entry.totalCO2
      else if (cat === 'food') groups[dateKey].food += entry.totalCO2
      else if (cat === 'shopping') groups[dateKey].shopping += entry.totalCO2
      else if (cat === 'waste') groups[dateKey].waste += entry.totalCO2
      
      groups[dateKey].totalCO2 += entry.totalCO2
      groups[dateKey].entries.push(entry)
    })

    // Float rounding
    Object.values(groups).forEach(g => {
      g.transport = parseFloat(g.transport.toFixed(2))
      g.energy = parseFloat(g.energy.toFixed(2))
      g.food = parseFloat(g.food.toFixed(2))
      g.shopping = parseFloat(g.shopping.toFixed(2))
      g.waste = parseFloat(g.waste.toFixed(2))
      g.totalCO2 = parseFloat(g.totalCO2.toFixed(2))
    })

    return Object.values(groups)
  }, [carbonEntries])

  // ── 2. Calculate Dashboard Statistics ────────────────────────────────
  const stats = useMemo(() => {
    const totalEntries = carbonEntries.length
    const totalDays = groupedByDate.length

    if (totalDays === 0) {
      return { totalEntries: 0, bestDay: null, worstDay: null, avgDaily: 0, monthTotal: 0 }
    }

    // Best and Worst
    const sortedByCO2 = [...groupedByDate].sort((a, b) => a.totalCO2 - b.totalCO2)
    const bestDay = sortedByCO2[0]
    const worstDay = sortedByCO2[sortedByCO2.length - 1]

    // Average
    const totalCO2AllTime = groupedByDate.reduce((sum, d) => sum + d.totalCO2, 0)
    const avgDaily = parseFloat((totalCO2AllTime / totalDays).toFixed(1))

    // Monthly Total
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthTotal = parseFloat(
      groupedByDate
        .filter(d => d.date.startsWith(currentMonthStr))
        .reduce((sum, d) => sum + d.totalCO2, 0)
        .toFixed(1)
    )

    return {
      totalEntries,
      bestDay: bestDay ? { date: bestDay.date, co2: bestDay.totalCO2 } : null,
      worstDay: worstDay ? { date: worstDay.date, co2: worstDay.totalCO2 } : null,
      avgDaily,
      monthTotal
    }
  }, [carbonEntries, groupedByDate])

  // ── 3. Apply Filters and Sorting ─────────────────────────────────────
  const filteredAndSortedDays = useMemo(() => {
    let result = [...groupedByDate]

    // Date range filter
    if (fromDate) {
      result = result.filter(day => day.date >= fromDate)
    }
    if (toDate) {
      result = result.filter(day => day.date <= toDate)
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(day => {
        if (categoryFilter === 'transport') return day.transport > 0
        if (categoryFilter === 'energy') return day.energy > 0
        if (categoryFilter === 'food') return day.food > 0
        if (categoryFilter === 'shopping') return day.shopping > 0
        return false
      })
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.date.localeCompare(a.date)
      if (sortBy === 'oldest') return a.date.localeCompare(b.date)
      if (sortBy === 'highest') return b.totalCO2 - a.totalCO2
      if (sortBy === 'lowest') return a.totalCO2 - b.totalCO2
      return 0
    })

    return result
  }, [groupedByDate, fromDate, toDate, categoryFilter, sortBy])

  // ── 4. CSV Exporter ──────────────────────────────────────────────────
  const exportToCSV = useCallback(() => {
    if (groupedByDate.length === 0) return

    const headers = ['Date', 'Transport CO2 (kg)', 'Energy CO2 (kg)', 'Food CO2 (kg)', 'Shopping CO2 (kg)', 'Total CO2 (kg)']
    const rows = groupedByDate.map(d => [
      d.date,
      d.transport,
      d.energy,
      d.food,
      d.shopping,
      d.totalCO2
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `carbonwise_emissions_history_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [groupedByDate])

  // ── 5. Deletion Actions ───────────────────────────────────────────────
  const handleDeleteDay = useCallback((dateKey, e) => {
    if (e) e.stopPropagation()
    setDeleteDayDate(dateKey)
  }, [])

  const handleConfirmDeleteDay = useCallback(() => {
    if (!deleteDayDate) return
    const day = groupedByDate.find(d => d.date === deleteDayDate)
    if (day) {
      day.entries.forEach(entry => deleteEntry(entry.id))
      if (selectedHeatmapDate === deleteDayDate) {
        setSelectedHeatmapDate(null)
      }
    }
    setDeleteDayDate(null)
  }, [deleteDayDate, groupedByDate, deleteEntry, selectedHeatmapDate])

  const handleClearAll = useCallback(() => {
    setIsClearAllOpen(true)
  }, [])

  const handleConfirmClearAll = useCallback(() => {
    clearHistory()
    setSelectedHeatmapDate(null)
    setIsClearAllOpen(false)
  }, [clearHistory])

  // ── 6. Heatmap Calendar Generator ─────────────────────────────────────
  const heatmapData = useMemo(() => {
    // Total days in month
    const daysInMonth = new Date(heatmapYear, heatmapMonth + 1, 0).getDate()
    // First weekday of month (0 = Sun, 6 = Sat)
    const firstWeekday = new Date(heatmapYear, heatmapMonth, 1).getDay()
    
    const days = []
    
    // Padding for calendar start
    for (let i = 0; i < firstWeekday; i++) {
      days.push({ padding: true })
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${heatmapYear}-${String(heatmapMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = groupedByDate.find(g => g.date === dateStr)
      days.push({
        day,
        date: dateStr,
        co2: dayData ? dayData.totalCO2 : 0,
        data: dayData || null
      })
    }

    return days
  }, [heatmapYear, heatmapMonth, groupedByDate])

  const currentMonthName = new Date(heatmapYear, heatmapMonth).toLocaleString('default', { month: 'long' })

  const handleMonthChange = useCallback((dir) => {
    let nextMonth = heatmapMonth + dir
    let nextYear = heatmapYear
    if (nextMonth < 0) {
      nextMonth = 11
      nextYear -= 1
    } else if (nextMonth > 11) {
      nextMonth = 0
      nextYear += 1
    }
    setHeatmapMonth(nextMonth)
    setHeatmapYear(nextYear)
  }, [heatmapMonth, heatmapYear])

  // Find currently selected heatmap day information
  const selectedDayInfo = useMemo(() => {
    if (!selectedHeatmapDate) return null
    return groupedByDate.find(g => g.date === selectedHeatmapDate) || {
      date: selectedHeatmapDate,
      transport: 0, energy: 0, food: 0, shopping: 0, waste: 0, totalCO2: 0, entries: []
    }
  }, [selectedHeatmapDate, groupedByDate])

  // Bar Chart Data Calculation
  const barChartData = useMemo(() => {
    const data = []
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayData = groupedByDate.find(g => g.date === dateStr)
      data.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalCO2: dayData ? dayData.totalCO2 : 0
      })
    }
    return data
  }, [chartDays, groupedByDate])

  const userGoalDaily = (state.userProfile?.monthlyGoal ?? 150) / 30

  return (
    <main id="history-main" aria-label="Carbon footprint history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 font-sans">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight font-display">
            My <span className="gradient-text">History</span>
          </h1>
          <p className="text-clay-muted text-sm mt-1 font-sans font-medium">Review, analyze, and manage your saved carbon footprint logs.</p>
        </div>
        
        {carbonEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-5 h-12 rounded-full border border-white/20 hover:border-white hover:bg-white/5 text-white hover:scale-102 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all cursor-pointer font-display font-bold text-xs"
              aria-label="Export carbon logs to CSV"
            >
              <Download className="w-4 h-4 text-clay-muted" />
              Export CSV
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-5 h-12 bg-gradient-to-r from-[#EA580C] to-[#EF4444] text-white hover:scale-102 active:scale-95 shadow-[0_0_20px_rgba(234,88,12,0.4)] rounded-full transition-all cursor-pointer font-display font-bold text-xs border-0"
              aria-label="Clear all carbon logs from history"
            >
              <ShieldAlert className="w-4 h-4" />
              Clear All History
            </button>
          </div>
        )}
      </div>

      {/* ── SUMMARY CARDS ROW ──────────────────────────────────────── */}
      {groupedByDate.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          
          <StatCard
            label="Entries Logged"
            value={stats.totalEntries}
            subtext={`across ${groupedByDate.length} calendar days`}
            valueColor="text-[#F7931A]"
            delay="50ms"
          />

          <StatCard
            label="Daily Average"
            value={`${stats.avgDaily} kg`}
            subtext="CO₂ emissions per day"
            valueColor="text-[#10B981]"
            delay="100ms"
          />

          <StatCard
            label="Best Logged Day"
            value={stats.bestDay ? `${stats.bestDay.co2.toFixed(1)} kg` : '—'}
            subtext={stats.bestDay ? new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No logs'}
            valueColor="text-[#10B981]"
            delay="150ms"
          />

          <StatCard
            label="Worst Logged Day"
            value={stats.worstDay ? `${stats.worstDay.co2.toFixed(1)} kg` : '—'}
            subtext={stats.worstDay ? new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No logs'}
            valueColor="text-[#EF4444]"
            delay="200ms"
          />

          <StatCard
            label="Emissions This Month"
            value={`${stats.monthTotal} kg`}
            subtext="carbon output logged"
            valueColor="text-[#F7931A]"
            delay="250ms"
            className="col-span-2 sm:col-span-1"
          />

        </div>
      ) : (
        <EmptyState
          title="Your carbon log is empty"
          description="No entries have been saved yet. Pop over to the calculator and log some activities to start tracking your daily trends!"
          icon={Leaf}
          actionText="Open Carbon Calculator"
          actionLink="/calculator"
        />
      )}

      {/* ── BAR CHART & HEATMAP SECTION ───────────────────────── */}
      {groupedByDate.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          <div
            ref={trendChartTilt.ref}
            onMouseMove={trendChartTilt.onMouseMove}
            onMouseLeave={trendChartTilt.onMouseLeave}
            style={trendChartTilt.style}
            className="lg:col-span-5 glass-card p-6 rounded-[32px] animate-fade-in-up"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider font-display">Emissions Trend</h2>
                <p className="text-xs text-clay-muted mt-0.5 font-sans font-medium">Your daily carbon output vs goal</p>
              </div>
              <div className="flex items-center bg-[#0F1115] border border-white/10 rounded-[16px] p-1">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setChartDays(days)}
                    className={`px-4.5 py-2 text-xs font-bold rounded-[12px] transition-all cursor-pointer font-display ${
                      chartDays === days ? 'bg-[#F7931A] text-[#030304] shadow-sm' : 'text-clay-muted hover:text-white border-0 bg-transparent'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
            <Suspense fallback={<div className="h-[260px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#F7931A]/20 border-t-[#F7931A] rounded-full animate-spin"></div></div>}>
              <HistoryChart barChartData={barChartData} userGoalDaily={userGoalDaily} />
            </Suspense>
          </div>

          {/* Calendar Heatmap — 3/5 width */}
          <div
            ref={heatmapContainerTilt.ref}
            onMouseMove={heatmapContainerTilt.onMouseMove}
            onMouseLeave={heatmapContainerTilt.onMouseLeave}
            style={{ ...heatmapContainerTilt.style, transformStyle: 'preserve-3d' }}
            className="lg:col-span-3 glass-card p-6 rounded-[32px] animate-fade-in-up"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 font-display">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F7931A]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Activity Heatmap</h2>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="p-2 rounded-xl bg-black/50 text-[#F7931A] hover:bg-[#F7931A]/10 border border-white/10 hover:border-[#F7931A]/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <span className="text-xs font-bold text-white min-w-28 text-center capitalize font-display">
                  {currentMonthName} {heatmapYear}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="p-2 rounded-xl bg-black/50 text-[#F7931A] hover:bg-[#F7931A]/10 border border-white/10 hover:border-[#F7931A]/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2.5 text-center mb-2 sm:mb-2.5 font-display">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={i} className="text-[10px] font-bold text-clay-muted uppercase tracking-wider">{day}</span>
              ))}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
              {heatmapData.map((d, index) => {
                if (d.padding) {
                  return <div key={`pad-${index}`} className="aspect-square bg-transparent" />
                }
                const isSelected = selectedHeatmapDate === d.date
                return (
                  <CalendarDayCell
                    key={d.date}
                    d={d}
                    isSelected={isSelected}
                    onClick={() => setSelectedHeatmapDate(d.date)}
                  />
                )
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 font-display tracking-widest uppercase">
              <span className="text-[10px] font-bold text-clay-muted uppercase tracking-wider">Legend</span>
              <div className="flex items-center gap-2 sm:gap-3.5 flex-wrap justify-center font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#0F1115] border border-white/5 rounded-md" />
                  <span className="text-[10px] text-clay-muted font-bold">None</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#10B981]/10 border border-[#10B981]/30 rounded-md" />
                  <span className="text-[10px] text-[#10B981] font-bold">Low (&lt;5kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#FFD600]/10 border border-[#FFD600]/30 rounded-md" />
                  <span className="text-[10px] text-[#FFD600] font-bold">Mid (5-10)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#F7931A]/10 border border-[#F7931A]/40 rounded-md" />
                  <span className="text-[10px] text-[#F7931A] font-bold">High (10-20)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 bg-[#EA580C]/20 border border-[#EA580C] rounded-md" />
                  <span className="text-[10px] text-[#FFD600] font-bold">Critical (&gt;20)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Day Details — 2/5 width */}
          <div
            ref={selectedDetailsTilt.ref}
            onMouseMove={selectedDetailsTilt.onMouseMove}
            onMouseLeave={selectedDetailsTilt.onMouseLeave}
            style={{ ...selectedDetailsTilt.style, animationDelay: '100ms' }}
            className="lg:col-span-2 glass-card shadow-[var(--shadow-clay-card)] p-6 flex flex-col justify-between rounded-[32px] animate-fade-in-up"
          >
            {selectedDayInfo ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Day Details</h3>
                    <p className="text-xs text-clay-muted mt-0.5 font-mono">
                      {new Date(selectedDayInfo.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {selectedDayInfo.entries.length > 0 && (
                    <button
                      onClick={(e) => handleDeleteDay(selectedDayInfo.date, e)}
                      className="p-2.5 text-clay-muted hover:text-[#EF4444] hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                      title="Delete all day entries"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {selectedDayInfo.entries.length > 0 ? (
                  <div className="space-y-5">
                    {/* Circle Gauge for selected day */}
                    <div className="flex items-center gap-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4 shadow-sm">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white flex flex-col items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0 font-mono">
                        <span className="text-base font-bold leading-none">{selectedDayInfo.totalCO2.toFixed(1)}</span>
                        <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider">kg</span>
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${DAILY_LEVELS[getDailyLevelKey(selectedDayInfo.totalCO2)].color} shadow-sm`}>
                          {DAILY_LEVELS[getDailyLevelKey(selectedDayInfo.totalCO2)].label} Emissions
                        </span>
                        <p className="text-xs text-clay-muted mt-2 leading-relaxed font-sans font-medium">
                          Emitted {selectedDayInfo.totalCO2.toFixed(2)} kg CO₂ across {selectedDayInfo.entries.length} logged activities.
                        </p>
                      </div>
                    </div>

                    {/* Breakdown of Categories */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-clay-muted uppercase tracking-wider font-display">Category Breakdown</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Transport */}
                        <div className="glass-card p-4 shadow-sm border border-white/5 rounded-2xl">
                          <span className="text-[10px] font-bold text-clay-muted uppercase font-display">Transport</span>
                          <p className="text-base font-bold text-[#0EA5E9] mt-1 font-mono">{selectedDayInfo.transport.toFixed(1)} kg</p>
                        </div>
                        {/* Energy */}
                        <div className="glass-card p-4 shadow-sm border border-white/5 rounded-2xl">
                          <span className="text-[10px] font-bold text-clay-muted uppercase font-display">Home Energy</span>
                          <p className="text-base font-bold text-[#FFD600] mt-1 font-mono">{selectedDayInfo.energy.toFixed(1)} kg</p>
                        </div>
                        {/* Food */}
                        <div className="glass-card p-4 shadow-sm border border-white/5 rounded-2xl">
                          <span className="text-[10px] font-bold text-clay-muted uppercase font-display">Food</span>
                          <p className="text-base font-bold text-[#10B981] mt-1 font-mono">{selectedDayInfo.food.toFixed(1)} kg</p>
                        </div>
                        {/* Shopping */}
                        <div className="glass-card p-4 shadow-sm border border-white/5 rounded-2xl">
                          <span className="text-[10px] font-bold text-clay-muted uppercase font-display">Shopping</span>
                          <p className="text-base font-bold text-[#EF4444] mt-1 font-mono">{selectedDayInfo.shopping.toFixed(1)} kg</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-clay-muted">
                    <p className="text-sm font-medium">No logs saved on this day.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-clay-muted space-y-3.5 my-auto">
                <Clock className="w-10 h-10 mx-auto text-[#94A3B8] animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Select a Day</h3>
                <p className="text-xs max-w-[200px] mx-auto leading-relaxed text-clay-muted font-sans font-medium">
                  Click on any day in the heatmap calendar to see its specific footprint breakdown.
                </p>
              </div>
            )}

            {/* Bottom mini tip */}
            <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center gap-2 text-[10px] text-clay-muted font-sans font-medium">
              <Sparkles className="w-4 h-4 text-[#FFD600] shrink-0" />
              <span>Target to keep daily emissions under 11kg (Global daily avg).</span>
            </div>
          </div>

        </div>
      )}

      {/* ── FILTERS & DATA TABLE ──────────────────────────────────── */}
      {groupedByDate.length > 0 && (
        <div className="space-y-5">
          
          {/* Title & Filters heading */}
          <div className="flex items-center gap-2 pb-2 border-b border-white/5">
            <SlidersHorizontal className="w-4.5 h-4.5 text-clay-muted" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">Emissions Log</h2>
          </div>

          {/* Filter & Search Bar */}
          <div
            ref={filtersTilt.ref}
            onMouseMove={filtersTilt.onMouseMove}
            onMouseLeave={filtersTilt.onMouseLeave}
            style={filtersTilt.style}
            className="glass-card p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 rounded-[32px] animate-fade-in-up"
          >
            
            {/* From Date */}
            <div>
              <label htmlFor="history-filter-from" className="block text-xs font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">
                From Date
              </label>
              <input
                type="date"
                id="history-filter-from"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full h-12 px-4 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
                aria-label="Filter from date"
              />
            </div>

            {/* To Date */}
            <div>
              <label htmlFor="history-filter-to" className="block text-xs font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">
                To Date
              </label>
              <input
                type="date"
                id="history-filter-to"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full h-12 px-4 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
                aria-label="Filter to date"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="history-filter-category" className="block text-xs font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">
                Category
              </label>
              <select
                id="history-filter-category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full h-12 px-4 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-display font-bold focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200 cursor-pointer appearance-none"
                aria-label="Filter by category"
              >
                <option value="all" className="bg-[#0F1115]">All Categories</option>
                <option value="transport" className="bg-[#0F1115]">Transport</option>
                <option value="energy" className="bg-[#0F1115]">Home Energy</option>
                <option value="food" className="bg-[#0F1115]">Food</option>
                <option value="shopping" className="bg-[#0F1115]">Shopping</option>
              </select>
            </div>

            {/* Sort Selection */}
            <div>
              <label htmlFor="history-sort-select" className="block text-xs font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">
                Sort Options
              </label>
              <select
                id="history-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full h-12 px-4 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-display font-bold focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200 cursor-pointer appearance-none"
              >
                <option value="newest" className="bg-[#0F1115]">Newest First</option>
                <option value="oldest" className="bg-[#0F1115]">Oldest First</option>
                <option value="highest" className="bg-[#0F1115]">Highest CO₂</option>
                <option value="lowest" className="bg-[#0F1115]">Lowest CO₂</option>
              </select>
            </div>

          </div>

          {/* Data list view */}
          {filteredAndSortedDays.length > 0 ? (
            <div className="space-y-4">
              
              {/* Desktop Data Table - hidden on mobile */}
              <div className="hidden md:block overflow-hidden bg-[#0F1115] border border-white/10 rounded-3xl shadow-[0_0_20px_rgba(247,147,26,0.05)] p-2">
                <table className="w-full border-collapse text-left text-xs font-sans font-medium">
                  <thead className="bg-[#030304]/60 border-b border-white/5 text-clay-muted uppercase tracking-wider font-display rounded-2xl">
                    <tr>
                      <th className="px-5 py-4 font-bold rounded-l-2xl">Date</th>
                      <th className="px-4 py-4 font-bold">
                        <span className="flex items-center gap-1.5">
                          <EmojiIcon icon={Car} className="w-4 h-4" />
                          Transport
                        </span>
                      </th>
                      <th className="px-4 py-4 font-bold">
                        <span className="flex items-center gap-1.5">
                          <EmojiIcon icon={Zap} className="w-4 h-4" />
                          Energy
                        </span>
                      </th>
                      <th className="px-4 py-4 font-bold">
                        <span className="flex items-center gap-1.5">
                          <EmojiIcon icon={Leaf} className="w-4 h-4" />
                          Food
                        </span>
                      </th>
                      <th className="px-4 py-4 font-bold">
                        <span className="flex items-center gap-1.5">
                          <EmojiIcon icon={ShoppingBag} className="w-4 h-4" />
                          Shopping
                        </span>
                      </th>
                      <th className="px-4 py-4 font-bold">Total CO₂</th>
                      <th className="px-4 py-4 font-bold text-center">Level</th>
                      <th className="px-5 py-4 text-right rounded-r-2xl font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredAndSortedDays.map(day => {
                      const isExpanded = expandedRow === day.date
                      const levelKey = getDailyLevelKey(day.totalCO2)
                      const level = DAILY_LEVELS[levelKey]
                      return (
                        <Fragment key={day.date}>
                          {/* Row */}
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                            className={`hover:bg-[#F7931A]/5 hover:text-white transition-colors cursor-pointer ${
                              isExpanded ? 'bg-[#F7931A]/10 text-white' : ''
                            }`}
                          >
                            <td className="px-5 py-4 font-bold text-white font-display">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-4 text-clay-muted font-bold font-mono">{day.transport > 0 ? `${day.transport} kg` : '—'}</td>
                            <td className="px-4 py-4 text-clay-muted font-bold font-mono">{day.energy > 0 ? `${day.energy} kg` : '—'}</td>
                            <td className="px-4 py-4 text-clay-muted font-bold font-mono">{day.food > 0 ? `${day.food} kg` : '—'}</td>
                            <td className="px-4 py-4 text-clay-muted font-bold font-mono">{day.shopping > 0 ? `${day.shopping} kg` : '—'}</td>
                            <td className="px-4 py-4 text-[#10B981] font-bold font-mono">{day.totalCO2} kg</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm font-mono ${level.color}`}>
                                {level.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                                className="p-2 hover:bg-white/5 rounded-xl text-clay-muted hover:text-[#F7931A] transition-all cursor-pointer border-0 bg-transparent"
                                title="View details"
                              >
                                {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                              </button>
                              <button
                                onClick={(e) => handleDeleteDay(day.date, e)}
                                className="p-2 hover:bg-[#EF4444]/10 rounded-xl text-clay-muted hover:text-[#EF4444] transition-all cursor-pointer border-0 bg-transparent"
                                title="Delete day logs"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail sub-row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="8" className="bg-[#030304]/40 px-6 py-4">
                                <div className="space-y-3.5 animate-fade-in-up">
                                  <h3 className="text-[10px] font-bold text-clay-muted uppercase tracking-wider font-display">Logged Activities Breakdown</h3>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {day.entries.map((entry, idx) => (
                                      <ActivityBreakdownCard key={idx} entry={entry} />
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List - visible on mobile only */}
              <div className="block md:hidden space-y-4">
                {filteredAndSortedDays.map(day => {
                  const isExpanded = expandedRow === day.date
                  const levelKey = getDailyLevelKey(day.totalCO2)
                  const level = DAILY_LEVELS[levelKey]
                  return (
                    <div
                      key={day.date}
                      onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                      className={`glass-card p-5 border transition-all duration-300 rounded-3xl ${
                        isExpanded ? 'border-[#F7931A]/40' : 'border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 font-display">
                        <span className="text-xs font-bold text-white">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm font-mono ${level.color}`}>
                          {level.label}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between font-display">
                        <span className="text-xs text-clay-muted font-medium">Total Emissions:</span>
                        <span className="text-base font-bold text-[#10B981] font-mono">{day.totalCO2} kg CO₂</span>
                      </div>

                      {/* Mini visual summary of categories */}
                      <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/5 text-[10px] text-clay-muted font-mono">
                        <div>
                          <p className="text-[9px] text-clay-muted font-bold uppercase">TRA</p>
                          <p className="font-bold text-[#0EA5E9] mt-0.5">{day.transport > 0 ? `${day.transport.toFixed(1)} kg` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-clay-muted font-bold uppercase">ENE</p>
                          <p className="font-bold text-[#FFD600] mt-0.5">{day.energy > 0 ? `${day.energy.toFixed(1)} kg` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-clay-muted font-bold uppercase">FOO</p>
                          <p className="font-bold text-[#10B981] mt-0.5">{day.food > 0 ? `${day.food.toFixed(1)} kg` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-clay-muted font-bold uppercase">SHO</p>
                          <p className="font-bold text-[#EF4444] mt-0.5">{day.shopping > 0 ? `${day.shopping.toFixed(1)} kg` : '—'}</p>
                        </div>
                      </div>

                      {/* Expanded View on Mobile */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in-up">
                          <p className="text-[9px] font-bold text-clay-muted uppercase tracking-wider font-display">Logged Activities</p>
                          <div className="space-y-2.5">
                            {day.entries.map((entry, idx) => (
                              <ActivityBreakdownCard key={idx} entry={entry} />
                            ))}
                          </div>
                          
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => handleDeleteDay(day.date, e)}
                              className="flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 font-bold text-[10px] cursor-pointer font-display active:scale-95"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Logged Day
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          ) : (
            <EmptyState
              title="No Results Match Filters"
              description="Try modifying your date range or category filters to find matching logs."
              icon={Filter}
            />
          )}

        </div>
      )}

      {/* Clear All History Confirmation Modal */}
      <ConfirmDialog
        isOpen={isClearAllOpen}
        title="Clear All History?"
        message="Are you sure you want to clear ALL logged footprint history? This action is permanent and cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setIsClearAllOpen(false)}
      />

      {/* Delete Day Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDayDate !== null}
        title="Delete Day Logs"
        message={`Are you sure you want to delete all entries logged on ${deleteDayDate}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDeleteDay}
        onCancel={() => setDeleteDayDate(null)}
      />
    </main>
  )
}

export default History
