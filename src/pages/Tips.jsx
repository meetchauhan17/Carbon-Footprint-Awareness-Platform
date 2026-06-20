import { useState, useMemo, memo, useCallback, useRef } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import {
  Search, ArrowUpDown, SearchX, Check, Sparkles,
  Car, Bus, Bike, Settings, Globe, Gauge, Snowflake, Lightbulb, Shirt,
  Thermometer, Plug, Droplets, Sun, Leaf, Calendar, Utensils, Wrench, Package,
  Home, Trophy, Map, Hammer, Salad, ShoppingBag, BookOpen
} from 'lucide-react'

import ProgressBar from '../components/ProgressBar.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'
import EmojiIcon from '../components/EmojiIcon.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'

import { TIPS_DATA } from '../data/tipsData.js'


const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'home energy', label: 'Home Energy', icon: Home },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'lifestyle', label: 'Lifestyle', icon: Leaf }
]

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 }

const DIFFICULTY_STYLES = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-red-50 text-red-700 border-red-200',
}


/**
 * TipCard - Memoized card to prevent re-renders when other tips toggle.
 * 3D tilt is applied only on the first ABOVE_FOLD_COUNT cards (visible on load),
 * and via CSS-only hover lift on the rest — zero JS overhead for off-screen cards.
 */
const ABOVE_FOLD = 6  // cards visible without scrolling on most viewports

