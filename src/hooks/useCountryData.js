import { useState, useEffect, useCallback } from 'react'
import { Flag } from 'lucide-react'

/**
 * Known per-capita CO₂ emissions (tons/year) for common countries.
 * Source: Our World in Data, Global Carbon Project 2023.
 * Used as fallback if REST Countries API doesn't provide emission data.
 */
const CO2_PER_CAPITA = {
  india:           1.9,
  china:           8.0,
  'united states': 14.9,
  usa:             14.9,
  'united kingdom': 5.2,
  uk:              5.2,
  germany:         8.1,
  france:          4.6,
  japan:           8.6,
  australia:       15.0,
  canada:          14.2,
  brazil:          2.3,
  russia:          11.4,
  indonesia:       2.3,
  'south africa':  6.7,
  mexico:          3.6,
  'south korea':   11.6,
  italy:           5.3,
  spain:           5.1,
  turkey:          5.1,
  pakistan:         0.9,
  bangladesh:      0.6,
  nigeria:         0.6,
  egypt:           2.4,
  thailand:        3.6,
  vietnam:         3.5,
  philippines:     1.3,
  malaysia:        7.6,
  singapore:       8.9,
  'united arab emirates': 20.7,
  uae:             20.7,
  'saudi arabia':  15.3,
  nepal:           0.5,
  'sri lanka':     0.8,
  netherlands:     8.1,
  sweden:          3.6,
  norway:          7.5,
  denmark:         5.1,
  finland:         6.5,
  switzerland:     4.0,
  'new zealand':   6.2,
}

/**
 * useCountryData — Fetches country info from REST Countries API.
 *
 * When the user sets a location containing a country name:
 *  1. Fetches flag, population, region from REST Countries API
 *  2. Looks up per-capita CO₂ from our local database
 *  3. Generates motivational comparison messages
 *
 * Caches in sessionStorage to avoid redundant API calls.
 *
 * @param {string} locationStr — User's location string (e.g. "Mumbai, India")
 * @returns {{ countryData, co2PerCapita, motivationalMsg, isLoading, error }}
 */
export function useCountryData(locationStr) {
  const [countryData, setCountryData] = useState(null)
  const [co2PerCapita, setCo2PerCapita] = useState(null)
  const [motivationalMsg, setMotivationalMsg] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCountryData = useCallback(async (location) => {
    if (!location || location.trim().length < 2) {
      setCountryData(null)
      setCo2PerCapita(null)
      setMotivationalMsg(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Extract likely country name from location string
    // e.g. "Mumbai, India" → "India", or just "India"
    const parts = location.split(',').map(s => s.trim()).filter(Boolean)
    const searchTerm = parts[parts.length - 1] // last part is usually country

    const cacheKey = `carbonwise-country-${searchTerm.toLowerCase()}`

    // Check cache
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) { // 24h cache
          applyCountryData(data, searchTerm)
          setIsLoading(false)
          return
        }
      }
    } catch { /* ignore */ }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const response = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(searchTerm)}?fields=name,flags,population,region,cca2`,
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Country API returned ${response.status}`)
      }

      const data = await response.json()

      if (Array.isArray(data) && data.length > 0) {
        const country = data[0]
        const result = {
          name: country.name?.common || searchTerm,
          officialName: country.name?.official || '',
          flag: country.flags?.svg || country.flags?.png || '',
          flagIcon: country.flags?.alt ? null : Flag,
          population: country.population || 0,
          region: country.region || '',
          cca2: country.cca2 || '',
        }

        // Cache result
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }))
        } catch { /* ignore */ }

        applyCountryData(result, searchTerm)
      } else {
        throw new Error('Country not found')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch country data')
      setCountryData(null)
      // Still try to get CO2 data from local DB
      const localCo2 = lookupCO2(searchTerm)
      if (localCo2 !== null) {
        setCo2PerCapita(localCo2)
        setMotivationalMsg(buildMotivationalMsg(searchTerm, localCo2))
      } else {
        setCo2PerCapita(null)
        setMotivationalMsg(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  function applyCountryData(data, searchTerm) {
    setCountryData(data)
    const co2 = lookupCO2(data.name || searchTerm)
    setCo2PerCapita(co2)
    if (co2 !== null) {
      setMotivationalMsg(buildMotivationalMsg(data.name || searchTerm, co2))
    } else {
      setMotivationalMsg(null)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      fetchCountryData(locationStr)
    }, 100)
    return () => clearTimeout(t)
  }, [locationStr, fetchCountryData])

  return {
    countryData,
    co2PerCapita,
    motivationalMsg,
    isLoading,
    error,
  }
}

/**
 * Lookup CO₂ per capita from local database.
 */
function lookupCO2(countryName) {
  if (!countryName) return null
  const key = countryName.toLowerCase().trim()
  return CO2_PER_CAPITA[key] ?? null
}

/**
 * Build a motivational comparison message.
 */
function buildMotivationalMsg(countryName, co2Tons) {
  const monthlyKg = parseFloat(((co2Tons * 1000) / 12).toFixed(1))
  const dailyKg = parseFloat(((co2Tons * 1000) / 365).toFixed(1))

  return {
    country: countryName,
    yearlyTons: co2Tons,
    monthlyKg,
    dailyKg,
    text: `${countryName} average is ${co2Tons} tons/year (${dailyKg} kg/day)`,
    detail: `That's about ${monthlyKg} kg CO₂ per month per person`,
  }
}

export default useCountryData
