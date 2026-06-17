import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import {
  Car, Zap, Utensils, ShoppingBag, ChevronRight, ChevronLeft,
  Plus, Trash2, CheckCircle2, AlertCircle, Leaf,
  Plane, Train, Bus, Bike, Flame, Droplets,
} from 'lucide-react'
import { useCarbon } from '../context/CarbonContext.jsx'
import EmissionGauge from '../components/EmissionGauge.jsx'
import {
  calculateTransport, calculateEnergy, calculateShopping,
  getCategoryColor, EMISSION_FACTORS,
} from '../utils/carbonCalculator.js'

// ─── Constants ────────────────────────────────────────────────────────

const TRANSPORT_OPTIONS = Object.entries(EMISSION_FACTORS.transport).map(([key, v]) => ({
  key, label: v.label, factor: v.factor,
}))

// Meal CO₂ per meal (pre-defined per-serving estimates)
const MEAL_TYPES = [
  { key: 'vegan',        label: 'Vegan',          co2: 0.5,  icon: '🥗', color: '#16a34a' },
  { key: 'vegetarian',   label: 'Vegetarian',      co2: 0.8,  icon: '🥦', color: '#22c55e' },
  { key: 'chicken',      label: 'Chicken / Poultry',co2: 1.4,  icon: '🍗', color: '#ca8a04' },
  { key: 'fish',         label: 'Fish / Seafood',  co2: 1.0,  icon: '🐟', color: '#0ea5e9' },
  { key: 'red_meat',     label: 'Red Meat',        co2: 4.0,  icon: '🥩', color: '#dc2626' },
]

// Daily global average: 4000 kg/year / 365 = ~10.96 kg/day
const GLOBAL_DAILY_AVG_KG = parseFloat((4000 / 365).toFixed(2))

