import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import PWAInstallPrompt from './PWAInstallPrompt'

describe('PWAInstallPrompt', () => {
  let matchMediaMock

  function clearStorage() {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
    keys.forEach((k) => localStorage.removeItem(k))
  }

  beforeEach(() => {
    clearStorage()
    vi.useFakeTimers()
    matchMediaMock = vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMediaMock })
    Object.defineProperty(window.navigator, 'standalone', { writable: true, value: false, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('safe-area rendering', () => {
    it('includes safe-area-inset-bottom in the prompt container class', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      })

      render(<PWAInstallPrompt />)

      act(() => vi.advanceTimersByTime(3000))

      const container = document.querySelector('.fixed.bottom-\\[calc\\(1rem\\+env\\(safe-area-inset-bottom\\,0px\\)\\)\\]')
      expect(container).toBeInTheDocument()
    })
  })

  describe('standalone mode', () => {
    it('returns null when already installed (display-mode: standalone)', () => {
      matchMediaMock.mockReturnValue({
        matches: true,
        media: '(display-mode: standalone)',
        addEventListener: () => {},
        removeEventListener: () => {},
      })

      const { container } = render(<PWAInstallPrompt />)
      expect(container.innerHTML).toBe('')
    })

    it('returns null when navigator.standalone is true', () => {
      Object.defineProperty(window.navigator, 'standalone', { writable: true, value: true })
      const { container } = render(<PWAInstallPrompt />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('dismissal', () => {
    it('returns null when previously dismissed', () => {
      localStorage.setItem('rush_pwa_install_dismissed', 'true')
      const { container } = render(<PWAInstallPrompt />)
      expect(container.innerHTML).toBe('')
    })
  })

  describe('iOS detection', () => {
    it('shows iOS-specific share-sheet instructions', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true,
      })

      render(<PWAInstallPrompt />)

      act(() => vi.advanceTimersByTime(3000))

      expect(screen.getByText(/Quick Install/i)).toBeInTheDocument()
      expect(screen.getByText(/button in Safari toolbar/i)).toBeInTheDocument()
    })
  })

  describe('Android/Chrome flow', () => {
    it('shows Android install button when beforeinstallprompt fires', () => {
      Object.defineProperty(window.navigator, 'userAgent', {
        writable: true,
        value: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        configurable: true,
      })

      render(<PWAInstallPrompt />)

      act(() => {
        const event = new Event('beforeinstallprompt')
        event.preventDefault = vi.fn()
        Object.defineProperty(event, 'userChoice', {
          value: Promise.resolve({ outcome: 'dismissed' }),
        })
        window.dispatchEvent(event)
      })

      expect(screen.getByText(/Install App Now/i)).toBeInTheDocument()
    })
  })
})
