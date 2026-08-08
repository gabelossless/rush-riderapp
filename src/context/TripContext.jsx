import { createContext, useContext, useEffect, useState } from 'react'
import { INITIAL_TRIP_HISTORY } from '../data/mockData'

const TripContext = createContext(null)

const TRIP_STATE_KEY = 'rush_current_trip_state'
const TRIP_HISTORY_KEY = 'rush_trip_history'

export function TripProvider({ children }) {
  const [currentTrip, setCurrentTrip] = useState(() => {
    try {
      const saved = localStorage.getItem(TRIP_STATE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [tripHistory, setTripHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(TRIP_HISTORY_KEY)
      return saved ? JSON.parse(saved) : INITIAL_TRIP_HISTORY
    } catch {
      return INITIAL_TRIP_HISTORY
    }
  })

  // Sync state across browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (e.key === TRIP_STATE_KEY) {
          setCurrentTrip(e.newValue ? JSON.parse(e.newValue) : null)
        }
        if (e.key === TRIP_HISTORY_KEY) {
          setTripHistory(e.newValue ? JSON.parse(e.newValue) : INITIAL_TRIP_HISTORY)
        }
      } catch (err) {
        console.error('Failed to parse cross-tab storage update:', err)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Persist current trip state
  useEffect(() => {
    try {
      if (currentTrip) {
        localStorage.setItem(TRIP_STATE_KEY, JSON.stringify(currentTrip))
      } else {
        localStorage.removeItem(TRIP_STATE_KEY)
      }
    } catch (e) {
      console.error('Failed to sync trip state:', e)
    }
  }, [currentTrip])

  // Persist trip history
  useEffect(() => {
    try {
      localStorage.setItem(TRIP_HISTORY_KEY, JSON.stringify(tripHistory))
    } catch (e) {
      console.error('Failed to sync trip history:', e)
    }
  }, [tripHistory])

  const requestRide = ({ pickup, destination, tier, fare, eta, distance, riderName, pickupCoords, dropoffCoords }) => {
    const newRequest = {
      id: `req_${Date.now()}`,
      status: 'SEARCHING', // SEARCHING, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED
      pickup: pickup || 'Current Location',
      destination: destination || 'Union Station',
      pickupCoords: pickupCoords || null,
      dropoffCoords: dropoffCoords || null,
      tier: tier || 'Rush Express',
      fare: fare || 24.90,
      driverFare: (fare || 24.90) * 0.88,
      eta: eta || '8 min',
      distance: distance || '2.4 mi',
      riderName: riderName || 'Alex Rivera',
      createdAt: new Date().toISOString(),
      progress: 0,
      driver: null,
    }
    setCurrentTrip(newRequest)
    return newRequest
  }

  const cancelRequest = () => {
    if (currentTrip) {
      setCurrentTrip(null)
    }
  }

  const resetTripState = () => {
    setCurrentTrip(null)
  }

  const acceptRide = (driverInfo) => {
    if (!currentTrip) return
    setCurrentTrip((prev) => ({
      ...prev,
      status: 'ACCEPTED',
      driver: driverInfo || {
        name: 'Marcus Vance',
        car: 'Tesla Model Y — Matte Black',
        plate: 'RUSH-88',
        rating: 4.98,
        initials: 'MV',
      },
    }))
  }

  const startRide = () => {
    if (!currentTrip) return
    setCurrentTrip((prev) => ({
      ...prev,
      status: 'IN_PROGRESS',
      progress: 0.1,
    }))
  }

  const updateProgress = (progress) => {
    setCurrentTrip((prev) => (prev ? { ...prev, progress } : null))
  }

  const completeRide = () => {
    if (!currentTrip) return

    const completedEntry = {
      id: currentTrip.id || `trip_${Date.now()}`,
      date: new Date().toISOString(),
      pickup: currentTrip.pickup,
      destination: currentTrip.destination,
      tier: currentTrip.tier,
      fare: currentTrip.fare,
      status: 'Completed',
      driverName: currentTrip.driver?.name || 'Marcus Vance',
      car: currentTrip.driver?.car || 'Tesla Model Y — Matte Black',
      rating: 5,
    }

    setTripHistory((prev) => [completedEntry, ...prev])
    setCurrentTrip(null)
    return completedEntry
  }

  return (
    <TripContext.Provider
      value={{
        currentTrip,
        tripHistory,
        requestRide,
        cancelRequest,
        resetTripState,
        acceptRide,
        startRide,
        updateProgress,
        completeRide,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const context = useContext(TripContext)
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider')
  }
  return context
}
