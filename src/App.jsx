import React, { Suspense, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import { useCarbon } from './context/CarbonContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import { Leaf } from 'lucide-react'
import { checkWeeklyDigest, checkDailyTipSuggestion } from './utils/notifications.js'
import { TIPS_DATA } from './data/tipsData.js'
import { useCountryData } from './hooks/useCountryData.js'

const Globe3D   = React.lazy(() => import('./components/Globe3D.jsx'))
const Dashboard  = React.lazy(() => import('./pages/Dashboard.jsx'))
const Calculator = React.lazy(() => import('./pages/Calculator.jsx'))
const Tips       = React.lazy(() => import('./pages/Tips.jsx'))
const History    = React.lazy(() => import('./pages/History.jsx'))
const About      = React.lazy(() => import('./pages/About.jsx'))

/** Full-screen globe background — fixed, behind all pages */
function GlobalGlobe() {
  const { state } = useCarbon()
  const location  = state?.userProfile?.location || null
  const { countryData } = useCountryData(location)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Smooth fade-in once the lazy-loaded Three.js component mounts
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 1.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
      }}
    >
      {/* The spinning globe at 900 px */}
      <div style={{ opacity: 0.75, filter: 'blur(0px)' }}>
        <Suspense fallback={null}>
          <Globe3D
            size={900}
            latitude={countryData?.latlng?.[0] ?? null}
            longitude={countryData?.latlng?.[1] ?? null}
          />
        </Suspense>
      </div>

      {/* Radial vignette — darkens edges so content is always readable */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, #030304 92%)',
        }}
      />
    </div>
  )
}


function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8" aria-label="Loading">
      {/* Spinning ring */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#D4AF37',
            borderRightColor: '#D4AF37',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 0 18px 4px rgba(212,175,55,0.35)',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-3 rounded-full border-4 border-transparent"
          style={{
            borderTopColor: '#4ade80',
            borderLeftColor: '#4ade80',
            animation: 'spin 0.7s linear infinite reverse',
            boxShadow: '0 0 12px 3px rgba(74,222,128,0.3)',
          }}
        />
        {/* Center leaf icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Leaf className="w-6 h-6 text-[#D4AF37]" style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' }} />
        </div>
      </div>

      {/* Brand name */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-2xl font-bold tracking-widest gradient-text font-display select-none">CarbonWise</span>
        {/* Animated dots */}
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]"
              style={{
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function PageSkeleton() {
  return <AppLoader />
}

function App() {
  const { state } = useCarbon()
  const { user, loading } = useAuth()
  const [isRegister, setIsRegister] = useState(false)
  const [showGlobe, setShowGlobe] = useState(false)

  useEffect(() => {
    // Delay rendering the globe until the page is interactive to optimize Lighthouse score / initial load
    const handleLoad = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => setShowGlobe(true), { timeout: 2500 })
      } else {
        setTimeout(() => setShowGlobe(true), 2000)
      }
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    if (!user) return

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
  }, [user, state?.carbonEntries, state?.completedTips])

  return (
    <div className="min-h-screen text-clay-text relative flex flex-col">
      {/* ── Fixed global backgrounds (z-index layering) ── */}
      {/* 1. Full-screen spinning globe (deferred load) */}
      {showGlobe && <GlobalGlobe />}
      {/* 2. Subtle grid lines on top */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden bg-grid-pattern" aria-hidden="true" style={{ zIndex: 1 }} />
      {/* 3. Warm sunburst glow at top */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden art-sunburst" aria-hidden="true" style={{ zIndex: 1 }} />

      {/* Main content layer */}
      <div className="relative flex-1 flex flex-col" style={{ zIndex: 2 }}>
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <AppLoader />
          </div>
        ) : !user ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0F1115]/90 backdrop-blur-lg border-b border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-7 h-7 rotate-45 border border-[#F7931A]/40 flex items-center justify-center bg-[#0F1115] rounded-md">
                    <Leaf className="-rotate-45 w-4 h-4 text-[#F7931A]" />
                  </div>
                  <span className="text-xl font-bold gradient-text tracking-wider select-none font-display">CarbonWise</span>
                </div>
              </div>
            </header>

            {/* Main Auth Form Container */}
            <main className="flex-1 flex items-center justify-center">
              {isRegister ? (
                <Register onToggleAuthMode={() => setIsRegister(false)} />
              ) : (
                <Login onToggleAuthMode={() => setIsRegister(true)} />
              )}
            </main>
          </div>
        ) : (
          <>
            <Navbar />
            <main id="main-content" className="pt-20 pb-20 md:pb-0 flex-1 flex flex-col">
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
          </>
        )}
      </div>
    </div>
  )
}

export default App