const TipCard = memo(function TipCard({ tip, i, isCompleted, toggleTipCompleted, DIFFICULTY_STYLES }) {
  const tilt = use3DTilt({ maxTilt: 10, scale: 1.025 })
  // Only bind tilt JS for above-fold cards — saves 25 rAF loops on first paint
  const aboveFold = i < ABOVE_FOLD
  return (
    <div
      ref={aboveFold ? tilt.ref : undefined}
      onMouseMove={aboveFold ? tilt.onMouseMove : undefined}
      onMouseLeave={aboveFold ? tilt.onMouseLeave : undefined}
      style={aboveFold ? {
        ...tilt.style,
        animationDelay: `${50 + i * 50}ms`,
      } : {
        // Below-fold: no JS animation delay overhead, GPU-composited hover lift only
        contentVisibility: 'auto',
        containIntrinsicSize: '0 300px',
      }}
      className={`glass-card flex flex-col justify-between p-3 sm:p-5 md:p-6 transition-all duration-300 relative group overflow-hidden h-full hover:-translate-y-1 ${
        isCompleted
          ? 'border-[#F7931A] bg-[#F7931A]/5 shadow-[0_0_25px_rgba(247,147,26,0.15)] holo-shine'
          : ''
      } ${aboveFold ? 'animate-fade-in-up' : ''}`}
    >
      {isCompleted && (
        <div className="absolute -top-3 -right-3 w-16 h-16 bg-[#F7931A]/10 flex items-center justify-center translate-x-2 -translate-y-2 pointer-events-none rounded-full">
          <Check className="w-8 h-8 text-[#F7931A] opacity-20" />
        </div>
      )}

      <div className="space-y-2.5 sm:space-y-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5">
          <CategoryBadge category={tip.category} showIcon={true} className="scale-90 origin-left sm:scale-100" />
          <span className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border w-max ${DIFFICULTY_STYLES[tip.difficulty]}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {tip.difficulty}
          </span>
        </div>

        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 sm:gap-3.5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#EA580C]/10 border border-[#EA580C]/30 flex items-center justify-center shrink-0 group-hover:border-[#F7931A]/60 group-hover:shadow-[0_0_15px_rgba(247,147,26,0.3)] transition-all duration-300">
            <EmojiIcon icon={tip.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className={`font-bold text-xs sm:text-base leading-snug tracking-wide font-display ${
            isCompleted ? 'text-clay-muted line-through decoration-[#F7931A]/40' : 'text-white'
          }`}>
            {tip.title}
          </h3>
        </div>

        <p className={`text-[10px] sm:text-xs leading-relaxed ${isCompleted ? 'text-white/60 font-medium' : 'text-clay-muted font-medium'}`}>
          {tip.description}
        </p>
      </div>

      <div className="mt-3 sm:mt-4 pt-3 border-t border-white/5 flex flex-col xs:flex-row xs:items-center justify-between gap-2.5">
        <div className="shrink-0">
          <p className="text-[8px] sm:text-[10px] font-bold text-clay-muted uppercase tracking-wider font-display">Potential Savings</p>
          <p className="text-[10px] sm:text-sm font-bold text-[#F7931A] leading-none mt-1 font-mono">
            Saves {tip.co2Saved} kg
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleTipCompleted(tip.id)}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 h-8 sm:h-10 sm:px-4 rounded-full text-[9px] sm:text-xs font-bold font-display cursor-pointer focus:outline-none transition-all duration-200 w-full xs:w-auto ${
            isCompleted
              ? 'border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20'
              : 'btn-premium'
          }`}
          aria-label={`Mark ${tip.title} as ${isCompleted ? 'incomplete' : 'done'}`}
        >
          {isCompleted ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Completed</span>
            </>
          ) : (
            <>
              <span className="xs:inline hidden">Mark as Done</span>
              <span className="xs:hidden">Done</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
})

function Tips() {
  const { state, toggleTipCompleted } = useCarbon()
  const completedTips = state.completedTips || []

  // UI state
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('co2') // 'co2' | 'difficulty' | 'category' | 'alphabetical'

  // Counts of tips per category for tab pills
  const categoryCounts = useMemo(() => {
    const counts = { all: TIPS_DATA.length }
    TIPS_DATA.forEach(tip => {
      const cat = tip.category.toLowerCase()
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [])

  // Filter & Search & Sort logic
  const filteredAndSortedTips = useMemo(() => {
    let result = [...TIPS_DATA]

    // Category Filter
    if (activeCategory !== 'all') {
      result = result.filter(tip => tip.category.toLowerCase() === activeCategory)
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(tip => tip.title.toLowerCase().includes(query))
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'co2') {
        return b.co2Saved - a.co2Saved // Highest impact first
      }
      if (sortBy === 'difficulty') {
        return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty] // Easy first
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category)
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title)
      }
      return 0
    })

    return result
  }, [activeCategory, searchQuery, sortBy])

  // Progress calculations
  const totalTipsCount = TIPS_DATA.length
  const completedCount = completedTips.length
  const completionPercentage = Math.round((completedCount / totalTipsCount) * 100)

  // Total potential savings of completed tips
  const totalSavedCO2 = useMemo(() => {
    return TIPS_DATA
      .filter(tip => completedTips.includes(tip.id))
      .reduce((sum, tip) => sum + tip.co2Saved, 0)
      .toFixed(1)
  }, [completedTips])

  return (
    <main id="tips-main" aria-label="Eco action tips" className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 md:pb-8 font-sans">
      
      {/* ── HEADER & PROGRESS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Page Title */}
        <div className="lg:col-span-1 space-y-2 animate-fade-in-up">
          <span className="text-[10px] font-bold text-[#F7931A] uppercase tracking-widest bg-[#F7931A]/10 px-2.5 py-1 rounded-full border border-[#F7931A]/20 font-mono">
            Sustainability Guide
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight font-display">
            Eco Action <span className="gradient-text">Tips</span>
          </h1>
          <p className="text-clay-muted text-sm leading-relaxed">
            Practical everyday shifts to shrink your ecological footprint.
          </p>
        </div>

        {/* Action Tracker Progress Card */}
        <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#F7931A]/5 blur-xl" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-bold text-clay-muted uppercase tracking-wider font-display">Your Progress Tracker</p>
              <h2 className="text-lg font-bold text-white flex items-center gap-1.5 mt-0.5 font-display">
                <Sparkles className="w-4.5 h-4.5 text-[#FFD600] animate-[pulse_2s_infinite]" />
                Completed {completedCount} of {totalTipsCount} Actions
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-clay-muted font-display">Total Potential Savings</p>
              <p className="text-lg font-bold text-[#F7931A] leading-tight font-mono">
                {totalSavedCO2} kg CO₂ saved
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <ProgressBar
              value={completionPercentage}
              max={100}
              color="bg-gradient-to-r from-[#EA580C] to-[#F7931A]"
            />
            <div className="flex justify-between text-[11px] font-bold text-clay-muted font-display">
              <span className="flex items-center gap-1">Getting started <EmojiIcon icon={Leaf} className="w-3.5 h-3.5" /></span>
              <span className="text-[#F7931A] font-bold font-mono">{completionPercentage}% completed</span>
              <span className="flex items-center gap-1">Carbon Hero <EmojiIcon icon={Trophy} className="w-3.5 h-3.5" /></span>
            </div>
          </div>
        </div>

      </div>

      {/* ── FILTERS, SEARCH & SORT ───────────────────────────────── */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        
        {/* Category Pills (Tabs) */}
        <div className="flex overflow-x-auto pb-3 border-b border-white/5 no-scrollbar whitespace-nowrap gap-2 snap-x snap-proximity scroll-smooth">
          {CATEGORY_TABS.map(tab => {
            const count = categoryCounts[tab.id] || 0
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                id={`tips-tab-${tab.id.replace(/\s/g, '-')}`}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide cursor-pointer focus:outline-none transition-all duration-200 shrink-0 snap-start hover:scale-102 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#EA580C] to-[#F7931A] text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                    : 'bg-[#0F1115] text-[#94A3B8] hover:text-white border border-white/10 hover:border-[#F7931A]/40'
                }`}
                aria-label={`Show ${tab.label} tips, count ${count}`}
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                <EmojiIcon icon={tab.icon} className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                  isActive ? 'bg-white/30 text-white' : 'bg-black/40 text-clay-muted'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Sort Panel */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="tips-search-input" className="sr-only">Search tips</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-clay-muted pointer-events-none" />
            <input
              type="text"
              id="tips-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tip titles..."
              className="w-full pl-10 pr-4 py-3 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto">
            <label htmlFor="tips-sort-select" className="text-[10px] font-bold text-clay-muted uppercase tracking-wider shrink-0 font-display">Sort By:</label>
            <div className="relative flex-1 sm:flex-initial">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-clay-muted pointer-events-none" />
              <select
                id="tips-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-3 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200 appearance-none cursor-pointer font-bold font-display"
              >
                <option value="co2" className="bg-[#0F1115]">CO₂ Saved Impact</option>
                <option value="difficulty" className="bg-[#0F1115]">Difficulty (Easy first)</option>
                <option value="category" className="bg-[#0F1115]">Category</option>
                <option value="alphabetical" className="bg-[#0F1115]">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* ── TIPS GRID ────────────────────────────────────────────── */}
      {filteredAndSortedTips.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {filteredAndSortedTips.map((tip, i) => {
            const isCompleted = completedTips.includes(tip.id)
            return (
              <TipCard
                key={tip.id}
                tip={tip}
                i={i}
                isCompleted={isCompleted}
                toggleTipCompleted={toggleTipCompleted}
                DIFFICULTY_STYLES={DIFFICULTY_STYLES}
              />
            )
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center max-w-md mx-auto animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 mx-auto flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(247,147,26,0.1)]">
            <SearchX className="w-6 h-6 text-[#F7931A] animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white mb-1 font-display">No Tips Found</h3>
          <p className="text-xs text-clay-muted font-medium">
            We couldn't find any tips matching "{searchQuery}" under {activeCategory === 'all' ? 'all categories' : activeCategory}. Try tweaking your search.
          </p>
        </div>
      )}

    </main>
  )
}

export default Tips
