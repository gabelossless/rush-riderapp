import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'

function TestConsumer({ apiRef }) {
  const auth = useAuth()
  apiRef.current = auth
  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? 'authed' : 'not-authed'}</span>
      <span data-testid="user-name">{auth.user?.name || 'none'}</span>
      <span data-testid="user-email">{auth.user?.email || 'none'}</span>
      <span data-testid="user-role">{auth.user?.role || 'none'}</span>
    </div>
  )
}

function renderAuth() {
  const apiRef = { current: null }
  render(
    <AuthProvider>
      <TestConsumer apiRef={apiRef} />
    </AuthProvider>,
  )
  return apiRef
}

function clearStorage() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
  keys.forEach((k) => localStorage.removeItem(k))
}

describe('AuthContext', () => {
  beforeEach(() => {
    clearStorage()
  })

  describe('logout', () => {
    it('sets user to null', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Test', email: 'test@test.com', role: 'passenger' }))
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authed')

      act(() => api.current.logout())
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authed')
      expect(api.current.user).toBeNull()
    })

    it('removes rush_user_session from localStorage', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Test', email: 'test@test.com', role: 'passenger' }))
      expect(localStorage.getItem('rush_user_session')).not.toBeNull()

      act(() => api.current.logout())
      expect(localStorage.getItem('rush_user_session')).toBeNull()
    })

    it('is safe to call multiple times', () => {
      const api = renderAuth()
      expect(() => {
        act(() => api.current.logout())
        act(() => api.current.logout())
      }).not.toThrow()
    })
  })

  describe('login', () => {
    it('sets user and persists to localStorage', () => {
      const api = renderAuth()
      const userData = { id: 'u1', name: 'User', email: 'u@t.com', role: 'passenger', walletBalance: 50 }
      act(() => api.current.login(userData))
      expect(screen.getByTestId('user-name')).toHaveTextContent('User')
      expect(JSON.parse(localStorage.getItem('rush_user_session')).id).toBe('u1')
    })
  })

  describe('register', () => {
    it('creates a user with defaults and logs in', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'New User', email: 'new@test.com', role: 'passenger' }))
      expect(screen.getByTestId('user-name')).toHaveTextContent('New User')
      expect(api.current.user.walletBalance).toBe(100)
      expect(api.current.user.rating).toBe(5)
      expect(localStorage.getItem('rush_user_session')).not.toBeNull()
    })

    it('adds email to knownEmails', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'N', email: 'n@t.com', role: 'passenger' }))
      expect(api.current.knownEmails['n@t.com']).toBeDefined()
      expect(api.current.knownEmails['n@t.com'].name).toBe('N')
    })

    it('assigns driver-specific fields for driver role', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Driver', email: 'd@t.com', role: 'driver', vehicle: 'Test Car', plate: 'TEST', pledgeAccepted: true, humanVerified: true }))
      expect(screen.getByTestId('user-name')).toHaveTextContent('Driver')
      expect(api.current.user.car).toBe('Test Car')
      expect(api.current.user.plate).toBe('TEST')
      expect(api.current.user.todayEarnings).toBe(0)
      expect(api.current.user.todayRides).toBe(0)
    })
  })

  describe('switchRole', () => {
    it('preserves custom identity when passenger switches to driver', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Taylor', email: 't@t.com', role: 'passenger' }))
      expect(screen.getByTestId('user-role')).toHaveTextContent('passenger')

      act(() => api.current.switchRole('driver'))
      expect(api.current.user.role).toBe('driver')
      expect(api.current.user.name).toBe('Taylor')
      expect(api.current.user.email).toBe('t@t.com')
      expect(api.current.user.car).toBeDefined()
      expect(api.current.user.plate).toBeDefined()
      expect(api.current.user.walletBalance).toBe(100)
    })

    it('preserves custom identity when driver switches back to passenger', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Pat', email: 'p@t.com', role: 'driver', vehicle: 'Honda', plate: 'P-TEST' }))
      act(() => api.current.switchRole('passenger'))

      expect(api.current.user.role).toBe('passenger')
      expect(api.current.user.name).toBe('Pat')
      expect(api.current.user.email).toBe('p@t.com')
      expect(api.current.user.car).toBeUndefined()
    })

    it('preserves accumulated driver earnings across role switch', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Sam', email: 's@t.com', role: 'driver' }))
      act(() => api.current.creditDriverEarnings(80))
      act(() => api.current.switchRole('passenger'))
      act(() => api.current.switchRole('driver'))

      expect(api.current.user.role).toBe('driver')
      expect(api.current.user.walletBalance).toBeGreaterThanOrEqual(80)
      expect(api.current.user.name).toBe('Sam')
    })

    it('is a no-op when switching to the current role', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Alex', email: 'a@t.com', role: 'passenger' }))
      act(() => api.current.switchRole('passenger'))
      expect(api.current.user.role).toBe('passenger')
      expect(api.current.user.name).toBe('Alex')
      expect(api.current.user.car).toBeUndefined()
    })
  })

  describe('loginWithEmail', () => {
    it('recognizes a registered email', () => {
      const api = renderAuth()
      act(() => api.current.register({ name: 'Known', email: 'known@test.com', role: 'passenger' }))
      act(() => api.current.logout())

      act(() => {
        const result = api.current.loginWithEmail('known@test.com')
        expect(result).not.toBeNull()
      })
      expect(screen.getByTestId('user-name')).toHaveTextContent('Known')
    })

    it('returns null for unknown email', () => {
      const api = renderAuth()
      let result
      act(() => {
        result = api.current.loginWithEmail('unknown@test.com')
      })
      expect(result).toBeNull()
    })
  })
})
