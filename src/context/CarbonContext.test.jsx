import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { CarbonProvider, useCarbon } from './CarbonContext'

// Mock useAuth dependency dynamically
let currentToken = null
let currentUser = null
const mockUpdateLocalUser = vi.fn()

vi.mock('./AuthContext.jsx', () => ({
  useAuth: () => ({
    token: currentToken,
    user: currentUser,
    updateLocalUser: mockUpdateLocalUser,
  }),
  default: null,
}))

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Test consumer component
function TestConsumer() {
  const {
    state,
    addCarbonEntry,
    deleteEntry,
    updateProfile,
    clearHistory,
    getAverageFootprint,
    compareToGlobalAverage,
    toggleTipCompleted,
  } = useCarbon()

  const handleCompare = () => {
    const comp = compareToGlobalAverage()
    return `${comp.userMonthlyKg}-${comp.globalMonthlyKg}-${comp.differenceKg}-${comp.percentDiff}-${comp.status}`
  }

  return (
    <div>
      <div data-testid="entries-count">{state.carbonEntries.length}</div>
      <div data-testid="average-footprint">{getAverageFootprint()}</div>
      <div data-testid="comparison">{handleCompare()}</div>
      <div data-testid="completed-tips">{JSON.stringify(state.completedTips)}</div>
      
      {state.carbonEntries.map(e => (
        <div key={e.id} data-testid="entry-item">
          {e.label}: {e.totalCO2} kg
          <button 
            data-testid={`delete-btn-${e.id}`} 
            onClick={() => deleteEntry(e.id)}
          >
            Delete
          </button>
        </div>
      ))}

      <button
        data-testid="add-btn"
        onClick={() => addCarbonEntry({
          category: 'transport',
          item: 'car_petrol',
          label: 'Test Commute',
          quantity: 1,
          totalCO2: 12.5
        })}
      >
        Add Entry
      </button>

      <button
        data-testid="update-profile-btn"
        onClick={() => updateProfile({ name: 'New Name', location: 'New Loc', monthlyGoal: 120 })}
      >
        Update Profile
      </button>

      <button
        data-testid="clear-history-btn"
        onClick={() => clearHistory()}
      >
        Clear History
      </button>

      <button
        data-testid="toggle-tip-btn"
        onClick={() => toggleTipCompleted('eco-commute')}
      >
        Toggle Tip
      </button>
    </div>
  )
}

