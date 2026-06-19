import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
// Recharts component code-split
const CalculatorChart = lazy(() => import('../components/charts/CalculatorChart.jsx'));
import {
  Car, Zap, Utensils, ShoppingBag, ChevronRight, ChevronLeft,
  Plus, Trash2, CheckCircle2, AlertCircle, Leaf,
  Plane, Train, Bus, Bike, Flame, Droplets, Sparkles, AlertTriangle,
  Salad, Drumstick, Fish, Beef, Shirt, Smartphone, Laptop, Package, Check
} from 'lucide-react'
import { useCarbon } from '../context/CarbonContext.jsx'
import EmissionGauge from '../components/EmissionGauge.jsx'
import EmojiIcon from '../components/EmojiIcon.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'
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
  { key: 'vegan',        label: 'Vegan',          co2: 0.5,  icon: Salad, color: '#10B981' },
  { key: 'vegetarian',   label: 'Vegetarian',      co2: 0.8,  icon: Leaf, color: '#10B981' },
  { key: 'chicken',      label: 'Chicken / Poultry',co2: 1.4,  icon: Drumstick, color: '#F59E0B' },
  { key: 'fish',         label: 'Fish / Seafood',  co2: 1.0,  icon: Fish, color: '#0EA5E9' },
  { key: 'red_meat',     label: 'Red Meat',        co2: 4.0,  icon: Beef, color: '#DB2777' },
]

// Daily global average: 4000 kg/year / 365 = ~10.96 kg/day
const GLOBAL_DAILY_AVG_KG = parseFloat((4000 / 365).toFixed(2))

// Per-step color thresholds (daily kg CO₂)
// Per-step color thresholds (daily kg CO₂)
function getDailyLevel(kg) {
  if (kg < 5)  return { label: 'Low',      color: '#10B981', bg: 'bg-[#E6F4EA]',  border: 'border-0',  text: 'text-[#10B981]'  }
  if (kg < 10) return { label: 'Moderate', color: '#FFD600', bg: 'bg-[#FFF9E6]',  border: 'border-0',  text: 'text-[#FFD600]'  }
  if (kg < 20) return { label: 'High',     color: '#F7931A', bg: 'bg-[#FFF0E6]', border: 'border-0', text: 'text-[#F7931A]' }
  return          { label: 'Critical',  color: '#EF4444', bg: 'bg-[#FCE7F3]',    border: 'border-0',    text: 'text-[#EF4444]'    }
}

const STEPS = [
  { id: 1, label: 'Transport',  icon: Car      },
  { id: 2, label: 'Energy',     icon: Zap      },
  { id: 3, label: 'Food',       icon: Utensils },
  { id: 4, label: 'Shopping',   icon: ShoppingBag },
]

// ─── Progress Bar ─────────────────────────────────────────────────────

