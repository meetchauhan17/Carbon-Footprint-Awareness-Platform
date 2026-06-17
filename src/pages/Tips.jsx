import { useState, useMemo } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import {
  Search, ArrowUpDown, CheckCircle2, Leaf,
  Award, SearchX, Check, Sparkles, HelpCircle
} from 'lucide-react'

import ProgressBar from '../components/ProgressBar.jsx'
import CategoryBadge from '../components/CategoryBadge.jsx'

const TIPS_DATA = [
  // TRANSPORT (6 tips)
  { id: 't-carpool', title: 'Carpool to work', description: 'Share rides with colleagues. Carpooling halves your transport emissions while cutting fuel costs.', category: 'Transport', co2Saved: 2.4, difficulty: 'easy', icon: '🚗' },
  { id: 't-transit', title: 'Use public transit', description: 'Take buses or trains instead of driving alone. Public transit emits 60-80% less CO₂ per passenger.', category: 'Transport', co2Saved: 4.2, difficulty: 'medium', icon: '🚌' },
  { id: 't-cycle', title: 'Cycle or walk short trips', description: 'Replace car trips under 3 km with cycling or walking to save emissions and get active.', category: 'Transport', co2Saved: 1.2, difficulty: 'easy', icon: '🚲' },
  { id: 't-tire', title: 'Maintain correct tire pressure', description: 'Properly inflated tires improve fuel efficiency by up to 3% and extend tire life.', category: 'Transport', co2Saved: 0.3, difficulty: 'easy', icon: '🛞' },
  { id: 't-errands', title: 'Combine multiple errands', description: 'Plan your route and combine multiple errands into one trip to avoid unnecessary driving.', category: 'Transport', co2Saved: 1.5, difficulty: 'easy', icon: '🗺️' },
  { id: 't-moderate', title: 'Drive at moderate speeds', description: 'Avoid aggressive acceleration and speeding. Driving at moderate speeds improves fuel economy.', category: 'Transport', co2Saved: 0.6, difficulty: 'easy', icon: '⏱️' },

  // HOME ENERGY (7 tips)
  { id: 'e-ac-temp', title: 'Set AC to 24°C instead of 18°C', description: 'Adjust your air conditioning settings. Setting it to 24°C reduces electricity consumption significantly.', category: 'Home Energy', co2Saved: 0.8, difficulty: 'easy', icon: '❄️' },
  { id: 'e-led', title: 'Switch to LED lightbulbs', description: 'Replace old incandescent bulbs with LEDs. LEDs use 75% less energy and last 25× longer.', category: 'Home Energy', co2Saved: 0.5, difficulty: 'easy', icon: '💡' },
  { id: 'e-dryer', title: 'Air-dry laundry instead of tumble dry', description: 'Skip the energy-intensive clothes dryer and air-dry your laundry on a rack or line.', category: 'Home Energy', co2Saved: 2.3, difficulty: 'easy', icon: '👕' },
  { id: 'e-thermostat', title: 'Install a smart thermostat', description: 'Use a programmable thermostat to optimize heating and cooling schedules based on when you are home.', category: 'Home Energy', co2Saved: 1.8, difficulty: 'medium', icon: '🌡️' },
  { id: 'e-unplug', title: 'Unplug standby electronics', description: 'Phantom loads from devices left on standby account for 5-10% of household electricity use.', category: 'Home Energy', co2Saved: 0.4, difficulty: 'easy', icon: '🔌' },
  { id: 'e-cold-wash', title: 'Wash clothes in cold water', description: '90% of a washing machine\'s energy goes to heating water. Wash clothes in cold cycles.', category: 'Home Energy', co2Saved: 0.6, difficulty: 'easy', icon: '🧼' },
  { id: 'e-solar', title: 'Switch to solar energy tariff', description: 'Install solar panels or switch to a utility provider that generates 100% renewable power.', category: 'Home Energy', co2Saved: 5.2, difficulty: 'hard', icon: '☀️' },

  // FOOD (6 tips)
  { id: 'f-meatfree', title: 'One meat-free day per week', description: 'Go vegetarian or vegan one day a week. Reducing meat consumption reduces global greenhouse gases.', category: 'Food', co2Saved: 3.5, difficulty: 'easy', icon: '🥦' },
  { id: 'f-waste', title: 'Reduce food waste', description: 'Plan meals, write shopping lists, and store leftovers properly to prevent food from rotting in landfills.', category: 'Food', co2Saved: 1.1, difficulty: 'easy', icon: '📅' },
  { id: 'f-local', title: 'Buy local and seasonal produce', description: 'Support local farms. Locally sourced food avoids long transport routes and packaging emissions.', category: 'Food', co2Saved: 0.8, difficulty: 'medium', icon: '🍎' },
  { id: 'f-compost', title: 'Compost organic food scraps', description: 'Turn food waste into rich compost rather than throwing it in trash where it creates methane.', category: 'Food', co2Saved: 0.5, difficulty: 'medium', icon: '🍂' },
  { id: 'f-chicken', title: 'Switch beef for chicken', description: 'Replace red meat with lower-impact chicken, pork, or fish. Beef is significantly more carbon-intensive.', category: 'Food', co2Saved: 8.2, difficulty: 'easy', icon: '🍗' },
  { id: 'f-plantbased', title: 'Adopt a plant-based diet', description: 'Eat primarily grains, legumes, vegetables, and fruits. Plant foods have the lowest emissions.', category: 'Food', co2Saved: 4.5, difficulty: 'hard', icon: '🥗' },

  // SHOPPING (6 tips)
  { id: 's-secondhand', title: 'Buy second-hand clothing', description: 'Thrift or buy pre-owned clothing. Extending a garment\'s life by 9 months reduces its footprint by 20-30%.', category: 'Shopping', co2Saved: 8.2, difficulty: 'easy', icon: '👕' },
  { id: 's-bags', title: 'Avoid single-use plastic bags', description: 'Bring your own canvas bag for groceries and shopping to prevent plastic production emissions.', category: 'Shopping', co2Saved: 0.2, difficulty: 'easy', icon: '🛍️' },
  { id: 's-repair', title: 'Repair electronics instead of buying new', description: 'Fix your phone, laptop, or appliances. Extending device lifespans cuts manufacturing emissions.', category: 'Shopping', co2Saved: 50.0, difficulty: 'hard', icon: '🔧' },
  { id: 's-appliances', title: 'Purchase energy-efficient appliances', description: 'Look for ENERGY STAR ratings when replacing old appliances to guarantee low electricity use.', category: 'Shopping', co2Saved: 1.2, difficulty: 'medium', icon: '🔌' },
  { id: 's-rent', title: 'Borrow or rent tools you rarely use', description: 'Instead of purchasing tools or items you\'ll use once, borrow them from a neighbor or rent them.', category: 'Shopping', co2Saved: 15.0, difficulty: 'easy', icon: '🔨' },
  { id: 's-packaging', title: 'Buy products with minimal packaging', description: 'Choose loose produce and items with recyclable or minimal paper packaging.', category: 'Shopping', co2Saved: 0.4, difficulty: 'easy', icon: '📦' },

  // LIFESTYLE (6 tips)
  { id: 'l-tree', title: 'Plant a native tree', description: 'Plant a tree in your yard or support verified tree-planting charities. A single tree offsets ~21kg CO₂/year.', category: 'Lifestyle', co2Saved: 21.0, difficulty: 'medium', icon: '🌳' },
  { id: 'l-shower', title: 'Take shorter showers (under 5 mins)', description: 'Reduce shower time to save water and the gas or electricity required to heat it.', category: 'Lifestyle', co2Saved: 0.9, difficulty: 'easy', icon: '🚿' },
  { id: 'l-paperless', title: 'Opt for paperless bills', description: 'Switch your utility, bank, and mobile statements to digital-only formats to save paper resources.', category: 'Lifestyle', co2Saved: 0.1, difficulty: 'easy', icon: '📄' },
  { id: 'l-browser', title: 'Switch to a green web browser', description: 'Use Ecosia as your search engine. Ecosia uses ad revenue to plant trees around the world.', category: 'Lifestyle', co2Saved: 0.05, difficulty: 'easy', icon: '🌐' },
  { id: 'l-reforest', title: 'Support local reforestation projects', description: 'Contribute to local forest conservation groups that restore native habitats and capture carbon.', category: 'Lifestyle', co2Saved: 50.0, difficulty: 'easy', icon: '🌱' },
  { id: 'l-garden', title: 'Start a home vegetable garden', description: 'Grow your own herbs, greens, or tomatoes. Reduces the carbon footprint of transport packaging.', category: 'Lifestyle', co2Saved: 1.5, difficulty: 'medium', icon: '🏡' }
]

