import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { TripProvider, useTrip } from '../context/TripContext'

function TestConsumer({ apiRef }) {
  const trip = useTrip()
  apiRef.current = trip
  return (
    <div>
      <span data-testid="trip-status">{trip.currentTrip?.status || 'none'}</span>
      <span data-testid="trip-id">{trip.currentTrip?.id || 'none'}</span>
      <span data-testid="history-count">{trip.tripHistory.length}</span>
    </div>
  )
}

function renderTrip() {
  const apiRef = { current: null }
  render(
    <TripProvider>
      <TestConsumer apiRef={apiRef} />
    </TripProvider>,
  )
  return apiRef
}

function clearStorage() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
  keys.forEach((k) => localStorage.removeItem(k))
}

describe('TripContext', () => {
  beforeEach(() => {
    clearStorage()
  })

  describe('requestRide', () => {
    it('creates a trip with SEARCHING status', () => {
      const api = renderTrip()
      act(() => {
        api.current.requestRide({
          pickup: 'Test Pickup',
          destination: 'Test Destination',
          tier: 'Rush Express',
          fare: 24.90,
          eta: '8 min',
          distance: '2.4 mi',
          riderName: 'Test User',
        })
      })
      expect(screen.getByTestId('trip-status')).toHaveTextContent('SEARCHING')
      expect(screen.getByTestId('trip-id')).not.toHaveTextContent('none')
    })

    it('persists trip state to localStorage', () => {
      const api = renderTrip()
      act(() => {
        api.current.requestRide({
          pickup: 'P',
          destination: 'D',
          tier: 'standard',
          fare: 10,
          eta: '5 min',
          distance: '1 mi',
          riderName: 'Test',
        })
      })
      const stored = JSON.parse(localStorage.getItem('rush_current_trip_state'))
      expect(stored).not.toBeNull()
      expect(stored.status).toBe('SEARCHING')
    })

    it('stores pickupCoords/dropoffCoords on the trip when provided', () => {
      const api = renderTrip()
      const pickupCoords = { lat: 39.7526, lng: -105.0047 }
      const dropoffCoords = { lat: 39.7539, lng: -105.0002 }
      act(() => {
        api.current.requestRide({
          pickup: 'Home',
          destination: 'Union Station',
          tier: 'standard',
          fare: 10,
          eta: '5 min',
          distance: '1 mi',
          riderName: 'Test',
          pickupCoords,
          dropoffCoords,
        })
      })
      expect(api.current.currentTrip.pickupCoords).toEqual(pickupCoords)
      expect(api.current.currentTrip.dropoffCoords).toEqual(dropoffCoords)

      const stored = JSON.parse(localStorage.getItem('rush_current_trip_state'))
      expect(stored.pickupCoords).toEqual(pickupCoords)
      expect(stored.dropoffCoords).toEqual(dropoffCoords)
    })

    it('leaves pickupCoords/dropoffCoords null when not provided (legacy trips)', () => {
      const api = renderTrip()
      act(() => {
        api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' })
      })
      expect(api.current.currentTrip.pickupCoords).toBeNull()
      expect(api.current.currentTrip.dropoffCoords).toBeNull()
    })
  })

  describe('cancelRequest', () => {
    it('clears the current trip', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      expect(screen.getByTestId('trip-status')).toHaveTextContent('SEARCHING')

      act(() => api.current.cancelRequest())
      expect(screen.getByTestId('trip-status')).toHaveTextContent('none')
    })

    it('removes trip state from localStorage', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      expect(localStorage.getItem('rush_current_trip_state')).not.toBeNull()

      act(() => api.current.cancelRequest())
      expect(localStorage.getItem('rush_current_trip_state')).toBeNull()
    })

    it('is safe to call when no trip exists', () => {
      const api = renderTrip()
      expect(() => act(() => api.current.cancelRequest())).not.toThrow()
    })
  })

  describe('resetTripState', () => {
    it('clears current trip', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      expect(screen.getByTestId('trip-status')).toHaveTextContent('SEARCHING')

      act(() => api.current.resetTripState())
      expect(screen.getByTestId('trip-status')).toHaveTextContent('none')
    })

    it('removes trip state from localStorage', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      expect(localStorage.getItem('rush_current_trip_state')).not.toBeNull()

      act(() => api.current.resetTripState())
      expect(localStorage.getItem('rush_current_trip_state')).toBeNull()
    })

    it('is safe to call when no trip exists', () => {
      const api = renderTrip()
      expect(() => act(() => api.current.resetTripState())).not.toThrow()
      expect(screen.getByTestId('trip-status')).toHaveTextContent('none')
    })

    it('does not affect trip history', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      act(() => api.current.completeRide())
      expect(screen.getByTestId('history-count')).toHaveTextContent(/\d+/)

      const historyCount = api.current.tripHistory.length
      act(() => {
        api.current.requestRide({ pickup: 'P2', destination: 'D2', tier: 's', fare: 12, eta: '3m', distance: '0.5m', riderName: 'T' })
        api.current.resetTripState()
      })
      expect(screen.getByTestId('history-count')).toHaveTextContent(String(historyCount))
    })
  })

  describe('completeRide', () => {
    it('moves trip to history and clears current trip', () => {
      const api = renderTrip()
      act(() => api.current.requestRide({ pickup: 'P', destination: 'D', tier: 's', fare: 10, eta: '5m', distance: '1m', riderName: 'T' }))
      const initialHistory = api.current.tripHistory.length

      act(() => api.current.completeRide())
      expect(screen.getByTestId('trip-status')).toHaveTextContent('none')
      expect(screen.getByTestId('history-count')).toHaveTextContent(String(initialHistory + 1))
    })
  })
})
