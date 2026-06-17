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
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-green-100 shadow-sm transition-all duration-200 ${className}`}
      role="navigation"
      aria-label="Main Navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none rounded-xl" id="nav-logo" aria-label="CarbonWise Home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all" aria-hidden="true">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight select-none">CarbonWise</span>
          </NavLink>

          {/* Desktop nav links + Daily Badge */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-250 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
                      isActive
                        ? 'bg-green-600 text-white shadow-md shadow-green-100'
                        : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                    }`
                  }
                  aria-label={`Navigate to ${label}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Today's Emission Total Badge */}
            <div 
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold shadow-sm select-none"
              title="Today's total carbon emissions logged"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Today: {todayTotal.toFixed(1)} kg CO₂</span>
            </div>
          </div>

          {/* Mobile elements (Hamburguer and Daily Badge) */}
          <div className="flex items-center gap-2 md:hidden">
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-50 border border-green-150 text-green-700 text-xs font-bold select-none"
              title="Today's total emissions logged"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>{todayTotal.toFixed(1)} kg</span>
            </div>
            <button
              id="mobile-menu-toggle"
              className="p-2 rounded-xl text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none"
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
          <div className="bg-white/95 backdrop-blur-xl border-t border-green-100 shadow-xl px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                id={`mobile-nav-${label.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus:outline-none ${
                    isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
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