function ProgressBar({ step, total }) {
  const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV']
  return (
    <div className="mb-8 font-display">
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((s, i) => {
          const done    = step > s.id
          const current = step === s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 font-bold text-sm ${
                  done    ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A]/30 shadow-[0_0_12px_rgba(247,147,26,0.15)] font-mono' :
                  current ? 'bg-[#F7931A] text-[#030304] border-[#F7931A] animate-glow-pulse font-bold font-mono' :
                            'bg-[#0F1115] text-clay-muted border-white/5 font-mono'
                }`}>
                  {ROMAN_NUMERALS[s.id - 1]}
                </div>
                <span className={`text-[10px] font-bold hidden sm:block uppercase tracking-widest ${
                  current ? 'text-[#F7931A]' : done ? 'text-[#F7931A]/70' : 'text-clay-muted'
                }`}>{s.label}</span>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2.5 transition-all duration-500"
                  style={{ background: step > s.id ? '#F7931A' : '#1E293B' }} />
              )}
            </div>
          )
        })}
      </div>
      {/* Percentage */}
      <div className="flex items-center gap-3.5">
        <div className="flex-1 h-1.5 bg-[#1E293B] border border-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#EA580C] to-[#F7931A] rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-[#F7931A] w-10 text-right font-mono">
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
    <div className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full shadow-[0_0_15px_rgba(247,147,26,0.1)] border border-white/10 bg-[#0F1115] hover:-translate-y-0.5 transition-all duration-200 font-sans">
      <Leaf className="w-4.5 h-4.5 text-[#10B981]" />
      <span className="text-xs font-bold text-clay-muted">{label}:</span>
      <span className="text-xs font-bold font-mono" style={{ color: level.color }}>{kg.toFixed(2)} kg CO₂</span>
    </div>
  )
}

// ─── Counter Input (+ / −) ────────────────────────────────────────────

function CounterInput({ value, onChange, min = 0, max = 99, label, unit }) {
  return (
    <div className="font-sans">
      {label && <p className="text-xs font-bold text-clay-muted uppercase tracking-wide mb-2 font-display">{label}</p>}
      <div className="flex items-center gap-4">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 rounded-xl bg-[#0F1115]/80 text-[#F7931A] hover:bg-[#F7931A]/10 border border-white/10 hover:border-[#F7931A]/50 active:scale-95 transition-all duration-200 flex items-center justify-center font-bold text-lg leading-none cursor-pointer"
          aria-label={`Decrease ${label || 'value'}`}
        >−</button>
        <div className="flex-1 text-center">
          <span className="text-2xl font-black text-white font-mono">{value}</span>
          {unit && <span className="text-xs text-clay-muted font-bold ml-1">{unit}</span>}
        </div>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 rounded-xl bg-[#0F1115]/80 text-[#F7931A] hover:bg-[#F7931A]/10 border border-white/10 hover:border-[#F7931A]/50 active:scale-95 transition-all duration-200 flex items-center justify-center font-bold text-lg leading-none cursor-pointer"
          aria-label={`Increase ${label || 'value'}`}
        >+</button>
      </div>
    </div>
  )
}

function FoodMealOption({ m, selected, onClick }) {
  const tilt = use3DTilt({ maxTilt: 12, scale: 1.03 })
  return (
    <button
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={tilt.style}
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 cursor-pointer focus:outline-none border ${
        selected
          ? 'bg-[#F7931A]/10 text-white border-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.2)] rounded-xl'
          : 'bg-[#0F1115]/60 text-clay-muted border-white/10 hover:text-white hover:border-[#F7931A]/40 rounded-xl'
      }`}
      aria-label={`Select ${m.label} diet`}
    >
      <span className="text-xl shrink-0"><EmojiIcon icon={m.icon} className="w-6 h-6" /></span>
      <div className="min-w-0">
        <p className={`text-xs font-bold font-display ${selected ? 'text-[#F7931A]' : 'text-white'}`}>{m.label}</p>
        <p className="text-[10px] font-medium font-mono text-clay-muted">{m.co2} kg CO₂ / meal</p>
      </div>
      {selected && (
        <CheckCircle2 className="w-4.5 h-4.5 text-[#F7931A] ml-auto shrink-0 animate-[spin_0.3s_ease-out]" />
      )}
    </button>
  )
}

