import { useState, useMemo, useCallback, Fragment } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { formatCO2 } from '../utils/calculations.js'
import {
  Calendar, ChevronLeft, ChevronRight, Download, Trash2,
  Filter, ArrowUpDown, ChevronDown, ChevronUp, AlertCircle,
  Clock, SlidersHorizontal, Eye, ShieldAlert, Sparkles, CheckCircle
} from 'lucide-react'

import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'

// Daily emissions levels mapping
const DAILY_LEVELS = {
  low: { label: 'Low', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
}

function getDailyLevelKey(kg) {
  if (kg < 5) return 'low'
  if (kg < 10) return 'medium'
  if (kg < 20) return 'high'
  return 'critical'
}

function getDayColorClass(kg) {
  if (kg === 0) return 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100'
  if (kg < 5) return 'bg-yellow-100 border-yellow-200 text-yellow-800 hover:bg-yellow-200'
  if (kg < 10) return 'bg-amber-200 border-amber-300 text-amber-800 hover:bg-amber-300'
  if (kg < 20) return 'bg-orange-300 border-orange-400 text-orange-900 hover:bg-orange-400'
  return 'bg-red-500 border-red-600 text-white hover:bg-red-600'
}

function History() {
  const { state, deleteEntry, clearHistory } = useCarbon()
  const { carbonEntries } = state

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text mb-2">My History</h1>
          <p className="text-gray-500 text-sm">Review, analyze, and manage your saved carbon footprint logs.</p>
        </div>
        
        {carbonEntries.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 hover:text-green-700 hover:border-green-300 shadow-sm hover:shadow transition-all cursor-pointer font-semibold text-xs focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
              aria-label="Export carbon logs to CSV"
            >
              <Download className="w-4 h-4 text-gray-500" />
              Export CSV
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 shadow-sm hover:shadow transition-all cursor-pointer font-semibold text-xs focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Days */}
          <div className="glass-card p-4 border-l-[3px] border-l-blue-500 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Days Logged</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{stats.totalEntries}</p>
            <p className="text-[10px] text-gray-400 mt-1">across {groupedByDate.length} calendar days</p>
          </div>

          {/* Card 2: Average Daily */}
          <div className="glass-card p-4 border-l-[3px] border-l-green-600 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Daily Average</p>
            <p className="text-2xl font-black text-green-700 mt-1">{stats.avgDaily} kg</p>
            <p className="text-[10px] text-gray-400 mt-1">CO₂ emissions per day</p>
          </div>

          {/* Card 3: Best Day */}
          <div className="glass-card p-4 border-l-[3px] border-l-emerald-500 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Best Logged Day</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {stats.bestDay ? `${stats.bestDay.co2.toFixed(1)} kg` : '—'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 truncate">
              {stats.bestDay ? new Date(stats.bestDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No logs'}
            </p>
          </div>

          {/* Card 4: Worst Day */}
          <div className="glass-card p-4 border-l-[3px] border-l-red-500 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Worst Logged Day</p>
            <p className="text-2xl font-black text-red-700 mt-1">
              {stats.worstDay ? `${stats.worstDay.co2.toFixed(1)} kg` : '—'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1 truncate">
              {stats.worstDay ? new Date(stats.worstDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No logs'}
            </p>
          </div>

          {/* Card 5: Month Total */}
          <div className="glass-card p-4 border-l-[3px] border-l-purple-500 animate-fade-in-up sm:col-span-2 lg:col-span-1" style={{ animationDelay: '250ms' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Emissions This Month</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{stats.monthTotal} kg</p>
            <p className="text-[10px] text-gray-400 mt-1">carbon output logged</p>
          </div>

        </div>
      ) : (
        <EmptyState
          title="Your carbon log is empty"
          description="No entries have been saved yet. Pop over to the calculator and log some activities to start tracking your daily trends!"
          icon="🌱"
          actionText="Open Carbon Calculator"
          actionLink="/calculator"
        />
      )}

      {/* ── BAR CHART & HEATMAP SECTION ───────────────────────── */}
      {groupedByDate.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Bar Chart — 5/5 width taking full row before Heatmap */}
          <div className="lg:col-span-5 glass-card p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Emissions Trend</h2>
                <p className="text-xs text-gray-400 mt-0.5">Your daily carbon output vs goal</p>
              </div>
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {[7, 14, 30].map(days => (
                  <button
                    key={days}
                    onClick={() => setChartDays(days)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      chartDays === days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" vertical={false} />
                <XAxis dataKey="displayDate" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} unit=" kg" />
                <RechartsTooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-gray-700 mb-1">{label}</p>
                          <p className="font-bold" style={{ color: payload[0].payload.totalCO2 > userGoalDaily ? '#dc2626' : '#16a34a' }}>
                            {payload[0].value.toFixed(2)} kg CO₂
                          </p>
                        </div>
                      )
                    }
                    return null
                  }} 
                />
                <ReferenceLine
                  y={userGoalDaily}
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  label={{ value: 'Daily Goal', position: 'insideTopRight', fill: '#9ca3af', fontSize: 11 }}
                />
                <Bar dataKey="totalCO2" radius={[4, 4, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.totalCO2 > userGoalDaily ? '#ef4444' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Calendar Heatmap — 3/5 width */}
          <div className="lg:col-span-3 glass-card p-6 animate-fade-in-up animate-duration-500">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Monthly Activity Heatmap</h2>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                  className="p-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-green-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus:outline-none"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-gray-700 min-w-28 text-center capitalize">
                  {currentMonthName} {heatmapYear}
                </span>
                <button
                  type="button"
                  onClick={() => handleMonthChange(1)}
                  className="p-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-green-50 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus:outline-none"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</span>
              ))}
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1.5">
              {heatmapData.map((d, index) => {
                if (d.padding) {
                  return <div key={`pad-${index}`} className="aspect-square bg-transparent" />
                }
                const isSelected = selectedHeatmapDate === d.date
                const colorClass = getDayColorClass(d.co2)
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedHeatmapDate(d.date)}
                    className={`aspect-square rounded-lg border transition-all relative flex items-center justify-center text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1 focus:outline-none ${colorClass} ${
                      isSelected ? 'ring-2 ring-green-600 border-green-500 scale-95 shadow' : 'border-gray-200/50'
                    }`}
                    title={`${d.date}: ${d.co2.toFixed(1)} kg CO₂`}
                    aria-label={`Select ${d.date} to view details`}
                  >
                    <span>{d.day}</span>
                    {d.co2 > 0 && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-current opacity-70" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Legend</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-gray-50 border border-gray-200" />
                  <span className="text-[10px] text-gray-500 font-semibold">None</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-yellow-100 border border-yellow-200" />
                  <span className="text-[10px] text-gray-500 font-semibold">Low (&lt;5kg)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-amber-200 border border-amber-300" />
                  <span className="text-[10px] text-gray-500 font-semibold">Mid (5-10kg)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-orange-300 border border-orange-400" />
                  <span className="text-[10px] text-gray-500 font-semibold">High (10-20kg)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-600" />
                  <span className="text-[10px] text-gray-500 font-semibold">Critical (&gt;20kg)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Day Details — 2/5 width */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {selectedDayInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Day Details</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(selectedDayInfo.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  {selectedDayInfo.entries.length > 0 && (
                    <button
                      onClick={(e) => handleDeleteDay(selectedDayInfo.date, e)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                      title="Delete all day entries"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {selectedDayInfo.entries.length > 0 ? (
                  <div className="space-y-4">
                    {/* Circle Gauge for selected day */}
                    <div className="flex items-center gap-4 bg-green-50/40 border border-green-100 rounded-2xl p-4">
                      <div className="w-14 h-14 rounded-full bg-white flex flex-col items-center justify-center border-2 border-green-600 shadow-sm shrink-0">
                        <span className="text-sm font-black text-green-800 leading-none">{selectedDayInfo.totalCO2.toFixed(1)}</span>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase">kg</span>
                      </div>
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DAILY_LEVELS[getDailyLevelKey(selectedDayInfo.totalCO2)].color}`}>
                          {DAILY_LEVELS[getDailyLevelKey(selectedDayInfo.totalCO2)].label} Emissions
                        </span>
                        <p className="text-xs text-gray-500 mt-1.5 leading-normal">
                          Emitted {selectedDayInfo.totalCO2.toFixed(2)} kg CO₂ across {selectedDayInfo.entries.length} logged activities.
                        </p>
                      </div>
                    </div>

                    {/* Breakdown of Categories */}
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Category Breakdown</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Transport */}
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Transport</span>
                          <p className="text-sm font-extrabold text-blue-600 mt-1">{selectedDayInfo.transport.toFixed(1)} kg</p>
                        </div>
                        {/* Energy */}
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Home Energy</span>
                          <p className="text-sm font-extrabold text-amber-600 mt-1">{selectedDayInfo.energy.toFixed(1)} kg</p>
                        </div>
                        {/* Food */}
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Food</span>
                          <p className="text-sm font-extrabold text-green-700 mt-1">{selectedDayInfo.food.toFixed(1)} kg</p>
                        </div>
                        {/* Shopping */}
                        <div className="bg-white border border-gray-100 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Shopping</span>
                          <p className="text-sm font-extrabold text-purple-600 mt-1">{selectedDayInfo.shopping.toFixed(1)} kg</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-400">
                    <p className="text-xs">No logs saved on this day.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 space-y-2.5 my-auto">
                <Clock className="w-8 h-8 mx-auto text-gray-300 animate-pulse" />
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Select a Day</h4>
                <p className="text-xs max-w-[200px] mx-auto leading-relaxed text-gray-400">
                  Click on any day in the heatmap calendar to see its specific footprint breakdown.
                </p>
              </div>
            )}

            {/* Bottom mini tip */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[10px] text-gray-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Target to keep daily emissions under 11kg (Global daily avg).</span>
            </div>
          </div>

        </div>
      )}

      {/* ── FILTERS & DATA TABLE ──────────────────────────────────── */}
      {groupedByDate.length > 0 && (
        <div className="space-y-4">
          
          {/* Title & Filters heading */}
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <SlidersHorizontal className="w-4.5 h-4.5 text-gray-500" />
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Emissions Log</h2>
          </div>

          {/* Filter & Search Bar */}
          <div className="glass-card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
            
            {/* From Date */}
            <div>
              <label htmlFor="history-filter-from" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                From Date
              </label>
              <input
                type="date"
                id="history-filter-from"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all font-medium text-gray-600"
                aria-label="Filter from date"
              />
            </div>

            {/* To Date */}
            <div>
              <label htmlFor="history-filter-to" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                To Date
              </label>
              <input
                type="date"
                id="history-filter-to"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all font-medium text-gray-600"
                aria-label="Filter to date"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="history-filter-category" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                id="history-filter-category"
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all font-semibold text-gray-600 cursor-pointer"
                aria-label="Filter by category"
              >
                <option value="all">All Categories</option>
                <option value="transport">Transport</option>
                <option value="energy">Home Energy</option>
                <option value="food">Food</option>
                <option value="shopping">Shopping</option>
              </select>
            </div>

            {/* Sort Selection */}
            <div>
              <label htmlFor="history-sort-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Sort Options
              </label>
              <select
                id="history-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-green-500 transition-all font-semibold text-gray-600 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest CO₂</option>
                <option value="lowest">Lowest CO₂</option>
              </select>
            </div>

          </div>

          {/* Data list view */}
          {filteredAndSortedDays.length > 0 ? (
            <div className="space-y-3">
              
              {/* Desktop Data Table - hidden on mobile */}
              <div className="hidden md:block overflow-hidden bg-white border border-green-100 rounded-3xl shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-green-50/50 border-b border-green-100 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4 font-bold">Date</th>
                      <th className="px-4 py-4 font-bold">🚗 Transport</th>
                      <th className="px-4 py-4 font-bold">🏠 Energy</th>
                      <th className="px-4 py-4 font-bold">🍽️ Food</th>
                      <th className="px-4 py-4 font-bold">🛍️ Shopping</th>
                      <th className="px-4 py-4 font-bold">Total CO₂</th>
                      <th className="px-4 py-4 font-bold text-center">Level</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAndSortedDays.map(day => {
                      const isExpanded = expandedRow === day.date
                      const levelKey = getDailyLevelKey(day.totalCO2)
                      const level = DAILY_LEVELS[levelKey]
                      return (
                        <Fragment key={day.date}>
                          {/* Row */}
                          <tr
                            onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                            className={`hover:bg-green-50/20 transition-colors cursor-pointer ${
                              isExpanded ? 'bg-green-50/10' : ''
                            }`}
                          >
                            <td className="px-5 py-4 font-bold text-gray-700">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-4 text-gray-500 font-semibold">{day.transport > 0 ? `${day.transport} kg` : '—'}</td>
                            <td className="px-4 py-4 text-gray-500 font-semibold">{day.energy > 0 ? `${day.energy} kg` : '—'}</td>
                            <td className="px-4 py-4 text-gray-500 font-semibold">{day.food > 0 ? `${day.food} kg` : '—'}</td>
                            <td className="px-4 py-4 text-gray-500 font-semibold">{day.shopping > 0 ? `${day.shopping} kg` : '—'}</td>
                            <td className="px-4 py-4 text-green-700 font-black">{day.totalCO2} kg</td>
                            <td className="px-4 py-4 text-center">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${level.color}`}>
                                {level.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                title="View details"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={(e) => handleDeleteDay(day.date, e)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete day logs"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded detail sub-row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan="8" className="bg-gray-50/50 px-6 py-4">
                                <div className="space-y-3 animate-fade-in-up">
                                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Logged Activities Breakdown</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {day.entries.map((entry, idx) => (
                                      <div key={idx} className="bg-white border border-gray-200/50 rounded-xl p-3 flex items-center justify-between shadow-xs">
                                        <div>
                                          <p className="text-xs font-bold text-gray-800">{entry.label}</p>
                                          <div className="flex items-center gap-1.5 mt-1 select-none">
                                            <CategoryBadge category={entry.category} showIcon={true} />
                                            <span className="text-[10px] text-gray-400 font-semibold">Qty: {entry.quantity}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs font-bold text-green-700">{entry.totalCO2.toFixed(2)} kg</p>
                                          <p className="text-[9px] text-gray-400">CO₂</p>
                                        </div>
                                      </div>
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
              <div className="block md:hidden space-y-3">
                {filteredAndSortedDays.map(day => {
                  const isExpanded = expandedRow === day.date
                  const levelKey = getDailyLevelKey(day.totalCO2)
                  const level = DAILY_LEVELS[levelKey]
                  return (
                    <div
                      key={day.date}
                      onClick={() => setExpandedRow(isExpanded ? null : day.date)}
                      className={`glass-card p-4 border-2 transition-all duration-300 ${
                        isExpanded ? 'border-green-300' : 'border-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-800">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${level.color}`}>
                          {level.label}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-gray-400">Total Emissions:</span>
                        <span className="text-base font-black text-green-700">{day.totalCO2} kg CO₂</span>
                      </div>

                      {/* Mini visual summary of categories */}
                      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-500">
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">TRA</p>
                          <p className="font-bold text-blue-600 mt-0.5">{day.transport > 0 ? `${day.transport}k` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">ENE</p>
                          <p className="font-bold text-amber-600 mt-0.5">{day.energy > 0 ? `${day.energy}k` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">FOO</p>
                          <p className="font-bold text-green-700 mt-0.5">{day.food > 0 ? `${day.food}k` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">SHO</p>
                          <p className="font-bold text-purple-600 mt-0.5">{day.shopping > 0 ? `${day.shopping}k` : '—'}</p>
                        </div>
                      </div>

                      {/* Expanded View on Mobile */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2.5 animate-fade-in-up">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Logged Activities</p>
                          <div className="space-y-2">
                            {day.entries.map((entry, idx) => (
                              <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-gray-800 leading-none">{entry.label}</p>
                                  <div className="flex items-center gap-1.5 mt-1 select-none">
                                    <CategoryBadge category={entry.category} showIcon={true} />
                                    <span className="text-[9px] text-gray-400 font-semibold">Qty: {entry.quantity}</span>
                                  </div>
                                </div>
                                <span className="font-bold text-green-700">{entry.totalCO2.toFixed(1)} kg</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => handleDeleteDay(day.date, e)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-[10px] cursor-pointer"
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
        title="🚨 Clear All History? 🚨"
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
    </div>
  )
}

export default History
