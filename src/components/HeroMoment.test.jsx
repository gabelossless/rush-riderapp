import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import HeroMoment from './HeroMoment'

describe('HeroMoment', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the wordmark, fare, and 88% driver split', () => {
    render(<HeroMoment onDone={() => {}} />)

    expect(screen.getByText('RUSH')).toBeInTheDocument()
    expect(screen.getByText('RUSH-88')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.getByText('No surge')).toBeInTheDocument()
    expect(screen.getByText('$24.90')).toBeInTheDocument()
    expect(screen.getByText('Driver keeps 88%')).toBeInTheDocument()
    expect(screen.getByText('$21.91')).toBeInTheDocument()
  })

  it('auto-dismisses after the ~5s sequence and calls onDone', () => {
    const onDone = vi.fn()
    render(<HeroMoment onDone={onDone} />)

    act(() => vi.advanceTimersByTime(2000))
    expect(onDone).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(2400))
    expect(onDone).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(800))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('skips immediately when tapped', () => {
    const onDone = vi.fn()
    render(<HeroMoment onDone={onDone} />)

    act(() => {
      fireEvent.click(screen.getByRole('presentation'))
    })
    act(() => vi.advanceTimersByTime(800))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does not call onDone twice on repeated taps', () => {
    const onDone = vi.fn()
    render(<HeroMoment onDone={onDone} />)

    act(() => {
      fireEvent.click(screen.getByRole('presentation'))
    })
    act(() => {
      fireEvent.click(screen.getByRole('presentation'))
    })
    act(() => vi.advanceTimersByTime(800))
    expect(onDone).toHaveBeenCalledTimes(1)
  })
})
