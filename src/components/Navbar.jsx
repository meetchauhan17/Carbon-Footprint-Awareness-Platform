import React, { useState, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { Leaf, LayoutDashboard, Calculator, Lightbulb, Clock, Info, Menu, X } from 'lucide-react'
import { useCarbon } from '../context/CarbonContext.jsx'

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
  const [mobileOpen, setMobileOpen] = useState(false)
  const { state } = useCarbon()
  const { carbonEntries } = state

  // Calculate today's emissions total
  const todayTotal = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return carbonEntries
      .filter(e => e.date?.startsWith(todayStr))
      .reduce((sum, e) => sum + e.totalCO2, 0)
  }, [carbonEntries])

  return (
    <nav
      id="main-navbar"
      className={`sticky top-0 z-50 bg-[#0F1115]/90 backdrop-blur-lg border-b border-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-200 ${className}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-4 group focus:outline-none" id="nav-logo" aria-label="CarbonWise Home">
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
          </div>

          {/* Mobile elements (Hamburguer and Daily Badge) */}
          <div className="flex items-center gap-2 md:hidden">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#F7931A]/20 text-[#F7931A] text-xs font-bold bg-[#0F1115] rounded-full select-none tracking-wide uppercase font-mono shadow-[0_0_12px_rgba(247,147,26,0.08)]"
              title="Today's total emissions logged"
            >
              <span className="w-1.5 h-1.5 bg-[#F7931A] rounded-full animate-pulse" />
              <span>{todayTotal.toFixed(1)} kg</span>
            </div>
            <button
              id="mobile-menu-toggle"
              className="p-2 text-[#FFFFFF] hover:text-[#F7931A] transition-colors cursor-pointer focus:outline-none"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu-items"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div id="mobile-menu-items" className="md:hidden animate-fade-in-up">
          <div className="bg-[#030304]/95 border-t border-white/10 shadow-xl px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                id={`mobile-nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 text-sm font-bold tracking-wider uppercase transition-all focus:outline-none font-mono rounded-lg ${
                    isActive
                      ? 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/20'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`
                }
                aria-label={`Navigate to ${label}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
