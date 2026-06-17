import { useState, useEffect, useCallback } from 'react'
import environmentalQuotes from '../data/environmentalQuotes.js'

/**
 * useQuote — Provides a rotating environmental quote.
 *
 * Strategy:
 *  1. Try Quotable API (tags=environment) — often unreliable/down
 *  2. Fall back to local curated quotes (always works)
 *
 * Caches in sessionStorage to avoid redundant calls.
 * Rotates daily by default, or manually via `nextQuote()`.
 *
 * @returns {{ quote, isLoading, error, nextQuote }}
 */
export function useQuote() {
  const [quote, setQuote] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cacheKey = 'carbonwise-quote'

  /**
   * Pick a local quote deterministically by day, or randomly if manual.
   */
  const pickLocalQuote = useCallback((random = false) => {
    const index = random
      ? Math.floor(Math.random() * environmentalQuotes.length)
      : new Date().getDate() % environmentalQuotes.length
    return environmentalQuotes[index]
  }, [])

  const fetchQuote = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        // Cache valid for 1 hour
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          setQuote(data)
          setIsLoading(false)
          return
        }
      }
    } catch {
      // Ignore cache errors
    }

    try {
      // Try Quotable API first (5s timeout — it's often down)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        'https://api.quotable.io/quotes/random?tags=environment',
        { signal: controller.signal }
      )
      clearTimeout(timeoutId)

      if (!response.ok) throw new Error('Quotable API returned error')

      const data = await response.json()
      const result = Array.isArray(data) && data.length > 0
        ? { content: data[0].content, author: data[0].author }
        : pickLocalQuote()

      setQuote(result)

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: result, timestamp: Date.now() }))
      } catch { /* ignore */ }
    } catch {
      // API down — use local quotes (no error shown to user, just graceful fallback)
      const localQuote = pickLocalQuote()
      setQuote(localQuote)
      setError(null) // Don't show error for expected fallback

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ data: localQuote, timestamp: Date.now() }))
      } catch { /* ignore */ }
    } finally {
      setIsLoading(false)
    }
  }, [pickLocalQuote])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  /**
   * Manually cycle to a new random quote.
   */
  const nextQuote = useCallback(() => {
    const newQuote = pickLocalQuote(true)
    setQuote(newQuote)
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: newQuote, timestamp: Date.now() }))
    } catch { /* ignore */ }
  }, [pickLocalQuote])

  return {
    quote,
    isLoading,
    error,
    nextQuote,
  }
}

export default useQuote
