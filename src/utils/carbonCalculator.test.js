import { describe, it, expect } from 'vitest'
import {
  calculateTransport,
  calculateEnergy,
  calculateTotal,
  getEmissionLevel
} from './carbonCalculator'

describe('carbonCalculator utilities', () => {
  describe('calculateTransport', () => {
    it('should calculate correct emissions for petrol car', () => {
      expect(calculateTransport('car_petrol', 10)).toBe(2.1)
    })

    it('should return 0 for 0 km', () => {
      expect(calculateTransport('car_petrol', 0)).toBe(0)
    })

    it('should return 0 for negative distance', () => {
      expect(calculateTransport('car_petrol', -10)).toBe(0)
    })

    it('should return 0 for unknown vehicle mode', () => {
      expect(calculateTransport('unknown_mode', 10)).toBe(0)
    })
  })

  describe('calculateEnergy', () => {
    it('should calculate correct emissions for electricity', () => {
      expect(calculateEnergy('electricity', 5)).toBe(4.1)
    })

    it('should return 0 for negative energy usage', () => {
      expect(calculateEnergy('electricity', -5)).toBe(0)
    })

    it('should return 0 for unknown energy type', () => {
      expect(calculateEnergy('unknown_energy', 10)).toBe(0)
    })
  })

  describe('calculateTotal', () => {
    it('should calculate the total carbon footprint for mixed inputs', () => {
      const inputs = {
        transport: [
          { mode: 'car_petrol', km: 10 },
          { mode: 'bus', km: 20 }
        ],
        energy: [
          { type: 'electricity', amount: 5 }
        ],
        food: [
          { type: 'vegan_meal', amount: 2 }
        ],
        shopping: [
          { type: 'clothing', quantity: 1 }
        ]
      }

      // Calculations:
      // Transport: car_petrol (10 * 0.21 = 2.1) + bus (20 * 0.089 = 1.78) = 3.88
      // Energy: electricity (5 * 0.82 = 4.10) = 4.1
      // Food: vegan_meal (2 * 0.5 = 1.0) = 1.0
      // Shopping: clothing (1 * 10 = 10.0) = 10.0
      // Total = 3.88 + 4.10 + 1.0 + 10.0 = 18.98
      const result = calculateTotal(inputs)
      expect(result.total).toBe(18.98)
      expect(result.category_totals.transport).toBe(3.88)
      expect(result.category_totals.energy).toBe(4.1)
      expect(result.category_totals.food).toBe(1)
      expect(result.category_totals.shopping).toBe(10)
    })

    it('should return 0 total and empty comparison metadata for empty inputs', () => {
      const result = calculateTotal({})
      expect(result.total).toBe(0)
      expect(result.breakdown).toEqual([])
    })
  })

  describe('getEmissionLevel', () => {
    it('should correctly classify emission levels', () => {
      // low < 100
      expect(getEmissionLevel(50).level).toBe('low')
      
      // medium 100 to 333
      expect(getEmissionLevel(150).level).toBe('medium')
      
      // high 333 to 667
      expect(getEmissionLevel(400).level).toBe('high')
      
      // critical > 667
      expect(getEmissionLevel(800).level).toBe('critical')
    })
  })
})
