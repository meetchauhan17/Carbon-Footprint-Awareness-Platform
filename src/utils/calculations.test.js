import { describe, it, expect } from 'vitest'
import {
  calculateCO2,
  getTotalCO2,
  getCategoryBreakdown,
  getWeeklyData,
  formatCO2,
  getMonthlyData
} from './calculations'

describe('calculations.js Utilities', () => {
  describe('calculateCO2', () => {
    it('calculates correct CO2 for valid category and item', () => {
      expect(calculateCO2('transport', 'car', 10)).toBe(2.1)
      expect(calculateCO2('energy', 'electricity', 10)).toBe(5)
    })

    it('returns 0 for invalid category or item', () => {
      expect(calculateCO2('invalid', 'car', 10)).toBe(0)
      expect(calculateCO2('transport', 'spaceship', 10)).toBe(0)
    })
  })

  describe('getTotalCO2', () => {
    it('returns sum of totalCO2 in entries', () => {
      const entries = [
        { totalCO2: 1.5 },
        { totalCO2: 2.2 },
        { totalCO2: 0.3 }
      ]
      expect(getTotalCO2(entries)).toBe(4)
    })

    it('handles entries with missing totalCO2', () => {
      const entries = [
        { totalCO2: 1.5 },
        { someOtherProp: 10 },
        { totalCO2: 0.5 }
      ]
      expect(getTotalCO2(entries)).toBe(2)
    })
  })

  describe('getCategoryBreakdown', () => {
    it('returns breakdown by category correctly format', () => {
      const entries = [
        { category: 'transport', totalCO2: 2.5 },
        { category: 'energy', totalCO2: 4.1 },
        { category: 'food', totalCO2: 1.0 },
        { category: 'waste', totalCO2: 0.5 },
        { category: 'invalid', totalCO2: 10.0 }
      ]
      const breakdown = getCategoryBreakdown(entries)
      expect(breakdown).toContainEqual({ name: 'Transport', value: 2.5 })
      expect(breakdown).toContainEqual({ name: 'Energy', value: 4.1 })
      expect(breakdown).toContainEqual({ name: 'Food', value: 1.0 })
      expect(breakdown).toContainEqual({ name: 'Waste', value: 0.5 })
    })
  })

  describe('getWeeklyData', () => {
    it('returns array of 7 elements with day and co2', () => {
      const entries = [
        { date: new Date().toISOString(), totalCO2: 5.5 }
      ]
      const weekly = getWeeklyData(entries)
      expect(weekly).toHaveLength(7)
      expect(weekly[6].co2).toBe(5.5)
    })
  })

  describe('formatCO2', () => {
    it('formats as t for >= 1000 kg', () => {
      expect(formatCO2(1200)).toBe('1.2 t')
      expect(formatCO2(1000)).toBe('1.0 t')
    })

    it('formats as kg for < 1000 kg', () => {
      expect(formatCO2(450.5)).toBe('450.5 kg')
      expect(formatCO2(5)).toBe('5.0 kg')
    })
  })

  describe('getMonthlyData', () => {
    it('returns array of 30 elements with day and co2', () => {
      const entries = [
        { date: new Date().toISOString(), totalCO2: 12.2 }
      ]
      const monthly = getMonthlyData(entries)
      expect(monthly).toHaveLength(30)
      expect(monthly[29].co2).toBe(12.2)
    })
  })
})
