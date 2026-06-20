import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CarbonProvider, useCarbon } from './CarbonContext'

// Mock useAuth dependency
vi.mock('./AuthContext.jsx', () => ({
  useAuth: () => ({
    token: null,
    user: null,
    updateLocalUser: vi.fn(),
  }),
  default: null,
}))


// Test consumer component
function TestConsumer() {
  const {
    state,
    addCarbonEntry,
    deleteEntry,
    getAverageFootprint
  } = useCarbon()

  return (
    <div>
      <div data-testid="entries-count">{state.carbonEntries.length}</div>
      <div data-testid="average-footprint">{getAverageFootprint()}</div>
      
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
    </div>
  )
}

describe('CarbonContext', () => {
  beforeEach(() => {
    // Clear localStorage and mocks
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should initialize with empty data when localStorage is empty', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Should have 0 entries
    const count = parseInt(screen.getByTestId('entries-count').textContent)
    expect(count).toBe(0)
  })

  it('should add a carbon entry correctly', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    const initialCount = parseInt(screen.getByTestId('entries-count').textContent)
    const addBtn = screen.getByTestId('add-btn')

    act(() => {
      addBtn.click()
    })

    const newCount = parseInt(screen.getByTestId('entries-count').textContent)
    expect(newCount).toBe(initialCount + 1)
    expect(screen.getByText(/Test Commute: 12.5 kg/)).toBeInTheDocument()
  })

  it('should delete a carbon entry correctly', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Add an entry first
    const addBtn = screen.getByTestId('add-btn')
    act(() => {
      addBtn.click()
    })

    const initialCount = parseInt(screen.getByTestId('entries-count').textContent)
    expect(initialCount).toBe(1)

    // Find the first delete button
    const deleteBtns = screen.getAllByText('Delete')
    
    act(() => {
      deleteBtns[0].click()
    })

    const newCount = parseInt(screen.getByTestId('entries-count').textContent)
    expect(newCount).toBe(0)
  })

  it('should persist data in localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    // Expect setItem to have been called when storing initial state or updates
    expect(setItemSpy).toHaveBeenCalled()

    const addBtn = screen.getByTestId('add-btn')
    act(() => {
      addBtn.click()
    })

    // Verify localStorage has our key
    const storedData = JSON.parse(localStorage.getItem('carbonwise-data'))
    expect(storedData).not.toBeNull()
    expect(storedData.carbonEntries.some(e => e.label === 'Test Commute')).toBe(true)
  })

  it('should calculate the average footprint correctly', () => {
    render(
      <CarbonProvider>
        <TestConsumer />
      </CarbonProvider>
    )

    const avg = parseFloat(screen.getByTestId('average-footprint').textContent)
    expect(avg).toBe(0)
  })
})