describe('CarbonContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    currentToken = null
    currentUser = null
    mockFetch.mockReset()
    mockUpdateLocalUser.mockClear()
  })

  it('should initialize with empty data when localStorage is empty', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )
    expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(0)
  })

  it('should add a carbon entry correctly in guest mode', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )
    const addBtn = screen.getByTestId('add-btn')
    act(() => {
      addBtn.click()
    })
    expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(1)
    expect(screen.getByText(/Test Commute: 12.5 kg/)).toBeInTheDocument()
  })

  it('should delete a carbon entry correctly in guest mode', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )
    const addBtn = screen.getByTestId('add-btn')
    act(() => { addBtn.click() })
    expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(1)

    const deleteBtn = screen.getAllByText('Delete')[0]
    act(() => { deleteBtn.click() })
    expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(0)
  })

  it('should update profile and toggle tips in guest mode', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )
    const updateProfileBtn = screen.getByTestId('update-profile-btn')
    const toggleTipBtn = screen.getByTestId('toggle-tip-btn')

    act(() => {
      updateProfileBtn.click()
      toggleTipBtn.click()
    })

    expect(screen.getByTestId('completed-tips').textContent).toContain('eco-commute')
  })

  it('should sync from database on mount when authenticated', async () => {
    currentToken = 'mock-jwt-token'
    currentUser = { name: 'Authenticated User', location: 'DB Loc', monthlyGoal: 200 }

    // Mock API responses for syncFromDb
    mockFetch.mockImplementation((url) => {
      if (url.includes('/entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 101, category: 'energy', item: 'electricity', label: 'Electricity', quantity: 1, totalCO2: 50.0, date: new Date().toISOString() }
          ])
        })
      }
      if (url.includes('/tips')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['eco-shower', 'eco-thermostat'])
        })
      }
      return Promise.reject(new Error('Unknown url'))
    })

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    await waitFor(() => {
      expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(1)
    })
    expect(screen.getByTestId('completed-tips').textContent).toContain('eco-shower')
  })

  it('should handle API errors gracefully during syncFromDb', async () => {
    currentToken = 'mock-jwt-token'
    mockFetch.mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })
    expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(0)
  })

  it('should call APIs when adding/deleting entry when authenticated', async () => {
    currentToken = 'mock-jwt-token'
    
    mockFetch.mockImplementation((url, options = {}) => {
      const method = options.method || 'GET'
      if (url.includes('/entries') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 202, category: 'transport', item: 'car_petrol', label: 'Test Commute', quantity: 1, totalCO2: 12.5, date: new Date().toISOString()
          })
        })
      }
      if (url.includes('/entries/202') && method === 'DELETE') {
        return Promise.resolve({ ok: true })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Wait for mount sync to finish (2 fetches: GET /entries, GET /tips)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const addBtn = screen.getByTestId('add-btn')
    act(() => {
      addBtn.click()
    })

    await waitFor(() => {
      expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(1)
    })

    const deleteBtn = screen.getByTestId('delete-btn-202')
    act(() => {
      deleteBtn.click()
    })

    await waitFor(() => {
      expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(0)
    })
  })

  it('should call PUT /profile API when updating profile when authenticated', async () => {
    currentToken = 'mock-jwt-token'

    mockFetch.mockImplementation((url, options = {}) => {
      const method = options.method || 'GET'
      if (url.includes('/profile') && method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'New Name', location: 'New Loc', monthlyGoal: 120 })
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Wait for mount sync to finish
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const updateProfileBtn = screen.getByTestId('update-profile-btn')
    act(() => {
      updateProfileBtn.click()
    })

    await waitFor(() => {
      expect(mockUpdateLocalUser).toHaveBeenCalledWith({ name: 'New Name', location: 'New Loc', monthlyGoal: 120 })
    })
  })

  it('should call DELETE /entries API when clearing history when authenticated', async () => {
    currentToken = 'mock-jwt-token'

    mockFetch.mockImplementation((url, options = {}) => {
      const method = options.method || 'GET'
      if (url.includes('/entries') && method === 'DELETE') {
        return Promise.resolve({ ok: true })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Wait for mount sync to finish
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const clearBtn = screen.getByTestId('clear-history-btn')
    act(() => {
      clearBtn.click()
    })

    await waitFor(() => {
      expect(parseInt(screen.getByTestId('entries-count').textContent)).toBe(0)
    })
  })

  it('should call POST /tips API when toggling tips when authenticated', async () => {
    currentToken = 'mock-jwt-token'

    mockFetch.mockImplementation((url, options = {}) => {
      const method = options.method || 'GET'
      if (url.includes('/tips') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['eco-commute'])
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Wait for mount sync to finish
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    const toggleBtn = screen.getByTestId('toggle-tip-btn')
    act(() => {
      toggleBtn.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('completed-tips').textContent).toContain('eco-commute')
    })
  })

  it('should calculate compareToGlobalAverage and getAverageFootprint correctly', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Add entry 1
    act(() => {
      screen.getByTestId('add-btn').click()
    })

    expect(parseFloat(screen.getByTestId('average-footprint').textContent)).toBe(12.5)
    
    // Compare output format: userMonthlyKg-globalMonthlyKg-differenceKg-percentDiff-status
    const compareText = screen.getByTestId('comparison').textContent
    expect(compareText).toContain('12.5-333.33')
  })
})