const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'transport', label: 'Transport', icon: '🚗' },
  { id: 'home energy', label: 'Home Energy', icon: '🏠' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🌱' }
]

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 }

const DIFFICULTY_STYLES = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-red-50 text-red-700 border-red-200',
}

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* ── HEADER & PROGRESS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        
        {/* Page Title */}
        <div className="lg:col-span-1 space-y-1 animate-fade-in-up">
          <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full">
            Sustainability Guide
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Eco Action <span className="gradient-text">Tips</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Practical everyday shifts to shrink your ecological footprint.
          </p>
        </div>

        {/* Action Tracker Progress Card */}
        <div className="lg:col-span-2 glass-card p-5 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-green-500/5 blur-xl" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Progress Tracker</p>
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-1.5 mt-0.5">
                <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
                Completed {completedCount} of {totalTipsCount} Actions
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-gray-400">Total Potential Savings</p>
              <p className="text-lg font-extrabold text-green-700 leading-tight">
                {totalSavedCO2} kg CO₂ saved
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <ProgressBar
              value={completionPercentage}
              max={100}
              color="bg-gradient-to-r from-green-500 to-emerald-600"
            />
            <div className="flex justify-between text-[11px] font-medium text-gray-400">
              <span>Getting started 🌱</span>
              <span className="text-green-600 font-bold">{completionPercentage}% completed</span>
              <span>Carbon Hero 🏆</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── FILTERS, SEARCH & SORT ───────────────────────────────── */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        
        {/* Category Pills (Tabs) */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
          {CATEGORY_TABS.map(tab => {
            const count = categoryCounts[tab.id] || 0
            const isActive = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                id={`tips-tab-${tab.id.replace(/\s/g, '-')}`}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
                  isActive
                    ? 'bg-green-600 text-white shadow-md shadow-green-100 border border-green-600'
                    : 'bg-white text-gray-500 hover:text-green-700 hover:bg-green-50 border border-gray-200'
                }`}
                aria-label={`Show ${tab.label} tips, count ${count}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-green-700/60 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search & Sort Panel */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <label htmlFor="tips-search-input" className="sr-only">Search tips</label>
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="tips-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tip titles..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <label htmlFor="tips-sort-select" className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Sort By:</label>
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <select
                id="tips-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all shadow-sm appearance-none cursor-pointer font-medium text-gray-600"
              >
                <option value="co2">CO₂ Saved Impact</option>
                <option value="difficulty">Difficulty (Easy first)</option>
                <option value="category">Category</option>
                <option value="alphabetical">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {/* ── TIPS GRID ────────────────────────────────────────────── */}
      {filteredAndSortedTips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTips.map((tip, i) => {
            const isCompleted = completedTips.includes(tip.id)
            return (
              <div
                key={tip.id}
                id={`tip-card-${tip.id}`}
                className={`flex flex-col justify-between p-5 rounded-3xl border-2 transition-all duration-300 relative group overflow-hidden ${
                  isCompleted
                    ? 'border-green-200 bg-gradient-to-br from-green-50/60 to-emerald-50/60 hover:shadow-md'
                    : 'border-gray-100 bg-white hover:border-green-200 hover:shadow-lg hover:scale-[1.01]'
                } animate-fade-in-up`}
                style={{ animationDelay: `${50 + (i % 6) * 50}ms` }}
              >
                {/* Completed Checkmark Background Watermark */}
                {isCompleted && (
                  <div className="absolute -top-3 -right-3 w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 pointer-events-none">
                    <Check className="w-8 h-8 text-green-600 opacity-20" />
                  </div>
                )}

                {/* Card Content */}
                <div className="space-y-4">
                  {/* Category Pill and Difficulty Badge */}
                  <div className="flex items-center justify-between">
                    <CategoryBadge category={tip.category} showIcon={true} />
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLES[tip.difficulty]}`}>
                      {tip.difficulty}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <span className={`text-3xl shrink-0 p-2.5 rounded-2xl ${
                      isCompleted ? 'bg-white' : 'bg-gray-50 group-hover:bg-green-50 transition-colors'
                    }`}>
                      {tip.icon}
                    </span>
                    <h3 className={`font-extrabold text-sm sm:text-base leading-snug ${
                      isCompleted ? 'text-green-900 line-through decoration-green-600/30' : 'text-gray-800'
                    }`}>
                      {tip.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed ${isCompleted ? 'text-green-800/70' : 'text-gray-500'}`}>
                    {tip.description}
                  </p>
                </div>

                {/* Footer stats & toggle action */}
                <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div className="shrink-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Potential Savings</p>
                    <p className="text-sm font-extrabold text-green-700 leading-none mt-1">
                      Saves {tip.co2Saved} kg CO₂
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleTipCompleted(tip.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
                      isCompleted
                        ? 'bg-green-600 text-white shadow-sm hover:bg-green-700'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50/20'
                    }`}
                    aria-label={`Mark ${tip.title} as ${isCompleted ? 'incomplete' : 'done'}`}
                  >
                    {isCompleted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Completed
                      </>
                    ) : (
                      'Mark as Done'
                    )}
                  </button>
                </div>

              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center max-w-md mx-auto animate-fade-in-up">
          <div className="w-14 h-14 rounded-full bg-green-50 mx-auto flex items-center justify-center mb-4">
            <SearchX className="w-6 h-6 text-green-600 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-gray-800 mb-1">No Tips Found</h3>
          <p className="text-xs text-gray-400">
            We couldn't find any tips matching "{searchQuery}" under {activeCategory === 'all' ? 'all categories' : activeCategory}. Try tweaking your search.
          </p>
        </div>
      )}

    </div>
  )
}

export default Tips
