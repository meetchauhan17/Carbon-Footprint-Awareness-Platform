import { useState, useEffect, useCallback } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { useCarbonStats } from '../hooks/useCarbonStats.js'
import {
  Leaf, Info, User, HelpCircle, AlertTriangle, ShieldCheck,
  CheckCircle, Save, Trash2, ArrowRight, ShieldAlert,
  Globe, Sparkles, Bell, ToggleLeft, ToggleRight, MapPin, Gauge
} from 'lucide-react'

import ToastNotification from '../components/ToastNotification.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ProgressBar from '../components/ProgressBar.jsx'

function About() {
  const { state, updateProfile, clearHistory } = useCarbon()
  const { profileCompletion, userProfile } = useCarbonStats()

  // Parse URL query parameter ?tab=profile
  const searchParams = new URLSearchParams(window.location.search)
  const initialTab = searchParams.get('tab') === 'profile' ? 'profile' : 'about'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Profile Form States
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [monthlyGoal, setMonthlyGoal] = useState(150)
  const [dietPreference, setDietPreference] = useState('omnivore')
  const [vehicleType, setVehicleType] = useState('petrol')
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [goalAlerts, setGoalAlerts] = useState(true)
  const [ecoTips, setEcoTips] = useState(false)

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Initialize form states from context
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '')
      setLocation(userProfile.location || '')
      setMonthlyGoal(userProfile.monthlyGoal || 150)
      setDietPreference(userProfile.dietPreference || 'omnivore')
      setVehicleType(userProfile.vehicleType || 'petrol')
      
      const notifs = userProfile.notifications || { weeklyReport: true, goalAlerts: true, ecoTips: false }
      setWeeklyReport(notifs.weeklyReport ?? true)
      setGoalAlerts(notifs.goalAlerts ?? true)
      setEcoTips(notifs.ecoTips ?? false)
    }
  }, [userProfile])

  // Save profile handler
  const handleSave = useCallback((e) => {
    e.preventDefault()
    updateProfile({
      name,
      location,
      monthlyGoal: parseFloat(monthlyGoal) || 150,
      dietPreference,
      vehicleType,
      notifications: { weeklyReport, goalAlerts, ecoTips }
    })
    setToastMessage('Profile changes saved successfully! 🌱')
    setShowToast(true)
  }, [updateProfile, name, location, monthlyGoal, dietPreference, vehicleType, weeklyReport, goalAlerts, ecoTips])

  // Clear data handler
  const handleClearData = useCallback(() => {
    setIsConfirmOpen(true)
  }, [])

  const handleConfirmClear = useCallback(() => {
    clearHistory()
    setName('')
    setLocation('')
    setMonthlyGoal(150)
    setDietPreference('omnivore')
    setVehicleType('petrol')
    setWeeklyReport(true)
    setGoalAlerts(true)
    setEcoTips(false)
    
    setToastMessage('All local data wiped successfully.')
    setShowToast(true)
    setIsConfirmOpen(false)
  }, [clearHistory])

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notification */}
      <ToastNotification message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />

      {/* Wipe Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="🚨 WIPE ALL APP DATA 🚨"
        message="This will delete ALL your carbon history logs, reset your profile, and lock all achieved badges. This action is permanent and cannot be undone."
        confirmText="Wipe All Data"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Page Header */}
      <div className="mb-6 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
          System &amp; <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Learn about our methodology and manage your carbon goals.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 gap-1.5 pb-2 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
            activeTab === 'about'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-500 hover:text-green-700 hover:bg-green-50 border border-gray-200'
          }`}
          aria-label="View about carbonwise"
        >
          <Info className="w-4 h-4" />
          About CarbonWise
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold tracking-wide transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
            activeTab === 'profile'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white text-gray-500 hover:text-green-700 hover:bg-green-50 border border-gray-200'
          }`}
          aria-label="View profile settings"
        >
          <User className="w-4 h-4" />
          My Profile &amp; Settings
        </button>
      </div>

      {/* Tab 1: About Content */}
      {activeTab === 'about' && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Section: What is a carbon footprint */}
          <div className="glass-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div className="md:col-span-3 space-y-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">What is a Carbon Footprint?</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                A carbon footprint represents the total volume of greenhouse gases—specifically carbon dioxide (CO₂) and methane—released into the atmosphere as a result of our individual actions and consumption patterns.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every commute, electric bulb turned on, hamburger eaten, or clothing purchase contributes to this footprint. By tracking these everyday actions, we can identify high-emission areas and take direct steps toward carbon reduction.
              </p>
            </div>
            
            {/* Infographic SVG */}
            <div className="md:col-span-2 flex justify-center bg-green-50/50 rounded-2xl p-4 border border-green-100/30">
              <svg viewBox="0 0 200 200" className="w-44 h-44 drop-shadow-md">
                {/* Globe Outline */}
                <circle cx="100" cy="100" r="75" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4" />
                {/* Cloud/Atmosphere */}
                <path d="M 50 140 Q 60 120 80 120 Q 90 100 110 100 Q 130 100 140 115 Q 155 115 160 130 Q 160 145 150 150 Z" fill="#22c55e" opacity="0.1" />
                {/* Green Footprint leaf shape */}
                <path d="M 90 145 Q 75 110 85 80 Q 95 60 110 60 Q 120 70 120 90 Q 120 120 105 145 Z" fill="#16a34a" />
                <path d="M 103 50 Q 95 40 105 32 Q 112 40 103 50 Z" fill="#16a34a" opacity="0.9" />
                <path d="M 116 55 Q 110 45 119 38 Q 124 45 116 55 Z" fill="#16a34a" opacity="0.8" />
                <path d="M 127 64 Q 122 55 130 49 Q 135 55 127 64 Z" fill="#16a34a" opacity="0.7" />
                <path d="M 134 76 Q 130 68 138 63 Q 142 68 134 76 Z" fill="#16a34a" opacity="0.6" />
                {/* Center Leaf Line */}
                <path d="M 90 145 Q 102 100 110 60" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Section: Why it matters (3 Stats) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Why It Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Stat 1 */}
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-black text-red-600">4.0 Tons</p>
                <p className="text-xs font-bold text-gray-800 mt-2">Global Average</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  The current average annual carbon emissions per person worldwide.
                </p>
              </div>

              {/* Stat 2 */}
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-black text-green-600">2.0 Tons</p>
                <p className="text-xs font-bold text-gray-800 mt-2">Target Footprint</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  The target annual emissions per person required to halt global warming trends.
                </p>
              </div>

              {/* Stat 3 */}
              <div className="glass-card p-5 text-center">
                <p className="text-3xl font-black text-amber-600">1.5°C</p>
                <p className="text-xs font-bold text-gray-800 mt-2">Threshold Limit</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                  The maximum global temperature rise limit to avoid severe climate impacts.
                </p>
              </div>

            </div>
          </div>

          {/* Section: How this app works */}
          <div className="glass-card p-6 md:p-8 space-y-6">
            <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide text-center">How CarbonWise Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              
              {/* Step 1 */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm mx-auto shadow-sm">
                  1
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase">Track Activities</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Log your daily commutes, energy bill consumption, meals, and shopping purchases step-by-step.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm mx-auto shadow-sm">
                  2
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase">Analyze Trends</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Examine weekly trend lines, category breakdowns, and compare your output against global averages.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-sm mx-auto shadow-sm">
                  3
                </div>
                <h3 className="text-xs font-bold text-gray-800 uppercase">Reduce Footprint</h3>
                <p className="text-[11px] text-gray-400 leading-normal">
                  Mark daily tips as done, complete actionable checklist items, and unlock milestones badges!
                </p>
              </div>

            </div>
          </div>

          {/* Data Sources and Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Credits */}
            <div className="glass-card p-5 space-y-2.5">
              <h4 className="text-xs font-bold text-gray-800 uppercase">Data &amp; Methodology</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Emission factors and carbon conversions are modeled in equivalence values (CO₂e) based on established governmental and scientific datasets, including the **EPA** (Environmental Protection Agency), **IPCC** (Intergovernmental Panel on Climate Change), and UK **DEFRA** conversions.
              </p>
            </div>

            {/* Tech Stack */}
            <div className="glass-card p-5 space-y-2.5">
              <h4 className="text-xs font-bold text-gray-800 uppercase">Technical Information</h4>
              <div className="space-y-1 text-[11px] text-gray-500 font-medium">
                <p>App Version: <span className="text-gray-800 font-bold">1.1.0 (Production)</span></p>
                <p>Core Framework: <span className="text-gray-800 font-bold">React 19 &amp; Vite</span></p>
                <p>Styling Engine: <span className="text-gray-800 font-bold">Tailwind CSS v4</span></p>
                <p>Charts &amp; Icons: <span className="text-gray-800 font-bold">Recharts &amp; Lucide Icons</span></p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Profile Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Profile Completion Card */}
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-green-500/5 blur-xl" />
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Setup Milestone</p>
                <h3 className="text-base font-black text-gray-800 mt-0.5">Profile Setup Completion</h3>
              </div>
              <span className="text-xs font-black text-green-700">{profileCompletion}% Complete</span>
            </div>
            
            {/* Progress Bar */}
            <ProgressBar
              value={profileCompletion}
              max={100}
              color="bg-gradient-to-r from-green-500 to-emerald-600"
            />
            {profileCompletion < 100 ? (
              <p className="text-[10px] text-gray-400 mt-2">
                💡 Fill in your name and location to reach 100% and get tailored recommendations!
              </p>
            ) : (
              <p className="text-[10px] text-green-600 font-bold mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Profile fully completed! Excellent job.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="glass-card p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Name */}
              <div>
                <label htmlFor="profile-name-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Your Display Name
                </label>
                <input
                  type="text"
                  id="profile-name-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all text-gray-700"
                  aria-label="Your display name"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="profile-location-input" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  City &amp; Country
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="profile-location-input"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. London, UK"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all text-gray-700"
                    aria-label="City and country"
                  />
                </div>
              </div>

            </div>

            {/* Monthly CO2 Goal Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="profile-goal-slider" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  Monthly Goal (kg CO₂)
                </label>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  {monthlyGoal} kg CO₂
                </span>
              </div>
              <input
                type="range"
                id="profile-goal-slider"
                min="50"
                max="500"
                step="10"
                value={monthlyGoal}
                onChange={e => setMonthlyGoal(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                aria-label="Monthly goal footprint"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>50 kg (Low Impact)</span>
                <span>500 kg (High Budget)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Diet Preference */}
              <div>
                <label htmlFor="profile-diet-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Default Diet Preference
                </label>
                <select
                  id="profile-diet-select"
                  value={dietPreference}
                  onChange={e => setDietPreference(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all font-semibold text-gray-600 cursor-pointer"
                  aria-label="Dietary preference"
                >
                  <option value="omnivore">Meat-Eater (Omnivore)</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label htmlFor="profile-vehicle-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                  Primary Commute Vehicle
                </label>
                <select
                  id="profile-vehicle-select"
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-transparent transition-all font-semibold text-gray-600 cursor-pointer"
                  aria-label="Commute vehicle type"
                >
                  <option value="none">No Private Vehicle (Transit/Walk)</option>
                  <option value="petrol">Petrol Car</option>
                  <option value="diesel">Diesel Car</option>
                  <option value="electric">Electric Vehicle (EV)</option>
                </select>
              </div>

            </div>

             {/* Notification Preferences */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                Notification Preferences (Mock)
              </span>
              
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-700">Weekly Summary Reports</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Receive reports containing weekly average trends</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWeeklyReport(!weeklyReport)}
                  className="text-gray-400 hover:text-green-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none rounded-xl"
                  aria-label="Toggle weekly summary reports"
                >
                  {weeklyReport ? (
                    <ToggleRight className="w-9 h-9 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-700">Goal Alert Notifications</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Get notified if monthly footprint exceeds target budget</p>
                </div>
                <button
                  type="button"
                  onClick={() => setGoalAlerts(!goalAlerts)}
                  className="text-gray-400 hover:text-green-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none rounded-xl"
                  aria-label="Toggle goal alerts notifications"
                >
                  {goalAlerts ? (
                    <ToggleRight className="w-9 h-9 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-gray-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-gray-700">Eco Tip Recommendations</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Receive daily notifications recommending eco tips</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEcoTips(!ecoTips)}
                  className="text-gray-400 hover:text-green-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none rounded-xl"
                  aria-label="Toggle eco tip recommendations"
                >
                  {ecoTips ? (
                    <ToggleRight className="w-9 h-9 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-gray-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors shadow-md shadow-green-100 font-bold text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
                aria-label="Save profile changes"
              >
                <Save className="w-4 h-4" />
                Save Profile
              </button>
            </div>

          </form>

          {/* Danger Zone */}
          <div className="border border-red-200 bg-red-50/30 rounded-3xl p-5 md:p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wide flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                System Management (Danger Zone)
              </h3>
              <p className="text-[11px] text-gray-400 leading-normal mt-1">
                Perform diagnostics and reset system parameters. Clearing local data wipes all history.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearData}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors font-bold text-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus:outline-none"
                aria-label="Wipe all app data"
              >
                <Trash2 className="w-4 h-4" />
                Wipe All App Data
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}

export default About
