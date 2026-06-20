import { useState, useEffect, useCallback } from 'react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { useCarbonStats } from '../hooks/useCarbonStats.js'
import {
  Info, User, CheckCircle, Save, Trash2, ShieldAlert,
  ToggleLeft, ToggleRight, Lightbulb, Cpu, Tag, Paintbrush, BarChart3, Database
} from 'lucide-react'

import ToastNotification from '../components/ToastNotification.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import ProgressBar from '../components/ProgressBar.jsx'
import LocationAutocomplete from '../components/LocationAutocomplete.jsx'
import { use3DTilt } from '../hooks/use3DTilt.js'
import { canNotify, checkWeeklyDigest, checkGoalAlert, checkDailyTipSuggestion } from '../utils/notifications.js'
import { TIPS_DATA } from '../data/tipsData.js'

function About() {
  const { state, updateProfile, clearHistory } = useCarbon()
  const { profileCompletion, userProfile } = useCarbonStats()

  // 3D tilt interaction hooks for About page panels
  const footprintTilt = use3DTilt({ maxTilt: 6, scale: 1.01 })
  const globalAvgTilt = use3DTilt({ maxTilt: 10, scale: 1.025 })
  const targetTilt = use3DTilt({ maxTilt: 10, scale: 1.025 })
  const thresholdTilt = use3DTilt({ maxTilt: 10, scale: 1.025 })
  const stepsTilt = use3DTilt({ maxTilt: 5, scale: 1.008 })
  const creditsTilt = use3DTilt({ maxTilt: 7, scale: 1.015 })
  const techTilt = use3DTilt({ maxTilt: 7, scale: 1.015 })
  const milestoneTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })
  const formTilt = use3DTilt({ maxTilt: 3, scale: 1.005 })
  const dangerTilt = use3DTilt({ maxTilt: 5, scale: 1.01 })

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

  // Browser Notifications API States & Helpers
  const isNotificationSupported = typeof window !== 'undefined' && 'Notification' in window
  const [permission, setPermission] = useState(
    isNotificationSupported ? Notification.permission : 'denied'
  )

  useEffect(() => {
    if (isNotificationSupported) {
      setPermission(Notification.permission)
      const interval = setInterval(() => {
        setPermission(Notification.permission)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [isNotificationSupported])

  const requestPermissionSafe = async () => {
    if (!isNotificationSupported) return 'default'
    try {
      const res = await Notification.requestPermission()
      setPermission(res)
      return res
    } catch (e) {
      console.error('Error requesting notification permission:', e)
      return 'default'
    }
  }

  const handleTogglePreference = async (type) => {
    if (!isNotificationSupported) {
      setToastMessage('Notifications are not supported in your browser.')
      setShowToast(true)
      return
    }

    if (type === 'weeklyReport') {
      if (weeklyReport) {
        setWeeklyReport(false)
      } else {
        const res = await requestPermissionSafe()
        if (res === 'granted') {
          setWeeklyReport(true)
        } else {
          setWeeklyReport(false)
          if (res === 'denied') {
            setToastMessage('Notifications blocked. Enable them in your browser settings to use this feature.')
            setShowToast(true)
          }
        }
      }
    } else if (type === 'goalAlerts') {
      if (goalAlerts) {
        setGoalAlerts(false)
      } else {
        const res = await requestPermissionSafe()
        if (res === 'granted') {
          setGoalAlerts(true)
        } else {
          setGoalAlerts(false)
          if (res === 'denied') {
            setToastMessage('Notifications blocked. Enable them in your browser settings to use this feature.')
            setShowToast(true)
          }
        }
      }
    } else if (type === 'ecoTips') {
      if (ecoTips) {
        setEcoTips(false)
      } else {
        const res = await requestPermissionSafe()
        if (res === 'granted') {
          setEcoTips(true)
        } else {
          setEcoTips(false)
          if (res === 'denied') {
            setToastMessage('Notifications blocked. Enable them in your browser settings to use this feature.')
            setShowToast(true)
          }
        }
      }
    }
  }

  const handleTestNotification = (type) => {
    if (!canNotify()) {
      setToastMessage('Please enable notifications first.')
      setShowToast(true)
      return
    }

    if (type === 'weekly') {
      checkWeeklyDigest(true)
    } else if (type === 'goal') {
      checkGoalAlert(state.carbonEntries, parseFloat(monthlyGoal) || 150, true)
    } else if (type === 'tip') {
      checkDailyTipSuggestion(TIPS_DATA, true)
    }
  }

  const isDisabled = !isNotificationSupported || permission === 'denied'

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
    setToastMessage('Profile changes saved successfully!')
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
    <main id="about-main" aria-label="About CarbonWise" className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 pb-28 md:pb-8">
      
      {/* Toast Notification */}
      <ToastNotification message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />

      {/* Wipe Confirmation Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="WIPE ALL APP DATA"
        message="This will delete ALL your carbon history logs, reset your profile, and lock all achieved badges. This action is permanent and cannot be undone."
        confirmText="Wipe All Data"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setIsConfirmOpen(false)}
      />

      {/* Page Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight font-display">
          System &amp; <span className="gradient-text">Profile</span>
        </h1>
        <p className="text-[#94A3B8] text-sm mt-1.5 font-sans font-medium">
          Learn about our methodology and manage your carbon goals.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2.5 pb-2 animate-fade-in-up overflow-x-auto no-scrollbar snap-x snap-mandatory" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => setActiveTab('about')}
          className={`flex items-center justify-center gap-2 h-11 px-4 sm:px-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-full shrink-0 snap-center ${
            activeTab === 'about'
              ? 'btn-premium text-white'
              : 'bg-[#0F1115]/80 text-[#94A3B8] hover:text-white border border-white/10 hover:bg-[#0F1115]'
          }`}
          aria-label="View about carbonwise"
        >
          <Info className="w-3.5 h-3.5" />
          <span>About</span><span className="hidden sm:inline">&nbsp;CarbonWise</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center justify-center gap-2 h-11 px-4 sm:px-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer focus:outline-none rounded-full shrink-0 snap-center ${
            activeTab === 'profile'
              ? 'btn-premium text-white'
              : 'bg-[#0F1115]/80 text-[#94A3B8] hover:text-white border border-white/10 hover:bg-[#0F1115]'
          }`}
          aria-label="View profile settings"
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">My&nbsp;</span><span>Profile &amp; Settings</span>
        </button>
      </div>

      {/* Tab 1: About Content */}
      {activeTab === 'about' && (
        <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Section: What is a carbon footprint */}
          <div
            ref={footprintTilt.ref}
            onMouseMove={footprintTilt.onMouseMove}
            onMouseLeave={footprintTilt.onMouseLeave}
            style={footprintTilt.style}
            className="glass-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-6 items-center rounded-3xl"
          >
            <div className="md:col-span-3 space-y-4">
              <h2 className="text-xl font-bold text-white uppercase tracking-wide font-display">What is a Carbon Footprint?</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed font-sans font-medium">
                A carbon footprint represents the total volume of greenhouse gases—specifically carbon dioxide (CO₂) and methane—released into the atmosphere as a result of our individual actions and consumption patterns.
              </p>
              <p className="text-sm text-[#94A3B8] leading-relaxed font-sans font-medium">
                Every commute, electric bulb turned on, hamburger eaten, or clothing purchase contributes to this footprint. By tracking these everyday actions, we can identify high-emission areas and take direct steps toward carbon reduction.
              </p>
            </div>
            
            {/* Infographic SVG */}
            <div className="md:col-span-2 flex justify-center bg-black/50 border border-white/10 rounded-2xl p-6">
              <svg viewBox="0 0 200 200" className="w-44 h-44 drop-shadow-md">
                {/* Globe Outline */}
                <circle cx="100" cy="100" r="75" fill="none" stroke="#F7931A" strokeWidth="2" strokeDasharray="4 4" />
                {/* Cloud/Atmosphere */}
                <path d="M 50 140 Q 60 120 80 120 Q 90 100 110 100 Q 130 100 140 115 Q 155 115 160 130 Q 160 145 150 150 Z" fill="#EA580C" opacity="0.15" />
                {/* Orange Footprint leaf shape */}
                <path d="M 90 145 Q 75 110 85 80 Q 95 60 110 60 Q 120 70 120 90 Q 120 120 105 145 Z" fill="#F7931A" />
                <path d="M 103 50 Q 95 40 105 32 Q 112 40 103 50 Z" fill="#FFD600" opacity="0.9" />
                <path d="M 116 55 Q 110 45 119 38 Q 124 45 116 55 Z" fill="#FFD600" opacity="0.8" />
                <path d="M 127 64 Q 122 55 130 49 Q 135 55 127 64 Z" fill="#FFD600" opacity="0.7" />
                <path d="M 134 76 Q 130 68 138 63 Q 142 68 134 76 Z" fill="#FFD600" opacity="0.6" />
                {/* Center Leaf Line */}
                <path d="M 90 145 Q 102 100 110 60" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
              </svg>
            </div>
          </div>

          {/* Section: Why it matters (3 Stats) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">Why It Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Stat 1 */}
              <div>
                <div
                  ref={globalAvgTilt.ref}
                  onMouseMove={globalAvgTilt.onMouseMove}
                  onMouseLeave={globalAvgTilt.onMouseLeave}
                  style={globalAvgTilt.style}
                  className="glass-card p-6 text-center rounded-2xl h-full flex flex-col justify-center"
                >
                  <p className="text-4xl font-bold text-[#EA580C] font-display">4.0 Tons</p>
                  <p className="text-sm font-bold text-white mt-2 font-display uppercase tracking-wide">Global Average</p>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans font-medium">
                    The current average annual carbon emissions per person worldwide.
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div>
                <div
                  ref={targetTilt.ref}
                  onMouseMove={targetTilt.onMouseMove}
                  onMouseLeave={targetTilt.onMouseLeave}
                  style={targetTilt.style}
                  className="glass-card p-6 text-center rounded-2xl h-full flex flex-col justify-center"
                >
                  <p className="text-4xl font-bold text-[#10B981] font-display">2.0 Tons</p>
                  <p className="text-sm font-bold text-white mt-2 font-display uppercase tracking-wide">Target Footprint</p>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans font-medium">
                    The target annual emissions per person required to halt global warming trends.
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div>
                <div
                  ref={thresholdTilt.ref}
                  onMouseMove={thresholdTilt.onMouseMove}
                  onMouseLeave={thresholdTilt.onMouseLeave}
                  style={thresholdTilt.style}
                  className="glass-card p-6 text-center rounded-2xl h-full flex flex-col justify-center"
                >
                  <p className="text-4xl font-bold text-[#FFD600] font-display">1.5°C</p>
                  <p className="text-sm font-bold text-white mt-2 font-display uppercase tracking-wide">Threshold Limit</p>
                  <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed font-sans font-medium">
                    The maximum global temperature rise limit to avoid severe climate impacts.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Section: How this app works */}
          <div
            ref={stepsTilt.ref}
            onMouseMove={stepsTilt.onMouseMove}
            onMouseLeave={stepsTilt.onMouseLeave}
            style={stepsTilt.style}
            className="glass-card p-6 md:p-8 space-y-6 rounded-3xl"
          >
            <h2 className="text-xl font-bold text-white uppercase tracking-wide text-center font-display">How CarbonWise Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Step 1 */}
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rotate-45 bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] flex items-center justify-center font-bold text-sm mx-auto rounded-xl font-display">
                  <span className="-rotate-45">I</span>
                </div>
                <h3 className="text-xs font-bold text-[#F7931A] uppercase tracking-widest font-display">Track Activities</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-sans font-medium">
                  Log your daily commutes, energy bill consumption, meals, and shopping purchases step-by-step.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rotate-45 bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] flex items-center justify-center font-bold text-sm mx-auto rounded-xl font-display">
                  <span className="-rotate-45">II</span>
                </div>
                <h3 className="text-xs font-bold text-[#F7931A] uppercase tracking-widest font-display">Analyze Trends</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-sans font-medium">
                  Examine weekly trend lines, category breakdowns, and compare your output against global averages.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rotate-45 bg-[#EA580C]/10 border border-[#EA580C]/40 text-[#F7931A] shadow-[0_0_15px_rgba(247,147,26,0.25)] flex items-center justify-center font-bold text-sm mx-auto rounded-xl font-display">
                  <span className="-rotate-45">III</span>
                </div>
                <h3 className="text-xs font-bold text-[#F7931A] uppercase tracking-widest font-display">Reduce Footprint</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-sans font-medium">
                  Mark daily tips as done, complete actionable checklist items, and unlock milestones badges!
                </p>
              </div>

            </div>
          </div>

          {/* Data Sources and Tech Stack */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Credits */}
            <div
              ref={creditsTilt.ref}
              onMouseMove={creditsTilt.onMouseMove}
              onMouseLeave={creditsTilt.onMouseLeave}
              style={creditsTilt.style}
              className="glass-card rounded-2xl p-6 space-y-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2 border-b border-white/10 pb-2.5">
                  <Database className="w-4 h-4 text-clay-success" />
                  Data &amp; Methodology
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-sans font-medium mt-3">
                  Emission factors and carbon conversions are modeled in equivalence values (CO₂e) based on established governmental and scientific datasets.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] font-bold text-[#10B981] bg-[#030304]/60 border border-[#10B981]/25 px-2.5 py-1 rounded-md font-mono select-none">EPA HUB</span>
                <span className="text-[10px] font-bold text-[#10B981] bg-[#030304]/60 border border-[#10B981]/25 px-2.5 py-1 rounded-md font-mono select-none">IPCC AR6</span>
                <span className="text-[10px] font-bold text-[#10B981] bg-[#030304]/60 border border-[#10B981]/25 px-2.5 py-1 rounded-md font-mono select-none">UK DEFRA</span>
              </div>
            </div>

            {/* Tech Stack */}
            <div
              ref={techTilt.ref}
              onMouseMove={techTilt.onMouseMove}
              onMouseLeave={techTilt.onMouseLeave}
              style={techTilt.style}
              className="glass-card rounded-2xl p-6 space-y-4"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Cpu className="w-4 h-4 text-clay-primary" />
                Technical Information
              </h3>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8] font-medium font-sans">App Version</span>
                  </div>
                  <span className="text-[11px] font-bold text-white font-mono bg-[#030304]/60 border border-white/10 px-2 py-0.5 rounded-md select-none">1.1.0 (Prod)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8] font-medium font-sans">Core Framework</span>
                  </div>
                  <span className="text-[11px] font-bold text-white font-mono bg-[#030304]/60 border border-white/10 px-2 py-0.5 rounded-md select-none">React 19 &amp; Vite</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <Paintbrush className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8] font-medium font-sans">Styling Engine</span>
                  </div>
                  <span className="text-[11px] font-bold text-white font-mono bg-[#030304]/60 border border-white/10 px-2 py-0.5 rounded-md select-none">Tailwind v4</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span className="text-xs text-[#94A3B8] font-medium font-sans">Charts &amp; Icons</span>
                  </div>
                  <span className="text-[11px] font-bold text-white font-mono bg-[#030304]/60 border border-white/10 px-2 py-0.5 rounded-md select-none">Recharts &amp; Lucide</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Profile Content */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          
          {/* Profile Completion Card */}
          <div
            ref={milestoneTilt.ref}
            onMouseMove={milestoneTilt.onMouseMove}
            onMouseLeave={milestoneTilt.onMouseLeave}
            style={milestoneTilt.style}
            className="glass-card p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-green-500/5 blur-xl" />
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider font-display">Setup Milestone</p>
                <h2 className="text-base font-bold text-white mt-0.5 font-display">Profile Setup Completion</h2>
              </div>
              <span className="text-sm font-bold text-[#F7931A] font-mono">{profileCompletion}% Complete</span>
            </div>
            
            {/* Progress Bar */}
            <ProgressBar
              value={profileCompletion}
              max={100}
              color="bg-gradient-to-r from-[#EA580C] to-[#F7931A]"
            />
            {profileCompletion < 100 ? (
              <p className="text-xs text-[#94A3B8] mt-3 font-sans font-medium flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#FFD600]" />
                Fill in your name and location to reach 100% and get tailored recommendations!
              </p>
            ) : (
              <p className="text-xs text-[#10B981] font-bold mt-3 flex items-center gap-1.5 font-sans">
                <CheckCircle className="w-4 h-4 text-[#10B981]" /> Profile fully completed! Excellent job.
              </p>
            )}
          </div>

          {/* Form */}
          <form
            ref={formTilt.ref}
            onMouseMove={formTilt.onMouseMove}
            onMouseLeave={formTilt.onMouseLeave}
            style={formTilt.style}
            onSubmit={handleSave}
            className="glass-card p-6 md:p-8 space-y-6 rounded-3xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Name */}
              <div>
                <label htmlFor="profile-name-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-display">
                  Your Display Name
                </label>
                <input
                  type="text"
                  id="profile-name-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-14 px-4 focus:outline-none text-sm transition-all"
                  aria-label="Your display name"
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="profile-location-input" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-display">
                  City &amp; Country
                </label>
                <LocationAutocomplete
                  id="profile-location-input"
                  value={location}
                  onChange={setLocation}
                  placeholder="e.g. London, UK"
                  className="w-full h-14 pr-4 focus:outline-none text-sm transition-all"
                  showIcon={true}
                  ariaLabel="City and country"
                />
              </div>

            </div>

            {/* Monthly CO2 Goal Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="profile-goal-slider" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                  Monthly Goal (kg CO₂)
                </label>
                <span className="text-xs font-bold text-[#F7931A] bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg shadow-sm font-mono">
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
                className="w-full h-2 bg-black/40 border border-white/10 rounded-full appearance-none cursor-pointer accent-[#F7931A] focus:outline-none"
                aria-label="Monthly goal footprint"
              />
              <div className="flex justify-between text-[10px] text-[#94A3B8] font-bold font-mono uppercase tracking-wide">
                <span>50 kg (Low Impact)</span>
                <span>500 kg (High Budget)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Diet Preference */}
              <div>
                <label htmlFor="profile-diet-select" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-display">
                  Default Diet Preference
                </label>
                <select
                  id="profile-diet-select"
                  value={dietPreference}
                  onChange={e => setDietPreference(e.target.value)}
                  className="w-full h-14 px-4 focus:outline-none text-sm transition-all cursor-pointer"
                  aria-label="Dietary preference"
                >
                  <option value="omnivore">Meat-Eater (Omnivore)</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                </select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label htmlFor="profile-vehicle-select" className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2 font-display">
                  Primary Commute Vehicle
                </label>
                <select
                  id="profile-vehicle-select"
                  value={vehicleType}
                  onChange={e => setVehicleType(e.target.value)}
                  className="w-full h-14 px-4 focus:outline-none text-sm transition-all cursor-pointer"
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
            <div className="space-y-4 pt-5 border-t border-white/10">
              <span className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider font-display">
                Notification Preferences
              </span>
              
              <div className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm font-display">Weekly Summary Reports</p>
                  <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 font-sans font-medium leading-relaxed">Receive reports containing weekly average trends</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTestNotification('weekly')}
                    className="h-8 px-2.5 sm:px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border border-white/10 hover:border-[#F7931A]/40 bg-white/5 hover:bg-[#F7931A]/10 text-[#94A3B8] hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Send a test weekly summary report"}
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTogglePreference('weeklyReport')}
                    className="text-[#94A3B8] hover:text-[#F7931A] transition-colors cursor-pointer focus:outline-none rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Toggle weekly summary reports"}
                    aria-label="Toggle weekly summary reports"
                  >
                    {weeklyReport && !isDisabled ? (
                      <ToggleRight className="w-8 h-8 sm:w-10 sm:h-10 text-[#F7931A] transition-all" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white/20 transition-all" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm font-display">Goal Alert Notifications</p>
                  <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 font-sans font-medium leading-relaxed">Get notified if monthly footprint exceeds target budget</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTestNotification('goal')}
                    className="h-8 px-2.5 sm:px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border border-white/10 hover:border-[#F7931A]/40 bg-white/5 hover:bg-[#F7931A]/10 text-[#94A3B8] hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Send a test goal alert"}
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTogglePreference('goalAlerts')}
                    className="text-[#94A3B8] hover:text-[#F7931A] transition-colors cursor-pointer focus:outline-none rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Toggle goal alerts notifications"}
                    aria-label="Toggle goal alerts notifications"
                  >
                    {goalAlerts && !isDisabled ? (
                      <ToggleRight className="w-8 h-8 sm:w-10 sm:h-10 text-[#F7931A] transition-all" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white/20 transition-all" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-3 border-b border-white/10 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm font-display">Eco Tip Recommendations</p>
                  <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5 font-sans font-medium leading-relaxed">Receive daily notifications recommending eco tips</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTestNotification('tip')}
                    className="h-8 px-2.5 sm:px-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border border-white/10 hover:border-[#F7931A]/40 bg-white/5 hover:bg-[#F7931A]/10 text-[#94A3B8] hover:text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Send a test eco tip recommendation"}
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleTogglePreference('ecoTips')}
                    className="text-[#94A3B8] hover:text-[#F7931A] transition-colors cursor-pointer focus:outline-none rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isDisabled ? (isNotificationSupported ? "Notifications are blocked in your browser settings." : "Notifications are not supported in this browser.") : "Toggle eco tip recommendations"}
                    aria-label="Toggle eco tip recommendations"
                  >
                    {ecoTips && !isDisabled ? (
                      <ToggleRight className="w-8 h-8 sm:w-10 sm:h-10 text-[#F7931A] transition-all" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 sm:w-10 sm:h-10 text-white/20 transition-all" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                className="btn-premium w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 h-14 cursor-pointer focus:outline-none font-display"
                aria-label="Save profile changes"
              >
                <Save className="w-4.5 h-4.5" />
                Save Profile
              </button>
            </div>

          </form>

          {/* Danger Zone */}
          <div
            ref={dangerTilt.ref}
            onMouseMove={dangerTilt.onMouseMove}
            onMouseLeave={dangerTilt.onMouseLeave}
            style={dangerTilt.style}
            className="border border-red-500/25 bg-red-500/5 rounded-3xl p-6 md:p-8 space-y-5 shadow-[0_0_20px_-5px_rgba(239,68,68,0.1)]"
          >
            <div>
              <h2 className="text-base font-bold text-red-500 uppercase tracking-wider flex items-center gap-2.5 font-display">
                <ShieldAlert className="w-5.5 h-5.5 text-red-500" />
                System Management (Danger Zone)
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed mt-1 font-sans font-medium">
                Perform diagnostics and reset system parameters. Clearing local data wipes all history.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClearData}
                className="btn-3d-destructive w-full sm:w-auto flex items-center justify-center gap-2.5 h-12 px-6 text-xs focus:outline-none"
                aria-label="Wipe all app data"
              >
                <Trash2 className="w-4.5 h-4.5" />
                Wipe All App Data
              </button>
            </div>
          </div>

        </div>
      )}

    </main>
  )
}

export default About

