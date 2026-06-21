import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

/**
 * LocationAutocomplete - Reusable input component with OpenStreetMap Nominatim geocoding autocomplete suggestions.
 * 
 * Props:
 * - id: string (input element id)
 * - value: string (current location string)
 * - onChange: function (callback when value/selection changes)
 * - placeholder: string (input placeholder)
 * - className: string (CSS classes for the input element)
 * - showIcon: boolean (if true, shows MapPin icon and applies pl-12 padding)
 * - ariaLabel: string (ARIA label for accessibility)
 */
export default function LocationAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  className = '',
  showIcon = false,
  ariaLabel
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef(null)

  // Fetch suggestions with debouncing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      if (suggestions.length > 0) setSuggestions([])
      if (isOpen) setIsOpen(false)
      return
    }

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      try {
        const controller = new AbortController()
        const signal = controller.signal
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&addressdetails=1&limit=10`

        const response = await fetch(url, {
          signal,
          headers: {
            'User-Agent': 'CarbonWise-App/1.0 (meetchauhan17/Carbon-Footprint-Awareness-Platform)'
          }
        })
        if (response.ok) {
          const results = await response.json()
          
          const formatted = results.map((item) => {
            const addr = item.address || {}
            const place = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county
            const region = addr.state || addr.province || addr.region
            const country = addr.country
            
            // Build unique, clean label parts
            const parts = []
            if (place) parts.push(place)
            if (region && region !== place) parts.push(region)
            if (country && country !== region && country !== place) parts.push(country)
            
            const label = parts.length > 0 ? parts.join(', ') : item.display_name
            
            return {
              label,
              latitude: parseFloat(item.lat),
              longitude: parseFloat(item.lon)
            }
          })
          
          // Deduplicate suggestions by label
          const uniqueSuggestions = []
          const seen = new Set()
          for (const item of formatted) {
            if (!seen.has(item.label)) {
              seen.add(item.label)
              uniqueSuggestions.push(item)
            }
          }
          
          setSuggestions(uniqueSuggestions)
          setIsOpen(uniqueSuggestions.length > 0)
        } else {
          setSuggestions([])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Geocoding error:', err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 400) // 400ms debounce delay to respect OSM's Nominatim usage policy

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Handle clicking outside to close the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Input change handler
  const handleInputChange = (e) => {
    const val = e.target.value
    onChange(val)
    setSearchQuery(val)
    setActiveIdx(-1)
  }

  // Suggestion selection handler
  const handleSelect = (item) => {
    onChange(item.label)
    setSuggestions([])
    setIsOpen(false)
    setSearchQuery('')
    setActiveIdx(-1)
  }

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && activeIdx < suggestions.length) {
        e.preventDefault()
        handleSelect(suggestions[activeIdx])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full font-sans">
      {showIcon && (
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
      )}
      
      <input
        type="text"
        id={id}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${showIcon ? 'pl-12' : ''}`}
        aria-label={ariaLabel}
        autoComplete="off"
      />

      {/* Loading indicator inside input */}
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Loader2 className="w-4 h-4 text-[#F7931A] animate-spin" />
        </div>
      )}

      {/* Autocomplete Dropdown List */}
      {isOpen && suggestions.length > 0 && (
        <div 
          className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-[#0F1115]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] overflow-hidden"
          role="listbox"
        >
          {suggestions.map((item, index) => {
            const isActive = index === activeIdx
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIdx(index)}
                className={`w-full px-4 py-3 text-sm text-left border-b border-white/5 last:border-b-0 cursor-pointer transition-colors duration-150 block ${
                  isActive 
                    ? 'text-white bg-[#F7931A]/20' 
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#F7931A]/10'
                }`}
                role="option"
                aria-selected={isActive}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#F7931A]/80" />
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
