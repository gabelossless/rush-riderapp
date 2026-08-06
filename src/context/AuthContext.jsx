import { createContext, useContext, useEffect, useState } from 'react'
import { PRESET_ACCOUNTS } from '../data/mockData'

const AuthContext = createContext(null)

const STORAGE_KEY = 'rush_user_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : PRESET_ACCOUNTS.rider
    } catch {
      return PRESET_ACCOUNTS.rider
    }
  })

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

  const login = (userData) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
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

    setUser(newUser)
    return newUser
  }

  const loginPresetRider = () => {
    setUser(PRESET_ACCOUNTS.rider)
  }

  const loginPresetDriver = () => {
    setUser(PRESET_ACCOUNTS.driver)
  }

  const switchRole = (newRole) => {
    if (!user) return
    if (newRole === 'passenger' && user.role !== 'passenger') {
      setUser({ ...PRESET_ACCOUNTS.rider, walletBalance: user.walletBalance || 150 })
    } else if (newRole === 'driver' && user.role !== 'driver') {
      setUser({ ...PRESET_ACCOUNTS.driver, walletBalance: user.walletBalance || 488.2 })
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

  const deductRiderFare = (amount) => {
    if (!user) return
    setUser((prev) => ({
      ...prev,
      walletBalance: Math.max(0, (prev.walletBalance || 0) - amount),
      totalRides: (prev.totalRides || 0) + 1,
    }))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        loginPresetRider,
        loginPresetDriver,
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