function ShoppingItemRow({ item, value, onChange, i }) {
  const tilt = use3DTilt({ maxTilt: 8, scale: 1.02 })
  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{
        ...tilt.style,
        animationDelay: `${i * 80}ms`
      }}
      className="glass-card p-4 flex items-center gap-4 rounded-2xl animate-fade-in-up"
    >
      <span className="text-2xl shrink-0"><EmojiIcon icon={item.icon} className="w-8 h-8" /></span>
      <div className="flex-1 min-w-0 font-display">
        <p className="text-sm font-bold text-white leading-tight">{item.label}</p>
        <p className="text-[10px] text-clay-muted font-bold font-mono tracking-wide mt-0.5">{item.co2} kg CO₂ per {item.unit}</p>
      </div>
      <CounterInput
        value={value}
        onChange={onChange}
        min={0} max={20}
      />
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
    if (mode.startsWith('car'))    return <Car className="w-4.5 h-4.5" />
    if (mode === 'bus')            return <Bus className="w-4.5 h-4.5" />
    if (mode === 'train')          return <Train className="w-4.5 h-4.5" />
    if (mode.startsWith('flight')) return <Plane className="w-4.5 h-4.5" />
    if (mode === 'motorbike')      return <Bike className="w-4.5 h-4.5" />
    return <Car className="w-4.5 h-4.5" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white font-display mb-1">Transport</h2>
        <p className="text-xs text-clay-muted font-sans font-medium">Log every trip you made today</p>
      </div>

      <div className="space-y-4">
        {trips.map((trip, i) => (
          <div key={trip.id}
            className="glass-card p-5 rounded-2xl animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold text-clay-muted uppercase tracking-wider font-mono">Trip {i + 1}</span>
              {trips.length > 1 && (
                <button type="button" onClick={() => removeTrip(trip.id)}
                  className="ml-auto p-2 rounded-xl text-clay-muted hover:text-[#EF4444] hover:bg-red-500/10 transition-all cursor-pointer border-0"
                  aria-label={`Remove trip ${i + 1}`}
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Mode */}
              <div>
                <label htmlFor={`trip-select-${trip.id}`} className="block text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">Vehicle type</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#F7931A] pointer-events-none">
                    {modeIcon(trip.mode)}
                  </div>
                  <select
                    id={`trip-select-${trip.id}`}
                    value={trip.mode}
                    onChange={e => updateTrip(trip.id, 'mode', e.target.value)}
                    className="w-full h-14 pl-12 pr-5 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-sans focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200 cursor-pointer appearance-none"
                    aria-label={`Vehicle type for trip ${i + 1}`}
                  >
                    {TRANSPORT_OPTIONS.map(o => (
                      <option key={o.key} value={o.key} className="bg-[#0F1115] text-white">{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              {/* km */}
              <div>
                <label htmlFor={`trip-km-${trip.id}`} className="block text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-2 font-display">
                  Distance (km)
                </label>
                <input
                  type="number" min="0" step="0.1"
                  id={`trip-km-${trip.id}`}
                  value={trip.km}
                  onChange={e => updateTrip(trip.id, 'km', e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full h-14 px-5 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white font-sans focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
                  aria-label={`Distance in kilometers for trip ${i + 1}`}
                />
              </div>
            </div>
            {/* Per-trip CO2 chip */}
            {parseFloat(trip.km) > 0 && (
              <div className="mt-3 text-right">
                <span className="text-[10px] text-[#10B981] font-bold bg-[#10B981]/10 px-3 py-1 rounded-full font-mono shadow-sm border border-[#10B981]/30">
                  {calculateTransport(trip.mode, parseFloat(trip.km)).toFixed(2)} kg CO₂
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={addTrip}
        className="w-full h-14 rounded-full border border-dashed border-[#F7931A]/30 hover:border-[#F7931A] text-[#F7931A] hover:bg-[#F7931A]/5 flex items-center justify-center gap-2 font-display font-bold text-xs transition-all duration-200 cursor-pointer"
        aria-label="Add another trip"
      >
        <Plus className="w-4.5 h-4.5" />
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
      icon: <Zap className="w-4.5 h-4.5 text-amber-500" />,
      hint: 'Check your smart meter or electricity bill',
      placeholder: 'e.g. 8',
    },
    {
      key: 'natural_gas',
      label: 'Natural Gas',
      unit: 'm³',
      icon: <Flame className="w-4.5 h-4.5 text-[#F7931A]" />,
      hint: 'From your gas meter reading',
      placeholder: 'e.g. 2.5',
    },
    {
      key: 'lpg',
      label: 'LPG used',
      unit: 'kg',
      icon: <Droplets className="w-4.5 h-4.5 text-blue-500" />,
      hint: 'Cooking gas cylinder weight',
      placeholder: 'e.g. 1',
    },
  ]

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-white font-display mb-1">Home Energy</h2>
        <p className="text-xs text-clay-muted font-sans font-medium">Enter today's energy usage from your home</p>
      </div>

      <div className="space-y-4">
        {fields.map((f, i) => (
          <div key={f.key} className="glass-card p-5 rounded-2xl animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center gap-2 mb-2 font-display">
              {f.icon}
              <label htmlFor={f.key} className="text-sm font-bold text-white">{f.label}</label>
              <span className="ml-auto text-[10px] text-clay-muted font-bold font-mono uppercase tracking-wide">({f.unit})</span>
            </div>
            <p className="text-[10px] text-clay-muted mb-3 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-clay-muted" /> {f.hint}
            </p>
            <input
              type="number" min="0" step="0.01"
              id={f.key}
              value={energy[f.key]}
              onChange={e => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full h-14 px-5 bg-black/50 border-0 border-b-2 border-white/20 rounded-lg text-xs text-white focus:outline-none focus:border-[#F7931A] focus:shadow-[0_10px_20px_-10px_rgba(247,147,26,0.3)] transition-all duration-200"
              aria-label={f.label}
            />
            {parseFloat(energy[f.key]) > 0 && (
              <p className="text-right text-[10px] text-[#10B981] font-bold mt-2 font-mono">
                {calculateEnergy(f.key, parseFloat(energy[f.key]) || 0).toFixed(2)} kg CO₂
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Renewable toggle */}
      <div className="glass-card p-5 flex items-center justify-between rounded-2xl animate-fade-in-up" style={{ animationDelay: '240ms' }}>
        <div>
          <div className="flex items-center gap-1.5 font-display">
            <EmojiIcon icon={Leaf} className="w-4 h-4" />
            <p className="text-sm font-bold text-white">Renewable Energy</p>
          </div>
          <p className="text-xs text-clay-muted mt-1 font-medium">Solar, wind, or green tariff — reduces score by 80%</p>
        </div>
        <button
          type="button"
          id="energy-renewable-toggle"
          onClick={() => update('renewable', !energy.renewable)}
          className={`relative w-14 h-7 rounded-full shadow-[var(--shadow-clay-pressed)] transition-all duration-300 cursor-pointer focus:outline-none border-0 ${
            energy.renewable ? 'bg-[#10B981]' : 'bg-[#1E293B]'
          }`}
          aria-label="Toggle renewable energy use"
        >
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
            energy.renewable ? 'translate-x-7' : 'translate-x-0'
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
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-white font-display mb-1">Food &amp; Diet</h2>
        <p className="text-xs text-clay-muted font-medium">What kind of meals did you eat today?</p>
      </div>

      {/* Meal type */}
      <div className="glass-card p-5 rounded-2xl animate-fade-in-up">
        <p className="text-sm font-bold text-white font-display mb-3">Predominant meal type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MEAL_TYPES.map(m => (
            <FoodMealOption
              key={m.key}
              m={m}
              selected={food.mealType === m.key}
              onClick={() => update('mealType', m.key)}
            />
          ))}
        </div>
      </div>

      {/* Number of meals */}
      <div className="glass-card p-5 rounded-2xl animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CounterInput
          label="Number of meals today"
          value={food.meals}
          onChange={v => update('meals', v)}
          min={0} max={10}
          unit="meals"
        />
        <p className="text-[10px] text-clay-muted font-bold uppercase mt-3 text-center font-mono">
          Subtotal: {baseCO2.toFixed(2)} kg CO₂ before waste
        </p>
      </div>

      {/* Food waste slider */}
      <div className="glass-card p-5 rounded-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-2.5 font-display">
          <div className="flex items-center gap-1.5">
            <EmojiIcon icon={Trash2} className="w-4 h-4" />
            <label htmlFor="food-waste-slider" className="text-sm font-bold text-white">Food Waste</label>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full font-mono shadow-sm ${
            food.wastePercent === 0  ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' :
            food.wastePercent <= 15  ? 'bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/30' :
                                       'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30'
          }`}>
            +{food.wastePercent}%
          </span>
        </div>
        <p className="text-xs text-clay-muted mb-3 font-medium">
          How much food did you throw away today? Even small amounts add up.
        </p>
        <input
          id="food-waste-slider"
          type="range" min="0" max="30" step="5"
          value={food.wastePercent}
          onChange={e => update('wastePercent', parseInt(e.target.value))}
          className="w-full h-2 bg-[#1E293B] rounded-full appearance-none cursor-pointer accent-[#F7931A] focus:outline-none"
          aria-label="Food waste percentage"
        />
        <div className="flex justify-between text-[10px] text-clay-muted font-bold font-mono mt-1">
          <span>None</span><span>A little</span><span>Some</span><span>A lot</span>
        </div>
      </div>

      <LiveCO2 kg={runningTotal} label={`Total (incl. ${food.wastePercent}% waste)`} />
    </div>
  )
}

// ─── Step 4: Shopping & Lifestyle ────────────────────────────────────

const SHOPPING_ITEMS = [
  { key: 'clothing',          label: 'Clothing',              icon: Shirt, co2: 10.0,  unit: 'item' },
  { key: 'electronics_small', label: 'Small Electronics',     icon: Smartphone, co2: 50.0,  unit: 'item' },
  { key: 'electronics_large', label: 'Large Electronics',     icon: Laptop, co2: 200.0, unit: 'item' },
  { key: 'online_orders',     label: 'Online Orders (pkg)',   icon: Package, co2: 0.5,   unit: 'order' },
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
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-white font-display mb-1">Shopping &amp; Lifestyle</h2>
        <p className="text-xs text-clay-muted font-medium">Did you buy anything today?</p>
      </div>

      <div className="space-y-4">
        {SHOPPING_ITEMS.map((item, i) => (
          <ShoppingItemRow
            key={item.key}
            item={item}
            value={shopping[item.key]}
            onChange={v => update(item.key, v)}
            i={i}
          />
        ))}
      </div>

      {runningTotal > 0
        ? <LiveCO2 kg={runningTotal} />
        : (
          <div className="flex items-center gap-2.5 px-4.5 py-3.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-xs font-bold font-display shadow-sm">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
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
    <div className="space-y-6 animate-fade-in-up font-sans">
      <div className="text-center">
        <h2 className="text-2xl font-bold gradient-text mb-1">Today's Footprint</h2>
        <p className="text-xs text-clay-muted font-medium">Here's the full breakdown of your emissions</p>
      </div>

      {/* Circular gauge */}
      <div className="flex justify-center">
        <EmissionGauge value={total} max={30} label="kg CO₂ today" levelText={level.label} colorOverride={level.color} />
      </div>

      {/* Global comparison banner */}
      <div className={`rounded-2xl px-6 py-5 text-center font-display border ${
        below
          ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
          : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
      }`}>
        <p className="text-sm font-bold flex items-center justify-center gap-1.5" style={{ color: level.color }}>
          {below ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          )}
          {below
            ? `You emitted ${Math.abs(diffPct)}% less than the global daily average`
            : `You emitted ${Math.abs(diffPct)}% more than the global daily average`
          }
        </p>
        <p className="text-[10px] text-clay-muted font-bold mt-1 font-mono">
          Global daily avg: {GLOBAL_DAILY_AVG_KG} kg CO₂/day &nbsp;·&nbsp; Your total: {total.toFixed(2)} kg CO₂
        </p>
      </div>

      {/* Horizontal Bar Chart for Category Breakdown */}
      {horizontalBarData.length > 0 && (
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-clay-muted uppercase tracking-wider mb-4 text-center font-display">Emissions Breakdown</h3>
          <Suspense fallback={<div className="h-[220px] w-full animate-pulse bg-white/5 rounded-xl border border-white/10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#F7931A]/20 border-t-[#F7931A] rounded-full animate-spin"></div></div>}>
            <CalculatorChart horizontalBarData={horizontalBarData} />
          </Suspense>
        </div>
      )}

      {/* Color legend */}
      <div className="glass-card p-5 rounded-2xl">
        <p className="text-[10px] font-bold text-clay-muted uppercase tracking-wider mb-3 font-display">Emission Levels</p>
        <div className="grid grid-cols-2 gap-3 font-mono">
          {[
            { label: '< 5 kg',   tag: 'Low',      color: '#10B981', bg: 'bg-[#E6F4EA]'  },
            { label: '5–10 kg',  tag: 'Moderate', color: '#FFD600', bg: 'bg-[#FFF9E6]'  },
            { label: '10–20 kg', tag: 'High',     color: '#F7931A', bg: 'bg-[#FFF0E6]' },
            { label: '> 20 kg',  tag: 'Critical', color: '#EF4444', bg: 'bg-[#FCE7F3]'    },
          ].map(l => (
            <div key={l.tag} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${l.bg} shadow-sm border-0`}>
              <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ background: l.color }} />
              <span className="text-xs font-bold" style={{ color: l.color }}>{l.tag}</span>
              <span className="text-[10px] text-clay-muted font-bold ml-auto">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        id="calc-save-today-btn"
        onClick={onSave}
        disabled={saving}
        className={`w-full h-16 flex items-center justify-center gap-3 border-0 focus:outline-none ${
          saving
            ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 rounded-full cursor-not-allowed shadow-none'
            : 'btn-premium'
        }`}
        aria-label="Save today's entry to history"
      >
        {saving ? (
          <><Check className="w-4 h-4 text-emerald-500" /> Saved! Redirecting…</>
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-1 font-display">Carbon Calculator</h1>
        <p className="text-xs text-clay-muted font-sans font-medium">Track your daily carbon footprint step by step</p>
      </div>

      {/* Progress bar (hidden on summary) */}
      {step <= 4 && <ProgressBar step={step} total={4} />}

      {/* Live running total pill (visible steps 1-4) */}
      {step <= 4 && result.total > 0 && (
        <div className="flex justify-end mb-4 animate-fade-in-up">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F1115] border border-white/10 rounded-full shadow-sm font-mono">
            <span className="text-[10px] text-clay-muted font-bold">So far:</span>
            <span className="text-[10px] font-bold text-[#10B981]">{result.total.toFixed(2)} kg CO₂</span>
          </div>
        </div>
      )}

      {/* Step card */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl">
        {step === 1 && <StepTransport trips={trips} setTrips={setTrips} />}
        {step === 2 && <StepEnergy    energy={energy} setEnergy={setEnergy} />}
        {step === 3 && <StepFood      food={food}   setFood={setFood} />}
        {step === 4 && <StepShopping  shopping={shopping} setShopping={setShopping} />}
        {step === 5 && <Summary result={result} onSave={handleSave} saving={saving} />}

        {/* Validation error */}
        {errors && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl px-4 py-3 font-sans font-bold">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            {errors}
          </div>
        )}

        {/* Navigation buttons (hidden on summary) */}
        {step <= 4 && (
          <div className="flex gap-3.5 mt-6">
            {step > 1 && (
              <button type="button" onClick={handleBack}
                className="btn-3d-secondary h-14 px-6 flex items-center gap-2.5"
                aria-label="Back to previous step"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
                Back
              </button>
            )}
            <button type="button" onClick={handleNext}
              id={`calc-next-step-${step}`}
              className="btn-premium flex-1 flex items-center justify-center gap-2 h-14"
              aria-label={step === 4 ? 'See My Results' : 'Continue to next step'}
            >
              {step === 4 ? 'See My Results' : 'Continue'}
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        {/* Back from summary */}
        {step === 5 && !saving && (
          <button type="button" onClick={handleBack}
            className="btn-3d-secondary w-full mt-4 flex items-center justify-center gap-2.5 h-12 text-xs"
            aria-label="Go back and edit answers"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
            Edit answers
          </button>
        )}
      </div>
    </div>
  )
}

export default Calculator
