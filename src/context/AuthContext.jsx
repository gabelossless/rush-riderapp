import { createContext, useContext, useEffect, useState } from 'react'
import { PRESET_ACCOUNTS } from '../data/mockData'

const AuthContext = createContext(null)

const STORAGE_KEY = 'rush_user_session'
const KNOWN_EMAILS_KEY = 'rush_known_emails'

function loadKnownEmails() {
  try {
    const saved = localStorage.getItem(KNOWN_EMAILS_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Previously-registered emails (email -> user record) so the adaptive
  // auth flow can recognize returning users without a backend.
  const [knownEmails, setKnownEmails] = useState(loadKnownEmails)

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (e) {
      console.error('Failed to sync auth state to localStorage:', e)
    }
  }, [user])

  useEffect(() => {
    try {
      localStorage.setItem(KNOWN_EMAILS_KEY, JSON.stringify(knownEmails))
    } catch (e) {
      console.error('Failed to sync known emails:', e)
    }
  }, [knownEmails])

  const login = (userData) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
  }

  const findKnownUser = (email) => {
    if (!email) return null
    const normalized = email.trim().toLowerCase()
    if (knownEmails[normalized]) return knownEmails[normalized]
    if (PRESET_ACCOUNTS.rider.email === normalized) return PRESET_ACCOUNTS.rider
    if (PRESET_ACCOUNTS.driver.email === normalized) return PRESET_ACCOUNTS.driver
    return null
  }

  const loginWithEmail = (email) => {
    const existing = findKnownUser(email)
    if (existing) {
      setUser(existing)
      return existing
    }
    return null
  }

  const register = ({ name, email, role, vehicle, plate, pledgeAccepted, humanVerified }) => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'US'

    const now = new Date()
    const joinedDate = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email,
      role: role || 'passenger',
      avatar: initials,
      walletBalance: role === 'driver' ? 0.0 : 100.0,
      rating: 5.0,
      totalRides: 0,
      joinedDate,
      ...(role === 'driver' && {
        car: vehicle || 'Tesla Model 3 — Midnight Silver',
        plate: plate || 'RUSH-NEW',
        todayEarnings: 0,
        todayRides: 0,
        acceptanceRate: '100%',
        pledgeAccepted: !!pledgeAccepted,
        humanVerified: !!humanVerified,
      }),
    }

    if (email) {
      setKnownEmails((prev) => ({ ...prev, [email.trim().toLowerCase()]: newUser }))
    }

    setUser(newUser)
    return newUser
  }

  const demoLogin = (role) => {
    const base = role === 'driver' ? PRESET_ACCOUNTS.driver : PRESET_ACCOUNTS.rider
    setUser({ ...base, isDemo: true })
  }

  const switchRole = (newRole) => {
    if (!user) return
    if (newRole === user.role) return
    if (newRole === 'passenger') {
      setUser((prev) => {
        const {
          car: _car,
          plate: _plate,
          todayEarnings: _todayEarnings,
          todayRides: _todayRides,
          acceptanceRate: _acceptanceRate,
          pledgeAccepted: _pledgeAccepted,
          humanVerified: _humanVerified,
          ...rest
        } = prev
        return { ...rest, role: 'passenger', walletBalance: prev.walletBalance || 150 }
      })
    } else if (newRole === 'driver') {
      setUser((prev) => ({
        ...prev,
        role: 'driver',
        walletBalance: prev.walletBalance || 488.2,
        car: prev.car || 'Tesla Model 3 — Midnight Silver',
        plate: prev.plate || 'RUSH-NEW',
        todayEarnings: prev.todayEarnings || 0,
        todayRides: prev.todayRides || 0,
        acceptanceRate: prev.acceptanceRate || '100%',
        pledgeAccepted: !!prev.pledgeAccepted,
        humanVerified: prev.humanVerified ?? true,
      }))
    }
  }

  const addFunds = (amount) => {
    if (!user) return
    setUser((prev) => ({
      ...prev,
      walletBalance: (prev.walletBalance || 0) + amount,
    }))
  }

  const creditDriverEarnings = (amount) => {
    if (!user) return
    setUser((prev) => ({
      ...prev,
      walletBalance: (prev.walletBalance || 0) + amount,
      todayEarnings: (prev.todayEarnings || 0) + amount,
      todayRides: (prev.todayRides || 0) + 1,
      totalRides: (prev.totalRides || 0) + 1,
    }))
  }

  // countsAsRide=false is for charges that happen after the ride itself was
  // already counted — a tip, chosen on the Trip Completed screen after the
  // base fare (and totalRides) was already settled the moment the trip
  // ended. Without this, tipping would double-count the same trip.
  const deductRiderFare = (amount, { countsAsRide = true } = {}) => {
    if (!user) return
    setUser((prev) => {
      let nextBalance = Math.max(0, (prev.walletBalance || 0) - amount)
      // Demo accounts auto-refill after each ride so the simulation never
      // dead-ends on an empty wallet (keeps the demo frictionless).
      if (prev.isDemo && nextBalance < 25) {
        nextBalance = prev.role === 'driver' ? 488.2 : 250
      }
      return {
        ...prev,
        walletBalance: nextBalance,
        totalRides: countsAsRide ? (prev.totalRides || 0) + 1 : prev.totalRides,
      }
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        knownEmails,
        login,
        logout,
        register,
        loginWithEmail,
        findKnownUser,
        demoLogin,
        switchRole,
        addFunds,
        creditDriverEarnings,
        deductRiderFare,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
