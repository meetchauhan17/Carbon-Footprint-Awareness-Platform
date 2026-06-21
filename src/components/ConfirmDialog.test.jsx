import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ConfirmDialog from './ConfirmDialog'

describe('ConfirmDialog Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<ConfirmDialog isOpen={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders correctly when isOpen is true', () => {
    render(<ConfirmDialog isOpen={true} title="Test Title" message="Test Message" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Message')).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirmMock = vi.fn()
    render(<ConfirmDialog isOpen={true} onConfirm={onConfirmMock} confirmText="Yes" />)
    
    const confirmBtn = screen.getByRole('button', { name: 'Yes' })
    fireEvent.click(confirmBtn)
    expect(onConfirmMock).toHaveBeenCalled()
  })

  it('calls onCancel when cancel or close button is clicked', () => {
    const onCancelMock = vi.fn()
    render(<ConfirmDialog isOpen={true} onCancel={onCancelMock} cancelText="No" />)
    
    const cancelBtn = screen.getByRole('button', { name: 'No' })
    fireEvent.click(cancelBtn)
    expect(onCancelMock).toHaveBeenCalled()

    const closeBtn = screen.getByRole('button', { name: 'Close dialog' })
    fireEvent.click(closeBtn)
    expect(onCancelMock).toHaveBeenCalledTimes(2)
  })

  it('calls onCancel when Escape key is pressed', () => {
    const onCancelMock = vi.fn()
    render(<ConfirmDialog isOpen={true} onCancel={onCancelMock} />)
    
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancelMock).toHaveBeenCalled()
  })
})