// Per-step color thresholds (daily kg CO₂)
function getDailyLevel(kg) {
  if (kg < 5)  return { label: 'Low',      color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  }
  if (kg < 10) return { label: 'Moderate', color: '#ca8a04', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  }
  if (kg < 20) return { label: 'High',     color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
  return          { label: 'Critical',  color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    }
}

const STEPS = [
  { id: 1, label: 'Transport',  icon: Car      },
  { id: 2, label: 'Energy',     icon: Zap      },
  { id: 3, label: 'Food',       icon: Utensils },
  { id: 4, label: 'Shopping',   icon: ShoppingBag },
]



// ─── Progress Bar ─────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((s, i) => {
          const done    = step > s.id
          const current = step === s.id
          const Icon    = s.icon
          return (
            <div key={s.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className={`flex flex-col items-center gap-1 ${i === 0 ? '' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done    ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-200' :
                  current ? 'bg-white border-green-600 text-green-600 shadow-md shadow-green-200' :
                            'bg-white border-gray-200 text-gray-400'
                }`}>
                  {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${
                  current ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400'
                }`}>{s.label}</span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
                  style={{ background: step > s.id ? '#16a34a' : '#e5e7eb' }} />
              )}
            </div>
          )
        })}
      </div>
      {/* Percentage */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-green-700 w-10 text-right">
          {Math.round(((step - 1) / total) * 100)}%
        </span>
      </div>
    </div>
  )
}

// ─── Live CO2 Badge ───────────────────────────────────────────────────

function LiveCO2({ kg, label = 'Running total' }) {
  const level = getDailyLevel(kg)
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${level.bg} ${level.border} transition-all`}>
      <Leaf className={`w-4 h-4 ${level.text}`} />
      <span className={`text-sm font-semibold ${level.text}`}>{label}:</span>
      <span className={`text-sm font-bold ${level.text}`}>{kg.toFixed(2)} kg CO₂</span>
    </div>
  )
}

// ─── Counter Input (+ / −) ────────────────────────────────────────────

function CounterInput({ value, onChange, min = 0, max = 99, label, unit }) {
  return (
    <div>
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all cursor-pointer font-bold text-lg leading-none focus-visible:ring-2 focus-visible:ring-green-500 focus:outline-none"
          aria-label={`Decrease ${label || 'value'}`}
        >−</button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
        </div>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all cursor-pointer font-bold text-lg leading-none focus-visible:ring-2 focus-visible:ring-green-500 focus:outline-none"
          aria-label={`Increase ${label || 'value'}`}
        >+</button>
      </div>
    </div>
  )
}

// ─── Step 1: Transport ────────────────────────────────────────────────

function StepTransport({ trips, setTrips }) {
  const addTrip = useCallback(() => setTrips(prev => [...prev, { id: Date.now(), mode: 'car_petrol', km: '' }]), [setTrips])
  const removeTrip = useCallback((id) => setTrips(prev => prev.filter(t => t.id !== id)), [setTrips])
  const updateTrip = useCallback((id, field, val) =>
    setTrips(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t)), [setTrips])

  const runningTotal = useMemo(() =>
    trips.reduce((sum, t) => sum + calculateTransport(t.mode, parseFloat(t.km) || 0), 0),
    [trips])

  const modeIcon = (mode) => {
    if (mode.startsWith('car'))    return <Car className="w-4 h-4" />
    if (mode === 'bus')            return <Bus className="w-4 h-4" />
    if (mode === 'train')          return <Train className="w-4 h-4" />
    if (mode.startsWith('flight')) return <Plane className="w-4 h-4" />
    if (mode === 'motorbike')      return <Bike className="w-4 h-4" />
    return <Car className="w-4 h-4" />
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Transport</h2>
        <p className="text-sm text-gray-500">Log every trip you made today</p>
      </div>

      <div className="space-y-3">
        {trips.map((trip, i) => (
          <div key={trip.id}
            className="glass-card p-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Trip {i + 1}</span>
              {trips.length > 1 && (
                <button type="button" onClick={() => removeTrip(trip.id)}
                  className="ml-auto p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
                  aria-label={`Remove trip ${i + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Mode */}
              <div>
                <label htmlFor={`trip-select-${trip.id}`} className="block text-xs font-medium text-gray-600 mb-1.5">Vehicle type</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {modeIcon(trip.mode)}
                  </div>
                  <select
                    id={`trip-select-${trip.id}`}
                    value={trip.mode}
                    onChange={e => updateTrip(trip.id, 'mode', e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent bg-white text-gray-800"
                    aria-label={`Vehicle type for trip ${i + 1}`}
                  >
                    {TRANSPORT_OPTIONS.map(o => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* km */}
              <div>
                <label htmlFor={`trip-km-${trip.id}`} className="block text-xs font-medium text-gray-600 mb-1.5">
                  Distance (km)
                </label>
                <input
                  type="number" min="0" step="0.1"
                  id={`trip-km-${trip.id}`}
                  value={trip.km}
                  onChange={e => updateTrip(trip.id, 'km', e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent bg-white text-gray-800 placeholder:text-gray-300"
                  aria-label={`Distance in kilometers for trip ${i + 1}`}
                />
              </div>
            </div>
            {/* Per-trip CO2 chip */}
            {parseFloat(trip.km) > 0 && (
              <div className="mt-2 text-right">
                <span className="text-xs text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                  {calculateTransport(trip.mode, parseFloat(trip.km)).toFixed(2)} kg CO₂
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addTrip}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-green-200 text-green-700 font-medium text-sm hover:bg-green-50 hover:border-green-400 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
        aria-label="Add another trip"
      >
        <Plus className="w-4 h-4" />
        Add another trip
      </button>

      <LiveCO2 kg={runningTotal} />
    </div>
  )
}

// ─── Step 2: Home Energy ──────────────────────────────────────────────

function StepEnergy({ energy, setEnergy }) {
  const update = useCallback((field, val) => setEnergy(prev => ({ ...prev, [field]: val })), [setEnergy])

  const raw = useMemo(() =>
    calculateEnergy('electricity', parseFloat(energy.electricity) || 0) +
    calculateEnergy('natural_gas',  parseFloat(energy.natural_gas)  || 0) +
    calculateEnergy('lpg',          parseFloat(energy.lpg)          || 0),
    [energy])

  const runningTotal = energy.renewable ? parseFloat((raw * 0.2).toFixed(2)) : raw

  const fields = [
    {
      key: 'electricity',
      label: 'Electricity used',
      unit: 'kWh',
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      hint: 'Check your smart meter or electricity bill',
      placeholder: 'e.g. 8',
    },
    {
      key: 'natural_gas',
      label: 'Natural Gas',
      unit: 'm³',
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      hint: 'From your gas meter reading',
      placeholder: 'e.g. 2.5',
    },
    {
      key: 'lpg',
      label: 'LPG used',
      unit: 'kg',
      icon: <Droplets className="w-4 h-4 text-blue-500" />,
      hint: 'Cooking gas cylinder weight',
      placeholder: 'e.g. 1',
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Home Energy</h2>
        <p className="text-sm text-gray-500">Enter today's energy usage from your home</p>
      </div>

      <div className="space-y-4">
        {fields.map((f, i) => (
          <div key={f.key} className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-2 mb-1.5">
              {f.icon}
              <label htmlFor={f.key} className="text-sm font-semibold text-gray-800">{f.label}</label>
              <span className="ml-auto text-xs text-gray-400">({f.unit})</span>
            </div>
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {f.hint}
            </p>
            <input
              type="number" min="0" step="0.01"
              id={f.key}
              value={energy[f.key]}
              onChange={e => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent bg-white text-gray-800 placeholder:text-gray-300"
              aria-label={f.label}
            />
            {parseFloat(energy[f.key]) > 0 && (
              <p className="text-right text-xs text-green-700 font-semibold mt-1.5">
                {calculateEnergy(f.key, parseFloat(energy[f.key]) || 0).toFixed(2)} kg CO₂
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Renewable toggle */}
      <div className="glass-card p-4 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <div>
          <p className="text-sm font-semibold text-gray-800">🌱 Renewable Energy</p>
          <p className="text-xs text-gray-400 mt-0.5">Solar, wind, or green tariff — reduces score by 80%</p>
        </div>
        <button
          type="button"
          id="energy-renewable-toggle"
          onClick={() => update('renewable', !energy.renewable)}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
            energy.renewable ? 'bg-green-500' : 'bg-gray-200'
          }`}
          aria-label="Toggle renewable energy use"
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
            energy.renewable ? 'translate-x-6' : 'translate-x-0'
          }`} />
        </button>
      </div>

      <LiveCO2 kg={runningTotal} label={energy.renewable ? 'Total (with 80% renewable reduction)' : 'Running total'} />
    </div>
  )
}

// ─── Step 3: Food & Diet ──────────────────────────────────────────────

function StepFood({ food, setFood }) {
  const update = useCallback((field, val) => setFood(prev => ({ ...prev, [field]: val })), [setFood])

  const baseCO2   = useMemo(() => {
    const meal = MEAL_TYPES.find(m => m.key === food.mealType)
    return (meal?.co2 ?? 0) * food.meals
  }, [food.mealType, food.meals])

  const wasteFactor   = 1 + food.wastePercent / 100
  const runningTotal  = parseFloat((baseCO2 * wasteFactor).toFixed(2))

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Food &amp; Diet</h2>
        <p className="text-sm text-gray-500">What kind of meals did you eat today?</p>
      </div>

      {/* Meal type */}
      <div className="glass-card p-5 animate-fade-in-up">
        <p className="text-sm font-semibold text-gray-800 mb-3">Predominant meal type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MEAL_TYPES.map(m => (
            <button
              key={m.key} type="button"
              onClick={() => update('mealType', m.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
                food.mealType === m.key
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/50'
              }`}
              aria-label={`Select ${m.label} diet`}
            >
              <span className="text-xl">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400">{m.co2} kg CO₂ / meal</p>
              </div>
              {food.mealType === m.key && (
                <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Number of meals */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CounterInput
          label="Number of meals today"
          value={food.meals}
          onChange={v => update('meals', v)}
          min={0} max={10}
          unit="meals"
        />
        <p className="text-xs text-gray-400 mt-2 text-center">
          Subtotal: {baseCO2.toFixed(2)} kg CO₂ before waste
        </p>
      </div>

      {/* Food waste slider */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="food-waste-slider" className="text-sm font-semibold text-gray-800">🗑️ Food Waste</label>
          <span className={`text-sm font-bold px-3 py-0.5 rounded-full ${
            food.wastePercent === 0  ? 'bg-green-100 text-green-700' :
            food.wastePercent <= 15  ? 'bg-amber-100 text-amber-700' :
                                       'bg-red-100 text-red-700'
          }`}>
            +{food.wastePercent}%
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          How much food did you throw away today? Even small amounts add up.
        </p>
        <input
          id="food-waste-slider"
          type="range" min="0" max="30" step="5"
          value={food.wastePercent}
          onChange={e => update('wastePercent', parseInt(e.target.value))}
          className="w-full accent-green-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus:outline-none"
          aria-label="Food waste percentage"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>None</span><span>A little</span><span>Some</span><span>A lot</span>
        </div>
      </div>

      <LiveCO2 kg={runningTotal} label={`Total (incl. ${food.wastePercent}% waste)`} />
    </div>
  )
}

// ─── Step 4: Shopping & Lifestyle ────────────────────────────────────

const SHOPPING_ITEMS = [
  { key: 'clothing',          label: 'Clothing',              icon: '👕', co2: 10.0,  unit: 'item' },
  { key: 'electronics_small', label: 'Small Electronics',     icon: '📱', co2: 50.0,  unit: 'item' },
  { key: 'electronics_large', label: 'Large Electronics',     icon: '💻', co2: 200.0, unit: 'item' },
  { key: 'online_orders',     label: 'Online Orders (pkg)',   icon: '📦', co2: 0.5,   unit: 'order' },
]

function StepShopping({ shopping, setShopping }) {
  const update = useCallback((key, val) => setShopping(prev => ({ ...prev, [key]: val })), [setShopping])

  const runningTotal = useMemo(() => {
    let t = 0
    t += calculateShopping('clothing',          shopping.clothing)
    t += calculateShopping('electronics_small', shopping.electronics_small)
    t += calculateShopping('electronics_large', shopping.electronics_large)
    t += shopping.online_orders * 0.5  // 0.5 kg per order packaging
    return parseFloat(t.toFixed(2))
  }, [shopping])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Shopping &amp; Lifestyle</h2>
        <p className="text-sm text-gray-500">Did you buy anything today?</p>
      </div>

      <div className="space-y-3">
        {SHOPPING_ITEMS.map((item, i) => (
          <div key={item.key}
            className="glass-card p-4 flex items-center gap-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-2xl shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.co2} kg CO₂ per {item.unit}</p>
            </div>
            <CounterInput
              value={shopping[item.key]}
              onChange={v => update(item.key, v)}
              min={0} max={20}
            />
          </div>
        ))}
      </div>

      {runningTotal > 0
        ? <LiveCO2 kg={runningTotal} />
        : (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Great — no shopping emissions logged today!
          </div>
        )
      }
    </div>
  )
}

// ─── Summary Screen ───────────────────────────────────────────────────

function Summary({ result, onSave, saving }) {
  const { total, category_totals } = result
  const level = getDailyLevel(total)
  const diffPct  = ((total - GLOBAL_DAILY_AVG_KG) / GLOBAL_DAILY_AVG_KG * 100).toFixed(1)
  const below    = total <= GLOBAL_DAILY_AVG_KG

  const horizontalBarData = Object.entries(category_totals)
    .filter(([, v]) => v > 0)
    .map(([cat, v]) => ({
      name: { transport: 'Transport', energy: 'Energy', food: 'Food', shopping: 'Shopping' }[cat],
      value: v,
      color: getCategoryColor(cat),
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold gradient-text mb-1">Today's Footprint</h2>
        <p className="text-sm text-gray-500">Here's the full breakdown of your emissions</p>
      </div>

      {/* Circular gauge */}
      <div className="flex justify-center">
        <EmissionGauge value={total} max={30} label="kg CO₂ today" levelText={level.label} colorOverride={level.color} />
      </div>

      {/* Global comparison banner */}
      <div className={`rounded-2xl border px-5 py-4 text-center ${level.bg} ${level.border}`}>
        <p className={`text-sm font-semibold ${level.text}`}>
          {below
            ? `🎉 You emitted ${Math.abs(diffPct)}% less than the global daily average`
            : `⚠️ You emitted ${Math.abs(diffPct)}% more than the global daily average`
          }
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Global daily avg: {GLOBAL_DAILY_AVG_KG} kg CO₂/day &nbsp;·&nbsp; Your total: {total.toFixed(2)} kg CO₂
        </p>
      </div>

      {/* Horizontal Bar Chart for Category Breakdown */}
      {horizontalBarData.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">Emissions Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={horizontalBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0fdf4" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }} />
              <RechartsTooltip formatter={v => [`${v.toFixed(2)} kg CO₂`]} cursor={{ fill: 'transparent' }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', formatter: (v) => `${v.toFixed(1)} kg`, fill: '#6b7280', fontSize: 11, fontWeight: 600 }}>
                {horizontalBarData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Color legend */}
      <div className="glass-card p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Emission Levels</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '< 5 kg',   tag: 'Low',      color: '#16a34a', bg: 'bg-green-50'  },
            { label: '5–10 kg',  tag: 'Moderate', color: '#ca8a04', bg: 'bg-amber-50'  },
            { label: '10–20 kg', tag: 'High',     color: '#ea580c', bg: 'bg-orange-50' },
            { label: '> 20 kg',  tag: 'Critical', color: '#dc2626', bg: 'bg-red-50'    },
          ].map(l => (
            <div key={l.tag} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${l.bg}`}>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="text-xs font-medium" style={{ color: l.color }}>{l.tag}</span>
              <span className="text-xs text-gray-400 ml-auto">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        id="calc-save-today-btn"
        onClick={onSave}
        disabled={saving}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
          saving
            ? 'bg-green-100 text-green-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-700 hover:to-emerald-600 shadow-green-200 hover:shadow-xl'
        }`}
        aria-label="Save today's entry to history"
      >
        {saving ? (
          <>✓ Saved! Redirecting…</>
        ) : (
          <><Leaf className="w-5 h-5" /> Save Today's Entry</>
        )}
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────

function Calculator() {
  const { addCarbonEntry } = useCarbon()
  const navigate = useNavigate()

  const [step,     setStep]     = useState(1)
  const [saving,   setSaving]   = useState(false)

  // Step data state
  const [trips,    setTrips]    = useState([{ id: 1, mode: 'car_petrol', km: '' }])
  const [energy,   setEnergy]   = useState({ electricity: '', natural_gas: '', lpg: '', renewable: false })
  const [food,     setFood]     = useState({ mealType: 'chicken', meals: 3, wastePercent: 10 })
  const [shopping, setShopping] = useState({ clothing: 0, electronics_small: 0, electronics_large: 0, online_orders: 0 })

  // ── Validation ──────────────────────────────────────────────────
  const [errors, setErrors] = useState('')

  function validate() {
    if (step === 3 && food.meals < 1) {
      setErrors('Please enter at least 1 meal.')
      return false
    }
    setErrors('')
    return true
  }

  // ── Compute live result (memoized) ──────────────────────────────
  const result = useMemo(() => {
    const transportInputs = trips
      .filter(t => parseFloat(t.km) > 0)
      .map(t => ({ mode: t.mode, km: parseFloat(t.km) }))

    const energyInputs = [
      { type: 'electricity', amount: parseFloat(energy.electricity) || 0 },
      { type: 'natural_gas', amount: parseFloat(energy.natural_gas)  || 0 },
      { type: 'lpg',         amount: parseFloat(energy.lpg)          || 0 },
    ].filter(e => e.amount > 0)

    // Transport total
    const transportTotal = transportInputs.reduce(
      (s, t) => s + calculateTransport(t.mode, t.km), 0)

    // Energy total (with renewable reduction)
    const rawEnergy = energyInputs.reduce(
      (s, e) => s + calculateEnergy(e.type, e.amount), 0)
    const energyTotal = energy.renewable ? parseFloat((rawEnergy * 0.2).toFixed(2)) : rawEnergy

    // Food total
    const meal       = MEAL_TYPES.find(m => m.key === food.mealType)
    const baseFoodCO2 = (meal?.co2 ?? 0) * food.meals
    const foodTotal   = parseFloat((baseFoodCO2 * (1 + food.wastePercent / 100)).toFixed(2))

    // Shopping total
    const shoppingTotal = parseFloat((
      calculateShopping('clothing',          shopping.clothing) +
      calculateShopping('electronics_small', shopping.electronics_small) +
      calculateShopping('electronics_large', shopping.electronics_large) +
      shopping.online_orders * 0.5
    ).toFixed(2))

    const total = parseFloat(
      (transportTotal + energyTotal + foodTotal + shoppingTotal).toFixed(2))

    return {
      total,
      category_totals: {
        transport: parseFloat(transportTotal.toFixed(2)),
        energy:    parseFloat(energyTotal.toFixed(2)),
        food:      parseFloat(foodTotal.toFixed(2)),
        shopping:  parseFloat(shoppingTotal.toFixed(2)),
      },
    }
  }, [trips, energy, food, shopping])

  // ── Navigate steps ──────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!validate()) return
    if (step < 4) setStep(s => s + 1)
    else setStep(5) // summary
  }, [step, validate])

  const handleBack = useCallback(() => {
    if (step === 5) setStep(4)
    else setStep(s => Math.max(1, s - 1))
  }, [step])

  // ── Save & redirect ─────────────────────────────────────────────
  const handleSave = useCallback(() => {
    setSaving(true)
    const { category_totals } = result
    const CATEGORY_LABELS = { transport: 'Transport', energy: 'Home Energy', food: 'Food & Diet', shopping: 'Shopping' }

    Object.entries(category_totals).forEach(([cat, co2]) => {
      if (co2 > 0) {
        addCarbonEntry({
          category: cat,
          item: cat,
          label: CATEGORY_LABELS[cat],
          quantity: 1,
          totalCO2: co2,
        })
      }
    })

    setTimeout(() => navigate('/'), 1200)
  }, [result, addCarbonEntry, navigate])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1">Carbon Calculator</h1>
        <p className="text-gray-500">Track your daily carbon footprint step by step</p>
      </div>

      {/* Progress bar (hidden on summary) */}
      {step <= 4 && <ProgressBar step={step} total={4} />}

      {/* Live running total pill (visible steps 1-4) */}
      {step <= 4 && result.total > 0 && (
        <div className="flex justify-end mb-4 animate-fade-in-up">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-green-200 shadow-sm">
            <span className="text-xs text-gray-500">So far:</span>
            <span className="text-xs font-bold text-green-700">{result.total.toFixed(2)} kg CO₂</span>
          </div>
        </div>
      )}

      {/* Step card */}
      <div className="glass-card p-6 sm:p-8">
        {step === 1 && <StepTransport trips={trips} setTrips={setTrips} />}
        {step === 2 && <StepEnergy    energy={energy} setEnergy={setEnergy} />}
        {step === 3 && <StepFood      food={food}   setFood={setFood} />}
        {step === 4 && <StepShopping  shopping={shopping} setShopping={setShopping} />}
        {step === 5 && <Summary result={result} onSave={handleSave} saving={saving} />}

        {/* Validation error */}
        {errors && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errors}
          </div>
        )}

        {/* Navigation buttons (hidden on summary) */}
        {step <= 4 && (
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button type="button" onClick={handleBack}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
                aria-label="Back to previous step"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <button type="button" onClick={handleNext}
              id={`calc-next-step-${step}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm hover:from-green-700 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
              aria-label={step === 4 ? 'See My Results' : 'Continue to next step'}
            >
              {step === 4 ? 'See My Results' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Back from summary */}
        {step === 5 && !saving && (
          <button type="button" onClick={handleBack}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
            aria-label="Go back and edit answers"
          >
            <ChevronLeft className="w-4 h-4" />
            Edit answers
          </button>
        )}
      </div>
    </div>
  )
}

export default Calculator
