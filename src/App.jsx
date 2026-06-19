import React, { Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { useCarbon } from './context/CarbonContext.jsx'
import { checkWeeklyDigest, checkDailyTipSuggestion } from './utils/notifications.js'
import { TIPS_DATA } from './data/tipsData.js'

const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'))
const Calculator = React.lazy(() => import('./pages/Calculator.jsx'))
const Tips = React.lazy(() => import('./pages/Tips.jsx'))
const History = React.lazy(() => import('./pages/History.jsx'))
const About = React.lazy(() => import('./pages/About.jsx'))

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse" aria-hidden="true">
      {/* Hero banner skeleton */}
      <div className="h-36 bg-[#141414]/85 rounded-none w-full border border-[#D4AF37]/20"></div>
      
      {/* Stats/Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-44 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
        <div className="h-44 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
        <div className="h-44 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
      </div>
      
      {/* Content area skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-8 bg-[#141414]/85 rounded-none w-1/3 border border-[#D4AF37]/20"></div>
          <div className="h-64 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
        </div>
        <div className="space-y-6">
          <div className="h-8 bg-[#141414]/85 rounded-none w-1/2 border border-[#D4AF37]/20"></div>
          <div className="h-48 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
          <div className="h-48 bg-[#141414]/85 rounded-none border border-[#D4AF37]/20"></div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const { state } = useCarbon()

  useEffect(() => {
    // Run initial checks on app load after 3 seconds to unblock main thread
    const t = setTimeout(() => {
      checkWeeklyDigest()
      checkDailyTipSuggestion(TIPS_DATA)
    }, 3000)

    // Run scheduled reminders periodically in the background (every minute)
    const interval = setInterval(() => {
      checkWeeklyDigest()
      checkDailyTipSuggestion(TIPS_DATA)
    }, 60000)

    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  }, [state?.carbonEntries, state?.completedTips])

  return (
    <div className="min-h-screen text-clay-text relative">
      {/* Bitcoin DeFi Network Grid and Ambient Sunburst Overlay */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 bg-grid-pattern" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10 art-sunburst" aria-hidden="true" />

      <Navbar />
      <main id="main-content" className="pt-20">
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/tips" element={<Tips />} />
            <Route path="/history" element={<History />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

export default App
