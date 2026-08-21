import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { INITIAL_TRIP_HISTORY } from '../data/mockData'
import { offsetLatLng } from '../utils/geocode'

const TripContext = createContext(null)

const TRIP_STATE_KEY = 'rush_current_trip_state'
const TRIP_HISTORY_KEY = 'rush_trip_history'

// A real driver app reports live GPS; this demo has no second device to
// read a position from, so "acceptRide" stands up a plausible one —
// somewhere 0.6-2.8mi from pickup in a random direction, matching the
// "2-5 min drive" honesty pattern already used elsewhere in the app. Both
// the rider's map and the driver's own map read this same simulated
// position, so — like a real backend would — every client sees one
// consistent truth rather than each view inventing its own.
const DRIVER_APPROACH_MIN_MI = 0.6
const DRIVER_APPROACH_MAX_MI = 2.8
const DRIVER_APPROACH_AVG_MPH = 22

function simulateDriverApproach(pickupCoords) {
  if (!pickupCoords) return null
  const distanceMiles = DRIVER_APPROACH_MIN_MI + Math.random() * (DRIVER_APPROACH_MAX_MI - DRIVER_APPROACH_MIN_MI)
  const bearingDeg = Math.random() * 360
  const coords = offsetLatLng(pickupCoords, distanceMiles, bearingDeg)
  const etaMin = Math.max(1, Math.round((distanceMiles / DRIVER_APPROACH_AVG_MPH) * 60))
  return {
    coords,
    distanceLabel: `${distanceMiles.toFixed(1)} mi`,
    etaLabel: `${etaMin} min`,
  }
}

export function TripProvider({ children }) {
  const isStaleTrip = (t) => {
    if (!t) return false
    // Active statuses are OK; terminal/cancelled states lingering in storage
    // would confuse the demo flow on reload.
    const active = ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS']
    if (!active.includes(t.status)) return true
    // A trip sitting in SEARCHING without progress for >15 min is stale.
    try {
      const created = new Date(t.createdAt || '')
      if (!isNaN(created.getTime()) && Date.now() - created.getTime() > 15 * 60 * 1000) {
        return true
      }
    } catch {
      return true
    }
    return false
  }

  const [currentTrip, setCurrentTrip] = useState(() => {
    try {
      const saved = localStorage.getItem(TRIP_STATE_KEY)
      const parsed = saved ? JSON.parse(saved) : null
      return isStaleTrip(parsed) ? null : parsed
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

  // Always-current mirror of currentTrip, read by callbacks below that need
  // to be referentially stable (useCallback(..., [])) without going stale.
  // Plain assignment during render — no effect needed, see React's "latest
  // ref" idiom.
  const currentTripRef = useRef(currentTrip)
  currentTripRef.current = currentTrip

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

  // Every function below is wrapped in useCallback with an empty dep array
  // so its identity never changes across renders. That's not just tidiness:
  // consumers (App.jsx) put these in useEffect dependency arrays alongside
  // currentTrip's own fields, and an unstable function reference there
  // forces those effects to re-run on *every* render — which, for the
  // auto-advance ride simulation, was cancelling and rescheduling its own
  // "complete after 600ms" timer every ~80ms forever, so a trip could reach
  // 100% progress and then simply never finish. None of these read
  // `currentTrip` from closure anymore (that would go stale against a `[]`
  // dep array) — they either use the functional setState form (reading
  // `prev` directly) or, where a second piece of state also needs the
  // trip's data (completeRide), read `currentTripRef.current`.
  const requestRide = useCallback(
    ({ pickup, destination, tier, fare, eta, distance, riderName, pickupCoords, dropoffCoords }) => {
      // Simulated now, not on accept: a real dispatch system already knows
      // roughly where nearby driver positions are the moment it broadcasts
      // an offer — that's what lets a driver's app show "2.1 mi away" on
      // the incoming request card *before* they've tapped Accept. Doing it
      // here means that number is set once and stays consistent from the
      // driver's offer card through to the actual pickup-leg animation,
      // rather than changing when the driver accepts.
      const approach = simulateDriverApproach(pickupCoords)
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
        driverStartCoords: approach?.coords || null,
        pickupDistance: approach?.distanceLabel || distance || '2.4 mi',
        pickupEta: approach?.etaLabel || eta || '8 min',
      }
      setCurrentTrip(newRequest)
      return newRequest
    },
    []
  )

  const cancelRequest = useCallback(() => {
    setCurrentTrip((prev) => (prev ? null : prev))
  }, [])

  const resetTripState = useCallback(() => {
    setCurrentTrip(null)
  }, [])

  const acceptRide = useCallback((driverInfo) => {
    setCurrentTrip((prev) => {
      if (!prev) return prev
      // requestRide already computed the approach; this fallback only
      // matters for a trip persisted before that existed (e.g. a stale
      // localStorage entry from an older build reloaded mid-flight).
      const approach = prev.driverStartCoords ? null : simulateDriverApproach(prev.pickupCoords)
      return {
        ...prev,
        status: 'ACCEPTED',
        progress: 0, // leg 1 (driver -> pickup) starts fresh
        driverStartCoords: prev.driverStartCoords || approach?.coords || null,
        pickupDistance: prev.pickupDistance || approach?.distanceLabel || prev.distance,
        pickupEta: prev.pickupEta || approach?.etaLabel || prev.eta,
        driver: driverInfo || {
          name: 'Marcus Vance',
          car: 'Tesla Model Y — Matte Black',
          plate: 'RUSH-88',
          rating: 4.98,
          initials: 'MV',
        },
      }
    })
  }, [])

  const startRide = useCallback(() => {
    setCurrentTrip((prev) => (prev ? { ...prev, status: 'IN_PROGRESS', progress: 0.1 } : prev))
  }, [])

  const updateProgress = useCallback((progress) => {
    setCurrentTrip((prev) => (prev ? { ...prev, progress } : null))
  }, [])

  const completeRide = useCallback(() => {
    const trip = currentTripRef.current
    if (!trip) return undefined

    const completedEntry = {
      id: trip.id || `trip_${Date.now()}`,
      date: new Date().toISOString(),
      pickup: trip.pickup,
      destination: trip.destination,
      tier: trip.tier,
      fare: trip.fare,
      status: 'Completed',
      driverName: trip.driver?.name || 'Marcus Vance',
      car: trip.driver?.car || 'Tesla Model Y — Matte Black',
      rating: 5,
    }

    setTripHistory((prev) => [completedEntry, ...prev])
    setCurrentTrip(null)
    return completedEntry
  }, [])

  // Tips are chosen on the Trip Completed screen, after completeRide()
  // already wrote the trip's history entry — so the tip has to be patched
  // onto that entry after the fact, or trip history and the wallet's
  // activity feed would silently disagree with what the rider was actually
  // charged.
  const recordTip = useCallback((tripId, amount) => {
    if (!tripId || !amount) return
    setTripHistory((prev) => prev.map((t) => (t.id === tripId ? { ...t, tip: amount } : t)))
  }, [])

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
        recordTip,
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
