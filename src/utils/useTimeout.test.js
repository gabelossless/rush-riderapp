import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useTimeout from './useTimeout'

describe('useTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls the callback after the specified delay', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useTimeout())

    act(() => {
      result.current.set(fn, 1000)
    })

    expect(fn).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('clears all pending timers on unmount', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useTimeout())

    act(() => {
      result.current.set(fn, 1000)
    })

    unmount()

    act(() => vi.advanceTimersByTime(1000))
    expect(fn).not.toHaveBeenCalled()
  })

  it('supports explicit clear of a specific timer', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useTimeout())

    let tid
    act(() => {
      tid = result.current.set(fn, 1000)
    })

    act(() => {
      result.current.clear(tid)
    })

    act(() => vi.advanceTimersByTime(1000))
    expect(fn).not.toHaveBeenCalled()
  })

  it('supports clearAll to cancel all pending timers', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { result } = renderHook(() => useTimeout())

    act(() => {
      result.current.set(fn1, 500)
      result.current.set(fn2, 1000)
    })

    act(() => {
      result.current.clearAll()
    })

    act(() => vi.advanceTimersByTime(1000))
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).not.toHaveBeenCalled()
  })

  it('handles multiple timers independently', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const { result } = renderHook(() => useTimeout())

    act(() => {
      result.current.set(fn1, 500)
      result.current.set(fn2, 1000)
    })

    act(() => vi.advanceTimersByTime(500))
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()

    act(() => vi.advanceTimersByTime(500))
    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
  })
})
