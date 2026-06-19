import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  canNotify,
  sendNotification,
  checkWeeklyDigest,
  checkGoalAlert,
  checkDailyTipSuggestion
} from './notifications'

describe('notifications utility', () => {
  let originalNotification
  let originalLocalStorage
  let mockLocalStorage = {}

  beforeEach(() => {
    // Mock Notification
    originalNotification = global.window ? global.window.Notification : undefined

    // Define a constructible MockNotification class
    class MockNotification {
      constructor(title, options) {
        this.title = title
        this.options = options
        MockNotification.calls.push([title, options])
        MockNotification.instances.push(this)
      }
    }
    MockNotification.permission = 'default'
    MockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
    MockNotification.calls = []
    MockNotification.instances = []

    if (!global.window) {
      global.window = {}
    }
    global.window.Notification = MockNotification

    // Mock localStorage
    mockLocalStorage = {}
    originalLocalStorage = global.localStorage
    global.localStorage = {
      getItem: vi.fn(key => mockLocalStorage[key] || null),
      setItem: vi.fn((key, val) => { mockLocalStorage[key] = val }),
      clear: vi.fn(() => { mockLocalStorage = {} }),
      removeItem: vi.fn(key => { delete mockLocalStorage[key] })
    }
  })

  afterEach(() => {
    // Restore
    if (originalNotification) {
      global.window.Notification = originalNotification
    } else {
      delete global.window.Notification
    }
    global.localStorage = originalLocalStorage
    vi.restoreAllMocks()
  })

  describe('canNotify', () => {
    it('should return false if permission is default', () => {
      global.window.Notification.permission = 'default'
      expect(canNotify()).toBe(false)
    })

    it('should return false if permission is denied', () => {
      global.window.Notification.permission = 'denied'
      expect(canNotify()).toBe(false)
    })

    it('should return true if permission is granted', () => {
      global.window.Notification.permission = 'granted'
      expect(canNotify()).toBe(true)
    })
  })

  describe('sendNotification', () => {
    it('should not create a notification if permission is not granted', () => {
      global.window.Notification.permission = 'default'
      const result = sendNotification('Test Title', 'Test Body')
      expect(result).toBeNull()
      expect(global.window.Notification.calls.length).toBe(0)
    })

    it('should create a notification if permission is granted', () => {
      global.window.Notification.permission = 'granted'
      const result = sendNotification('Test Title', 'Test Body')
      expect(result).toBeDefined()
      expect(global.window.Notification.calls.length).toBe(1)
      expect(global.window.Notification.calls[0]).toEqual(['Test Title', {
        body: 'Test Body',
        icon: '/favicon.ico'
      }])
    })
  })

  describe('checkWeeklyDigest', () => {
    it('should not notify if weeklyReport preference is disabled', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            weeklyReport: false
          }
        },
        carbonEntries: []
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      checkWeeklyDigest()
      expect(global.window.Notification.calls.length).toBe(0)
    })

    it('should notify if weeklyReport preference is enabled and a week has passed', () => {
      global.window.Notification.permission = 'granted'
      
      const profileData = {
        userProfile: {
          notifications: {
            weeklyReport: true
          }
        },
        carbonEntries: [
          { date: new Date().toISOString(), totalCO2: 10 }
        ]
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))
      // 8 days ago
      global.localStorage.setItem('lastWeeklyReport', (Date.now() - 8 * 24 * 60 * 60 * 1000).toString())

      checkWeeklyDigest()
      expect(global.window.Notification.calls.length).toBe(1)
    })

    it('should bypass enabled check and timestamp check if forced', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            weeklyReport: false // disabled
          }
        },
        carbonEntries: []
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))
      // Just ran (0 seconds ago)
      global.localStorage.setItem('lastWeeklyReport', Date.now().toString())

      checkWeeklyDigest(true) // force = true
      expect(global.window.Notification.calls.length).toBe(1)
    })
  })

  describe('checkGoalAlert', () => {
    it('should not fire if goalAlerts preference is disabled', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            goalAlerts: false
          }
        }
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      checkGoalAlert([], 150)
      expect(global.window.Notification.calls.length).toBe(0)
    })

    it('should fire if monthly goal exceeded by 80%', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            goalAlerts: true
          }
        }
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      const entries = [
        { date: new Date().toISOString(), totalCO2: 130 }
      ]
      
      checkGoalAlert(entries, 150) // 130 is ~86.6% (> 80%)
      expect(global.window.Notification.calls.length).toBe(1)
      expect(global.window.Notification.calls[0]).toEqual(['Goal Alert', {
        body: "You've used 80% of your monthly carbon budget",
        icon: '/favicon.ico'
      }])
    })

    it('should fire if monthly goal exceeded by 100%', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            goalAlerts: true
          }
        }
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      const entries = [
        { date: new Date().toISOString(), totalCO2: 160 }
      ]

      checkGoalAlert(entries, 150) // 160 is > 150 (> 100%)
      expect(global.window.Notification.calls.length).toBe(1)
      expect(global.window.Notification.calls[0]).toEqual(['Goal Alert', {
        body: "You've exceeded your monthly goal",
        icon: '/favicon.ico'
      }])
    })

    it('should not fire duplicate alerts for the same month', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            goalAlerts: true
          }
        }
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
      global.localStorage.setItem('lastGoal80FiredMonth', currentMonthKey)

      const entries = [
        { date: new Date().toISOString(), totalCO2: 130 }
      ]

      checkGoalAlert(entries, 150)
      expect(global.window.Notification.calls.length).toBe(0)
    })
  })

  describe('checkDailyTipSuggestion', () => {
    it('should suggest an uncompleted tip and set timestamp', () => {
      global.window.Notification.permission = 'granted'
      const profileData = {
        userProfile: {
          notifications: {
            ecoTips: true
          }
        },
        completedTips: ['tip1']
      }
      global.localStorage.setItem('carbonwise-data', JSON.stringify(profileData))

      const tips = [
        { id: 'tip1', title: 'Tip One', co2Saved: 5 },
        { id: 'tip2', title: 'Tip Two', co2Saved: 10 }
      ]

      checkDailyTipSuggestion(tips)
      expect(global.window.Notification.calls.length).toBe(1)
      expect(global.window.Notification.calls[0]).toEqual(['Eco Tip Recommendation', {
        body: "Try today's tip: Tip Two — saves 10 kg CO2",
        icon: '/favicon.ico'
      }])
      
      const todayStr = new Date().toISOString().split('T')[0]
      expect(mockLocalStorage['lastTipNotification']).toBe(todayStr)
    })
  })
})
