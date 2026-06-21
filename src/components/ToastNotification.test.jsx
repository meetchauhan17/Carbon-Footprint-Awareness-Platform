import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ToastNotification from './ToastNotification'

describe('ToastNotification Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render when show is false', () => {
    const { container } = render(<ToastNotification message="Hello" show={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders message when show is true', () => {
    render(<ToastNotification message="Important Alert" show={true} />)
    expect(screen.getByText('Important Alert')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn()
    render(<ToastNotification message="Alert" show={true} onClose={onCloseMock} />)
    
    const closeBtn = screen.getByRole('button', { name: 'Close notification' })
    fireEvent.click(closeBtn)
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('calls onClose automatically after duration', () => {
    const onCloseMock = vi.fn()
    render(<ToastNotification message="Alert" show={true} onClose={onCloseMock} duration={2000} />)
    
    vi.advanceTimersByTime(2000)
    expect(onCloseMock).toHaveBeenCalled()
  })
})
