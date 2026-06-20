import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Leaf, LayoutDashboard, Calculator, Lightbulb, Clock, Info, LogOut } from 'lucide-react'
import { useCarbon } from '../context/CarbonContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/calculator', label: 'Calculator', icon: Calculator },
  { to: '/tips', label: 'Eco Tips', icon: Lightbulb },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/about', label: 'About', icon: Info },
]

/**
 * Navbar - Sticky top navigation bar. Includes logo, route links, hamburger menus, and daily emissions counters.
 */
export default function Navbar({ className = '' }) {
  const { state } = useCarbon()
  const { user, logout } = useAuth()
  const { carbonEntries } = state || { carbonEntries: [] }

  // Calculate today's emissions total
  const todayTotal = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return (carbonEntries || [])
      .filter(e => e.date?.startsWith(todayStr))
      .reduce((sum, e) => sum + e.totalCO2, 0)
  }, [carbonEntries])

  return (
    <>
      <nav
      id="main-navbar"
      className={`sticky top-0 z-50 bg-[#0F1115]/90 backdrop-blur-lg border-b border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-200 ${className}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 sm:gap-4 group focus:outline-none" id="nav-logo" aria-label="CarbonWise Home">
            <div className="w-7 h-7 rotate-45 border border-[#F7931A]/40 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all bg-[#0F1115] rounded-md" aria-hidden="true">
              <Leaf className="-rotate-45 w-4 h-4 text-[#F7931A]" />
            </div>
            <span className="text-xl font-bold gradient-text tracking-wider select-none font-display">CarbonWise</span>
          </NavLink>

          {/* Desktop nav links + Daily Badge */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none tracking-wider uppercase border font-mono ${
                      isActive
                        ? 'bg-[#F7931A]/10 text-[#F7931A] border-[#F7931A]/30 shadow-[0_0_15px_rgba(247,147,26,0.15)] rounded-full'
                        : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-white/5 rounded-full'
                    }`
                  }
                  aria-label={`Navigate to ${label}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Today's Emission Total Badge */}
            <div 
              className="flex items-center gap-2 px-3.5 py-2 border border-[#F7931A]/20 text-[#F7931A] text-xs font-bold bg-[#0F1115] rounded-full select-none tracking-wider uppercase font-mono shadow-[0_0_12px_rgba(247,147,26,0.08)]"
              title="Today's total carbon emissions logged"
            >
              <span className="w-1.5 h-1.5 bg-[#F7931A] rounded-full animate-pulse" />
              <span>Today: {todayTotal.toFixed(1)} kg CO₂</span>
            </div>

            {/* User Profile display + Logout */}
            {user && (
              <div className="flex items-center gap-3.5 pl-2 border-l border-white/10">
                <span className="text-xs text-[#94A3B8] font-semibold max-w-[120px] truncate" title={user.name || user.email}>
                  {user.name || user.email.split('@')[0]}
                </span>
                <button
                  onClick={logout}
                  className="p-2 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-full transition-all cursor-pointer focus:outline-none"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile elements (Daily Badge only) */}
          <div className="flex items-center gap-2 md:hidden">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#F7931A]/20 text-[#F7931A] text-xs font-bold bg-[#0F1115] rounded-full select-none tracking-wide uppercase font-mono shadow-[0_0_12px_rgba(247,147,26,0.08)]"
              title="Today's total emissions logged"
            >
              <span className="w-1.5 h-1.5 bg-[#F7931A] rounded-full animate-pulse" />
              <span>{todayTotal.toFixed(1)} kg</span>
            </div>
            {user && (
              <button
                onClick={logout}
                className="p-2 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-full transition-all cursor-pointer focus:outline-none"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Sticky Bottom Tab Bar */}
      <div 
        id="mobile-bottom-nav" 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0F1115]/95 backdrop-blur-lg border-t border-white/10 shadow-[0_-5px_15px_rgba(0,0,0,0.5)]"
      >
        <div className="grid grid-cols-5 h-16 w-full max-w-md mx-auto px-2">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const displayLabel = label === 'Eco Tips' ? 'Tips' : label
            return (
              <NavLink
                key={to}
                to={to}
                id={`mobile-nav-${displayLabel.toLowerCase()}`}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 transition-all duration-200 focus:outline-none ${
                    isActive
                      ? 'text-[#F7931A]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`
                }
                aria-label={`Navigate to ${label}`}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                    <span className="text-[10px] font-bold tracking-wider font-mono uppercase">{displayLabel}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>
    </>
  )
}
