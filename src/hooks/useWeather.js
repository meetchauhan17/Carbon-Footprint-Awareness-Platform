import { useState, useEffect, useCallback, useRef } from 'react'
import { Flame, Sun, CloudSun, Rainbow, Cloud, Snowflake } from 'lucide-react'

/**
 * useWeather — Fetches current temperature from Open-Meteo API.
 *
 * Flow:
 *  1. If `location` string is provided, geocode it via Open-Meteo Geocoding API
 *     (https://geocoding-api.open-meteo.com/v1/search) — free, no key needed.
 *  2. Use the resolved lat/lon to fetch weather from Open-Meteo Forecast API.
 *  3. Falls back to Surat, India (lat 21.17, lon 72.83) if no location is given
 *     or geocoding fails.
 *
 * Caches both geocoding results and weather in sessionStorage.
 *
 * @param {string} [location] - User's location string, e.g. "Mumbai, India" or "London"
 * @returns {{ temperature, resolvedCity, weatherTip, isLoading, error, refetch }}
 */

const SURAT_FALLBACK = { lat: 21.17, lon: 72.83, name: 'Surat, India' }

export function useWeather(location) {
  const [temperature, setTemperature] = useState(null)
  const [resolvedCity, setResolvedCity] = useState(null) // actual city name from geocoder
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Avoid stale closure: store latest location in a ref for the callback
  const locationRef = useRef(location)
  useEffect(() => { locationRef.current = location }, [location])

  const fetchWeather = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const loc = locationRef.current

    // ── Step 1: Resolve lat/lon ──────────────────────────────────────
    let geoResult = SURAT_FALLBACK

    if (loc && loc.trim().length >= 2) {
      // Extract city name — use the first part before a comma, or the whole string
      const searchTerm = loc.split(',')[0].trim()
      const geoCacheKey = `carbonwise-geo-${searchTerm.toLowerCase()}`

      // Check geocoding cache (24h)
      try {
        const cached = sessionStorage.getItem(geoCacheKey)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            geoResult = data
          }
        }
      } catch { /* ignore */ }

      // If not cached, call geocoding API
      if (geoResult === SURAT_FALLBACK) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchTerm)}&count=1&language=en&format=json`
          const geoRes = await fetch(geoUrl, { signal: controller.signal })
          clearTimeout(timeoutId)

          if (geoRes.ok) {
            const geoData = await geoRes.json()
            const result = geoData?.results?.[0]
            if (result) {
              // Build a clean display name: "City, Country"
              const country = result.country || ''
              const city = result.name || searchTerm
              const displayName = country ? `${city}, ${country}` : city

              geoResult = { lat: result.latitude, lon: result.longitude, name: displayName }

              // Cache geocoding result
              try {
                sessionStorage.setItem(geoCacheKey, JSON.stringify({
                  data: geoResult,
                  timestamp: Date.now(),
                }))
              } catch { /* sessionStorage full */ }
            }
          }
        } catch {
          // Geocoding failed — fall through to Surat default
        }
      }
    }

    setResolvedCity(geoResult.name)

    // ── Step 2: Fetch weather for resolved coords ────────────────────
    const weatherCacheKey = `carbonwise-weather-${geoResult.lat.toFixed(2)}-${geoResult.lon.toFixed(2)}`

    // Check weather cache (30 min)
    try {
      const cached = sessionStorage.getItem(weatherCacheKey)
      if (cached) {
        const { temp, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setTemperature(temp)
          setIsLoading(false)
          return
        }
      }
    } catch { /* ignore */ }

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geoResult.lat}&longitude=${geoResult.lon}&current=temperature_2m,apparent_temperature,weathercode`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(weatherUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error(`Weather API returned ${response.status}`)

      const data = await response.json()
      const temp = data?.current?.temperature_2m ?? null

      if (temp !== null) {
        setTemperature(temp)
        try {
          sessionStorage.setItem(weatherCacheKey, JSON.stringify({ temp, timestamp: Date.now() }))
        } catch { /* ignore */ }
      } else {
        throw new Error('Temperature data missing')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch weather')
      setTemperature(null)
    } finally {
      setIsLoading(false)
    }
  }, []) // stable — reads location via ref

  // Re-fetch when location string changes
  useEffect(() => {
    // Clear cached resolved city when location changes so UI updates
    setResolvedCity(null)
    setTemperature(null)
    fetchWeather()
  }, [location, fetchWeather]) // eslint-disable-line react-hooks/exhaustive-deps

  // Generate a contextual eco tip based on temperature
  const weatherTip = getWeatherTip(temperature)

  return {
    temperature,
    resolvedCity: resolvedCity ?? (location?.trim() ? location : SURAT_FALLBACK.name),
    weatherTip,
    isLoading,
    error,
    refetch: fetchWeather,
  }
}

/**
 * Generates a contextual eco tip based on the current temperature.
 */
function getWeatherTip(temp) {
  if (temp === null) return null

  if (temp >= 40) {
    return {
      message: `Extreme heat (${temp}°C) — stay indoors & use fans instead of AC`,
      icon: Flame,
      severity: 'critical',
      savings: 'Fans use 90% less energy than air conditioning',
    }
  }
  if (temp >= 35) {
    return {
      message: `Very hot today (${temp}°C) — consider using fans instead of AC`,
      icon: Sun,
      severity: 'high',
      savings: 'Fans use 90% less energy than AC',
    }
  }
  if (temp >= 30) {
    return {
      message: `Warm day (${temp}°C) — set your AC to 24°C to save energy`,
      icon: CloudSun,
      severity: 'medium',
      savings: 'Each °C higher saves ~6% cooling energy',
    }
  }
  if (temp >= 20) {
    return {
      message: `Pleasant weather (${temp}°C) — open windows instead of using AC`,
      icon: Rainbow,
      severity: 'low',
      savings: 'Natural ventilation = zero carbon cooling',
    }
  }
  if (temp >= 10) {
    return {
      message: `Cool day (${temp}°C) — layer up before turning on the heater`,
      icon: Cloud,
      severity: 'medium',
      savings: 'Lowering heating by 1°C saves ~10% energy',
    }
  }
  return {
    message: `Cold today (${temp}°C) — use a blanket before cranking up the heater`,
    icon: Snowflake,
    severity: 'high',
    savings: 'Electric heaters use ~2 kWh/hour',
  }
}

export default useWeather
