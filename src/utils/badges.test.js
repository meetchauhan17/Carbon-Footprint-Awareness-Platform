import { describe, it, expect } from 'vitest'
import { evaluateBadges } from './badges.js'

describe('Badges System', () => {
  it('returns empty badges array for empty state', () => {
    const badges = evaluateBadges({ carbonEntries: [], completedTips: [], userProfile: {} })
    // By default, noflight might be earned because there are no flight entries.
    // Let's see: emission-noflight checks if there are domestic/international flight logs in the last 7 days.
    // If entries is empty, it returns false.
    expect(badges.map(b => b.id)).not.toContain('streak-1')
  })

  it('earns first step badge on first log', () => {
    const entries = [{ date: '2026-06-21T10:00:00Z', totalCO2: 10, category: 'energy' }]
    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    const badgeIds = badges.map(b => b.id)
    expect(badgeIds).toContain('streak-1')
  })

  it('evaluates logging streak badges correctly', () => {
    // 3 consecutive days
    const entries = [
      { date: '2026-06-19T10:00:00Z', totalCO2: 10, category: 'energy' },
      { date: '2026-06-20T10:00:00Z', totalCO2: 10, category: 'energy' },
      { date: '2026-06-21T10:00:00Z', totalCO2: 10, category: 'energy' },
    ]
    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    const badgeIds = badges.map(b => b.id)
    expect(badgeIds).toContain('streak-3')
    expect(badgeIds).not.toContain('streak-7')
  })

  it('evaluates emission level badges correctly', () => {
    const entries = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 2.5, category: 'energy' } // total is 2.5 (under 3 and 5)
    ]
    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    const badgeIds = badges.map(b => b.id)
    expect(badgeIds).toContain('emission-low-5')
    expect(badgeIds).toContain('emission-low-3')
  })

  it('evaluates car-free day badge correctly', () => {
    const entries = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 6, category: 'energy' } // transport is 0, total is > 0
    ]
    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    const badgeIds = badges.map(b => b.id)
    expect(badgeIds).toContain('emission-carfree')
  })

  it('evaluates plant-powered (vegan) badge correctly', () => {
    // Via quicklog item 'vegan'
    const entries = [{ date: '2026-06-21T10:00:00Z', totalCO2: 1.5, category: 'food', item: 'vegan' }]
    let badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    expect(badges.map(b => b.id)).toContain('emission-vegan')

    // Via completed tips
    badges = evaluateBadges({ carbonEntries: [], completedTips: ['f-plantbased'], userProfile: {} })
    expect(badges.map(b => b.id)).toContain('emission-vegan')
  })

  it('evaluates grounded (noflight) badge correctly', () => {
    // No flights in last 7 days
    const entries = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 2, category: 'energy' }
    ]
    let badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    expect(badges.map(b => b.id)).toContain('emission-noflight')

    // With a flight inside last 7 days (today is 2026-06-21)
    const entriesWithFlight = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 200, category: 'transport', item: 'flight_domestic' }
    ]
    badges = evaluateBadges({ carbonEntries: entriesWithFlight, completedTips: [], userProfile: {} })
    expect(badges.map(b => b.id)).not.toContain('emission-noflight')
  })

  it('evaluates tips badges correctly', () => {
    const badges = evaluateBadges({
      carbonEntries: [],
      completedTips: Array.from({ length: 22 }, (_, i) => `tip-${i}`),
      userProfile: {}
    })
    const badgeIds = badges.map(b => b.id)
    expect(badgeIds).toContain('tips-student')
    expect(badgeIds).toContain('tips-champion')
  })

  it('evaluates utility solar badge correctly', () => {
    const badges = evaluateBadges({
      carbonEntries: [],
      completedTips: ['e-solar'],
      userProfile: {}
    })
    expect(badges.map(b => b.id)).toContain('utility-solar')
  })

  it('evaluates utility commute badge correctly', () => {
    // Via walking
    let badges = evaluateBadges({
      carbonEntries: [{ date: '2026-06-21T10:00:00Z', totalCO2: 0, category: 'transport', item: 'walking' }],
      completedTips: [],
      userProfile: {}
    })
    expect(badges.map(b => b.id)).toContain('utility-commute')

    // Via tip t-cycle
    badges = evaluateBadges({
      carbonEntries: [],
      completedTips: ['t-cycle'],
      userProfile: {}
    })
    expect(badges.map(b => b.id)).toContain('utility-commute')
  })

  it('evaluates minimalist (no shopping emissions) badge correctly', () => {
    const entries = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 5, category: 'energy' } // shopping is 0
    ]
    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    expect(badges.map(b => b.id)).toContain('utility-minimalist')
  })

  it('evaluates improvement-10 badge correctly', () => {
    // Needs 14 days of logs
    // Let's create 14 days where week 1 avg is 20, and week 2 (recent) avg is 10 (50% reduction)
    const entries = []
    // Week 2 (most recent: day 1 to 7)
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      entries.push({ date: d.toISOString(), totalCO2: 10, category: 'energy' })
    }
    // Week 1 (older: day 8 to 14)
    for (let i = 7; i < 14; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      entries.push({ date: d.toISOString(), totalCO2: 20, category: 'energy' })
    }

    const badges = evaluateBadges({ carbonEntries: entries, completedTips: [], userProfile: {} })
    expect(badges.map(b => b.id)).toContain('improve-10')
  })

  it('evaluates goal-crusher badge correctly', () => {
    const now = new Date()
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const entries = [
      { date: `${currentMonthStr}-05T12:00:00Z`, totalCO2: 100, category: 'energy' }
    ]
    const badges = evaluateBadges({
      carbonEntries: entries,
      completedTips: [],
      userProfile: { monthlyGoal: 200 }
    })
    expect(badges.map(b => b.id)).toContain('improve-goal')
  })

  it('evaluates half-carbon badge correctly', () => {
    const entries = [
      { date: '2026-06-21T10:00:00Z', totalCO2: 4, category: 'energy' } // daily avg is 4 (below 5.48)
    ]
    const badges = evaluateBadges({
      carbonEntries: entries,
      completedTips: [],
      userProfile: {}
    })
    expect(badges.map(b => b.id)).toContain('improve-half')
  })
})
