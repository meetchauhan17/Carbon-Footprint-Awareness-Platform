import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CategoryBadge from './CategoryBadge'

describe('CategoryBadge Component', () => {
  it('renders correctly with default props', () => {
    render(<CategoryBadge />)
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  it('renders categories correctly', () => {
    render(<CategoryBadge category="transport" />)
    expect(screen.getByText('Transport')).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<CategoryBadge category="energy" showIcon={false} />)
    expect(screen.getByText('Home Energy')).toBeInTheDocument()
  })

  it('handles unknown categories gracefully', () => {
    render(<CategoryBadge category="unknown-cat" />)
    expect(screen.getByText('unknown-cat')).toBeInTheDocument()
  })
})
