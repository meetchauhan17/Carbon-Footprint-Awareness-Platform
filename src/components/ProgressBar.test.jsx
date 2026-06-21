import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from './ProgressBar'

describe('ProgressBar Component', () => {
  it('renders correctly with default values', () => {
    render(<ProgressBar />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toBeInTheDocument()
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('100')
  })

  it('calculates percentage correctly and respects max value', () => {
    render(<ProgressBar value={15} max={30} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('15')
    expect(bar.getAttribute('aria-label')).toBe('Progress: 50%')
  })

  it('renders label with percentage style', () => {
    render(<ProgressBar value={10} max={40} showLabel={true} labelStyle="percentage" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('renders label with fraction style', () => {
    render(<ProgressBar value={10} max={40} showLabel={true} labelStyle="fraction" />)
    expect(screen.getByText('Progress')).toBeInTheDocument()
    expect(screen.getByText('10 / 40')).toBeInTheDocument()
  })

  it('clamps value within range', () => {
    render(<ProgressBar value={150} max={100} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })
})
