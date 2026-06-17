import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CarbonCard from './CarbonCard'
import { Leaf } from 'lucide-react'

describe('CarbonCard Component', () => {
  it('renders with label, value, and subText correctly', () => {
    render(
      <CarbonCard
        label="Test Emission"
        value="12.5 kg"
        subText="Compared to yesterday"
      />
    )

    expect(screen.getByText('Test Emission')).toBeInTheDocument()
    expect(screen.getByText('12.5 kg')).toBeInTheDocument()
    expect(screen.getByText('Compared to yesterday')).toBeInTheDocument()
  })

  it('applies the correct border color styling based on accentColor prop', () => {
    const { container } = render(
      <CarbonCard
        label="Test"
        value="10"
        accentColor="#ef4444"
      />
    )

    // The root div should have the borderLeft style applied
    const cardDiv = container.firstChild
    expect(cardDiv).toHaveStyle('border-left: 3px solid #ef4444')
  })

  it('renders correct elements for trend="up"', () => {
    const { container } = render(
      <CarbonCard
        label="Test"
        value="10"
        trend="up"
        trendText="15% increase"
      />
    )

    // Check trendText and its color class
    const trendSpan = screen.getByText('15% increase')
    expect(trendSpan).toBeInTheDocument()
    expect(trendSpan).toHaveClass('text-red-500')

    // Check trend icon wrapper classes
    const iconContainer = container.querySelector('.text-red-600')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('bg-red-50')
  })

  it('renders correct elements for trend="down"', () => {
    const { container } = render(
      <CarbonCard
        label="Test"
        value="10"
        trend="down"
        trendText="20% decrease"
      />
    )

    // Check trendText and its color class
    const trendSpan = screen.getByText('20% decrease')
    expect(trendSpan).toBeInTheDocument()
    expect(trendSpan).toHaveClass('text-green-600')

    // Check trend icon wrapper classes
    const iconContainer = container.querySelector('.text-green-700')
    expect(iconContainer).toBeInTheDocument()
    expect(iconContainer).toHaveClass('bg-green-50')
  })

  it('renders correct elements for trend="neutral"', () => {
    const { container } = render(
      <CarbonCard
        label="Test"
        value="10"
        trend="neutral"
        trendText="No change"
      />
    )

    // Check trendText and its color class
    const trendSpan = screen.getByText('No change')
    expect(trendSpan).toBeInTheDocument()
    expect(trendSpan).toHaveClass('text-gray-500')

    // Check trend icon wrapper classes
    const iconContainer = container.querySelector('.text-gray-500.bg-gray-50')
    expect(iconContainer).toBeInTheDocument()
  })

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(
      <CarbonCard
        label="Interactive Card"
        value="10"
        onClick={handleClick}
      />
    )

    const card = screen.getByRole('button')
    fireEvent.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders the custom Icon component when provided', () => {
    render(
      <CarbonCard
        label="Icon Test"
        value="10"
        icon={Leaf}
      />
    )

    // Check if Icon container is present and has proper styling
    const leafIcon = document.querySelector('svg')
    expect(leafIcon).toBeInTheDocument()
  })
})
