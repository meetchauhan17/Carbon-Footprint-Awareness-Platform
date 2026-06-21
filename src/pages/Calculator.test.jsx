import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Calculator from './Calculator'

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock useCarbon from context
const mockAddCarbonEntry = vi.fn()
vi.mock('../context/CarbonContext.jsx', () => ({
  useCarbon: () => ({
    addCarbonEntry: mockAddCarbonEntry,
  }),
  CarbonProvider: ({ children }) => <div>{children}</div>,
}))

// Mock recharts to avoid JSDOM SVG failures
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}))

describe('Calculator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders step 1 (Transport) initially and can navigate between steps', () => {
    render(
      <MemoryRouter>
        <Calculator />
      </MemoryRouter>
    )

    // Verify Step 1 is rendered
    expect(screen.getByRole('heading', { name: /Transport/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Distance/i)).toBeInTheDocument()

    // Fill distance km
    const distanceInput = screen.getByLabelText(/Distance/i)
    fireEvent.change(distanceInput, { target: { value: '10' } })

    // Click Continue
    const continueBtn = screen.getByRole('button', { name: /Continue/i })
    fireEvent.click(continueBtn)

    // Verify Step 2 is rendered
    expect(screen.getByRole('heading', { name: /Home Energy/i })).toBeInTheDocument()

    // Click Back
    const backBtn = screen.getByRole('button', { name: /Back/i })
    fireEvent.click(backBtn)

    // Verify we are back to Step 1
    expect(screen.getByRole('heading', { name: /Transport/i })).toBeInTheDocument()
  })

  it('validates food step (Step 3) - prevents going to next step if meals < 1', () => {
    render(
      <MemoryRouter>
        <Calculator />
      </MemoryRouter>
    )

    // Step 1: Transport
    fireEvent.change(screen.getByLabelText(/Distance/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Step 2: Energy
    fireEvent.change(screen.getByLabelText(/Electricity used/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Step 3: Food
    expect(screen.getByRole('heading', { name: /Food & Diet/i })).toBeInTheDocument()

    // Initial meals count is 3. Let's decrease it to 0.
    const decreaseBtn = screen.getByRole('button', { name: /Decrease Number of meals today/i })
    fireEvent.click(decreaseBtn) // to 2
    fireEvent.click(decreaseBtn) // to 1
    fireEvent.click(decreaseBtn) // to 0

    // Click Continue
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Verify error is shown
    expect(screen.getByText('Please enter at least 1 meal.')).toBeInTheDocument()
    // Verify we are still on Step 3
    expect(screen.getByRole('heading', { name: /Food & Diet/i })).toBeInTheDocument()

    // Increase meals to 1
    const increaseBtn = screen.getByRole('button', { name: /Increase Number of meals today/i })
    fireEvent.click(increaseBtn)

    // Click Continue again
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Verify we advanced to Step 4 (Shopping)
    expect(screen.getByRole('heading', { name: /Shopping/i })).toBeInTheDocument()
    expect(screen.queryByText('Please enter at least 1 meal.')).not.toBeInTheDocument()
  })

  it('completes the flow and submits the final data', () => {
    render(
      <MemoryRouter>
        <Calculator />
      </MemoryRouter>
    )

    // Step 1: Transport (default car_petrol, 10 km)
    fireEvent.change(screen.getByLabelText(/Distance/i), { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Step 2: Energy (electricity 5 kWh)
    fireEvent.change(screen.getByLabelText(/Electricity used/i), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Step 3: Food (default chicken, 3 meals)
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }))

    // Step 4: Shopping (default 0 for all)
    // We can increase online orders to 2
    const increaseOnlineOrdersBtn = screen.getAllByRole('button', { name: /Increase value/i })[3]
    fireEvent.click(increaseOnlineOrdersBtn)
    fireEvent.click(increaseOnlineOrdersBtn)

    // Click See My Results
    fireEvent.click(screen.getByRole('button', { name: /See My Results/i }))

    // Verify we are on Summary Screen
    expect(screen.getByRole('heading', { name: /Today's Footprint/i })).toBeInTheDocument()

    // Click Save Today's Entry
    const saveBtn = screen.getByRole('button', { name: /Save Today's Entry/i })
    fireEvent.click(saveBtn)

    // Assert addCarbonEntry was called
    expect(mockAddCarbonEntry).toHaveBeenCalled()

    // Verify it navigates to "/" after 1.2s timeout
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
