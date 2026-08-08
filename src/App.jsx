import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Car,
  Check,
  CircleCheck,
  Clock,
  Home,
  MessageSquare,
  Navigation,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  Zap,
} from 'lucide-react'

import { AuthProvider, useAuth } from './context/AuthContext'
import { TripProvider, useTrip } from './context/TripContext'
import useTimeout from './utils/useTimeout'
import AccountModal from './components/AccountModal'
import LocationSearch from './components/LocationSearch'
import WalletModal from './components/WalletModal'
import HistoryModal from './components/HistoryModal'
import FeedbackModal from './components/FeedbackModal'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import SignUpFlow from './components/SignUpFlow'
import RideConfirmSheet from './components/RideConfirmSheet'
import HeroMoment from './components/HeroMoment'
import { PREFERENCES, RIDE_TIERS, PRESET_DESTINATIONS, SAVED_PLACES } from './data/mockData'
import { triggerHaptic } from './utils/haptics'

const usd = (n) => `$${(n || 0).toFixed(2)}`
const DRIVER_PCT = 0.88

// MapLibre is a large dependency — lazy-load it so the auth landing page
// and app shell stay instant. The map is network-dependent anyway.
const MapEngine = lazy(() => import('./components/MapEngine'))

function MapShell(props) {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-[#0A0D15]" />}>
      <MapEngine {...props} />
    </Suspense>
  )
}

/* ------------------------------------------------------------------ */
/*  Small UI atoms                                                     */
/* ------------------------------------------------------------------ */

function Avatar({ size = 44, initials = 'US', className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl font-black text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: '#38BDF8',
      }}
    >
      <span className="text-[13px] font-bold">{initials}</span>
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#12151E] bg-emerald-400" />
    </div>
  )
}

function RoleSwitch({ value, onChange }) {
  const isDriver = value === 'driver'
  return (
    <button
      onClick={() => {
        triggerHaptic('light')
        onChange(isDriver ? 'passenger' : 'driver')
      }}
      title={isDriver ? 'Switch to rider view' : 'Switch to driver view'}
      className="flex h-8 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 text-[10.5px] font-bold text-white/70 transition-colors hover:text-white active:scale-95"
    >
      {isDriver ? <Zap size={13} className="text-[#38BDF8]" /> : <Car size={13} className="text-[#38BDF8]" />}
      {isDriver ? 'Driver' : 'Rider'}
    </button>
  )
}

function Header({ view, setView, onOpenAuth, onOpenWallet }) {
  const { user } = useAuth()

  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-white/8 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Rush Logo"
            className="h-7 w-7 rounded-lg object-cover border border-white/15"
          />
          <div className="leading-none">
            <p className="text-[13px] font-extrabold leading-none tracking-wide text-white">RUSH</p>
            <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Human-driven
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-white/80 transition-colors hover:text-white"
          >
            <Wallet size={13} className="text-[#38BDF8]" />
            {usd(user?.walletBalance)}
          </button>

          <RoleSwitch value={view} onChange={setView} />

          {user ? (
            <button onClick={onOpenAuth} className="shrink-0">
              <Avatar size={30} initials={user.avatar || 'US'} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function BottomNav({ onOpenWallet, onOpenHistory, onOpenFeedback }) {
  return (
    <div className="relative z-30 glass-strong border-t border-white/8 pb-[max(env(safe-area-inset-bottom),16px)] pt-2.5">
      <div className="mx-auto flex max-w-lg items-center justify-between px-6">
        <button
          onClick={() => triggerHaptic('click')}
          className="flex flex-col items-center gap-1 text-[#38BDF8] active:scale-95 transition-transform"
        >
          <Home size={19} strokeWidth={2.2} />
          <span className="text-[9px] font-semibold text-white/80">Ride</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('click')
            onOpenWallet()
          }}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white active:scale-95 transition-transform"
        >
          <Wallet size={19} strokeWidth={2.2} />
          <span className="text-[9px] font-semibold text-white/60">Wallet</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('click')
            onOpenHistory()
          }}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white active:scale-95 transition-transform"
        >
          <Clock size={19} strokeWidth={2.2} />
          <span className="text-[9px] font-semibold text-white/60">History</span>
        </button>
        <button
          onClick={() => {
            triggerHaptic('click')
            onOpenFeedback()
          }}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-white active:scale-95 transition-transform"
        >
          <MessageSquare size={19} strokeWidth={2.2} />
          <span className="text-[9px] font-semibold text-white/60">Feedback</span>
        </button>
      </div>
      <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-white/15" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Passenger View — Where to? → confirm → searching → matched → done  */
/* ------------------------------------------------------------------ */

function PassengerViewContent({ onOpenWallet, onImmersiveChange }) {
  const { user, deductRiderFare } = useAuth()
  const { currentTrip, tripHistory, requestRide, cancelRequest, acceptRide, startRide, completeRide, updateProgress } = useTrip()
  const timers = useTimeout()

  const prevTripId = useRef(null)

  const [pickup, setPickup] = useState('Current Location')
  const [destination, setDestination] = useState(null)
  const [selectedTier, setSelectedTier] = useState('standard')
  const [stage, setStage] = useState('home') // home | dest | confirm | searching | matched | completed
  const [pickupCoords, setPickupCoords] = useState({ lat: 39.7526, lng: -105.0047 })
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 39.7539, lng: -105.0002 })
  const [demoNotification, setDemoNotification] = useState(null)
  const [searchNote, setSearchNote] = useState(false)
  const [tip, setTip] = useState(null)
  const [rating, setRating] = useState(0)
  const [lastCompleted, setLastCompleted] = useState(null)

  const currentTierObj = RIDE_TIERS.find((t) => t.id === selectedTier) || RIDE_TIERS[0]
  const basePrice = destination?.distance ? parseFloat(destination.distance) * 2.2 + 10 : 22.5
  const totalFare = Math.round(basePrice * currentTierObj.multiplier * 100) / 100

  const recents = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const t of tripHistory) {
      const match = PRESET_DESTINATIONS.find((d) => d.name === t.destination)
      if (match && !seen.has(match.id)) {
        seen.add(match.id)
        list.push(match)
      }
      if (list.length >= 3) break
    }
    return list
  }, [tripHistory])

  useEffect(() => {
    if (currentTrip) prevTripId.current = currentTrip.id
  }, [currentTrip])

  // Hide the tab bar while a ride is actively being searched/tracked/wrapped up.
  useEffect(() => {
    onImmersiveChange?.(stage === 'searching' || stage === 'matched' || stage === 'completed')
  }, [stage, onImmersiveChange])

  useEffect(() => {
    if (!currentTrip) {
      if (prevTripId.current) {
        const completedTrip = tripHistory.find((t) => t.id === prevTripId.current)
        if (completedTrip) {
          setStage('completed')
          setLastCompleted(completedTrip)
          deductRiderFare(completedTrip.fare)
        }
        prevTripId.current = null
      } else if (!['dest', 'confirm', 'completed'].includes(stage)) {
        setStage('home')
      }
    } else if (currentTrip.status === 'SEARCHING') {
      setStage('searching')
    } else if (currentTrip.status === 'ACCEPTED' || currentTrip.status === 'IN_PROGRESS') {
      setStage('matched')
    }
  }, [currentTrip, stage, tripHistory, deductRiderFare])

  useEffect(() => {
    let timeout
    if (currentTrip?.status === 'IN_PROGRESS') {
      timeout = setTimeout(() => {
        updateProgress(Math.min(1, (currentTrip.progress || 0.1) + 0.005))
      }, 100)
    }
    return () => clearTimeout(timeout)
  }, [currentTrip?.status, currentTrip?.progress, updateProgress])

  // Honest searching copy: after a few seconds, tell the user the search is expanding.
  useEffect(() => {
    let t
    if (stage === 'searching') {
      setSearchNote(false)
      t = setTimeout(() => setSearchNote(true), 6500)
    }
    return () => clearTimeout(t)
  }, [stage])

  const openDestinationSearch = () => {
    triggerHaptic('light')
    setStage('dest')
  }

  const handleSelectDestination = (dest) => {
    triggerHaptic('light')
    setDestination(dest)
    if (dest.latlng) setDropoffCoords(dest.latlng)
    setStage('confirm')
  }

  const handleRequestRide = () => {
    triggerHaptic('medium')
    if (user && user.walletBalance < totalFare) {
      setDemoNotification('Insufficient wallet balance. Please add demo funds.')
      timers.set(() => setDemoNotification(null), 3000)
      onOpenWallet()
      return
    }
    requestRide({
      pickup,
      destination: destination ? destination.name : 'Union Station',
      tier: currentTierObj.name,
      fare: totalFare,
      eta: currentTierObj.etaRange,
      distance: destination ? destination.distance : '2.1 mi',
      riderName: user ? user.name : 'Alex Rivera',
    })
    setStage('searching')
  }

  const handleAutoMatchDriver = () => {
    triggerHaptic('success')
    acceptRide({
      name: 'Marcus Vance',
      car: 'Tesla Model Y — Matte Black',
      plate: 'RUSH-88',
      rating: 4.98,
      initials: 'MV',
      verified: true,
    })
  }

  const handleSimulateStartTrip = () => {
    triggerHaptic('medium')
    startRide()
  }

  const handleSimulateCompleteTrip = () => {
    triggerHaptic('success')
    completeRide()
    setDemoNotification(`Trip Complete! Fare of ${usd(currentTrip?.fare)} processed.`)
    timers.set(() => setDemoNotification(null), 3500)
  }

  const finishCompleted = () => {
    triggerHaptic('success')
    setStage('home')
    setTip(null)
    setRating(0)
    setLastCompleted(null)
  }

  const handleMapClick = (coords) => {
    if (stage === 'home' || stage === 'confirm') {
      triggerHaptic('click')
      setPickupCoords(coords)
      setPickup('Pinned location')
    }
  }

  const walkingNote = pickup === 'Current Location' ? '~2 min walk' : 'At pin'

  return (
    <div className="relative h-full">
      {/* Dynamic Demo Banner Notification */}
      {demoNotification && (
        <div className="absolute inset-x-0 top-3 z-30 flex justify-center px-3">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex w-full max-w-lg items-center justify-between rounded-2xl border border-[#34D399]/40 bg-[#0A0D15]/90 p-3 text-[12px] font-bold text-[#34D399] shadow-xl backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span>{demoNotification}</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Interactive Map */}
      <div className="absolute inset-0">
        <MapShell
          carProgress={currentTrip?.progress || 0}
          radar={stage === 'searching'}
          showRoute={stage !== 'home'}
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Sheet UI */}
      <AnimatePresence mode="wait">
        {stage === 'home' && (
          <motion.div
            key="home"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3"
          >
            <div className="glass w-full max-w-lg rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              {/* Where to? — the single primary action */}
              <button
                onClick={openDestinationSearch}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-left transition-all hover:border-[#38BDF8]/50 hover:bg-white/[0.09] active:scale-[0.99]"
              >
                <Search size={18} className="shrink-0 text-[#38BDF8]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold text-white">Where to?</p>
                  <p className="text-[10.5px] font-medium text-white/40">
                    Pickup: {pickup}
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-white/40" />
              </button>

              {/* Saved places */}
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {SAVED_PLACES.map((place) => {
                  const Icon = place.icon
                  return (
                    <button
                      key={place.id}
                      onClick={() => handleSelectDestination(place)}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11.5px] font-bold text-white/80 transition-all hover:border-[#38BDF8]/40 hover:text-white active:scale-95"
                    >
                      <Icon size={14} style={{ color: place.tint }} />
                      {place.name}
                    </button>
                  )
                })}
                {recents.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleSelectDestination(r)}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11.5px] font-bold text-white/80 transition-all hover:border-[#38BDF8]/40 hover:text-white active:scale-95"
                    >
                      <Icon size={14} style={{ color: r.tint }} />
                      {r.name}
                    </button>
                  )
                })}
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-white/35">
                <ShieldCheck size={11} className="text-[#34D399]" />
                88% of every fare goes to your driver. No surge games.
              </p>
            </div>
          </motion.div>
        )}

        {stage === 'dest' && (
          <motion.div
            key="dest"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3"
          >
            <div className="glass max-h-[78dvh] w-full max-w-lg rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <LocationSearch
                pickup={pickup}
                onPickupChange={setPickup}
                destination={destination}
                onSelectDestination={handleSelectDestination}
                onBack={() => setStage('home')}
                savedPlaces={SAVED_PLACES}
                recents={recents}
              />
            </div>
          </motion.div>
        )}

        {stage === 'confirm' && destination && (
          <motion.div
            key="confirm"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3"
          >
            <div className="glass max-h-[82dvh] w-full max-w-lg rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <RideConfirmSheet
                pickup={pickup}
                destination={destination}
                basePrice={basePrice}
                tiers={RIDE_TIERS}
                selectedTierId={selectedTier}
                onTierChange={setSelectedTier}
                onBack={() => setStage('dest')}
                onRequest={handleRequestRide}
                user={user}
                walkingNote={walkingNote}
                onOpenWallet={onOpenWallet}
              />
            </div>
          </motion.div>
        )}

        {stage === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
          >
            <div className="glass-strong flex w-full max-w-[320px] flex-col items-center rounded-3xl border border-white/10 p-6 shadow-2xl text-center">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#38BDF8]/25">
                <span className="absolute inset-0 rounded-full border border-[#38BDF8]/40 animate-pulse-ring" />
                <Radio size={28} className="animate-spin text-[#38BDF8]" style={{ animationDuration: '2s' }} />
              </div>
              <p className="text-[14px] font-extrabold text-white">Matching you with a human driver…</p>
              <p className="mt-1 text-center text-[11px] font-medium leading-relaxed text-white/50">
                {searchNote
                  ? 'Still searching — expanding to nearby neighborhoods. Typically adds 3–6 min in Denver.'
                  : 'Usually takes 2–4 minutes in your area.'}
              </p>

              <button
                onClick={handleAutoMatchDriver}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#34D399]/50 bg-[#34D399]/15 py-2.5 text-[12px] font-extrabold text-[#34D399] transition-all active:scale-[0.98]"
              >
                <Zap size={14} /> Auto-Match Demo Driver
              </button>

              <p className="mt-2 text-[9.5px] font-semibold text-white/40">
                Or tap "Driver" in the header to accept the request manually
              </p>

              <button
                onClick={() => {
                  triggerHaptic('light')
                  cancelRequest()
                }}
                className="mt-3 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-1.5 text-[11px] font-bold text-white/60 hover:text-white"
              >
                Cancel Request
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'matched' && currentTrip && (
          <motion.div
            key="matched"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-3"
          >
            <div className="glass w-full max-w-lg rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-[#38BDF8]/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#38BDF8]">
                  {currentTrip.status === 'ACCEPTED' ? 'Driver En Route' : 'Trip In Progress'}
                </span>
                <span className="text-[12px] font-black text-[#34D399]">{usd(currentTrip.fare)}</span>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <Avatar size={44} initials={currentTrip.driver?.initials || 'MV'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-extrabold text-white">
                      {currentTrip.driver?.name || 'Marcus Vance'}
                    </p>
                    {(currentTrip.driver?.verified ?? true) && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-[#34D399]">
                        <ShieldCheck size={10} /> Verified Human
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10.5px] font-medium text-white/50">
                    {currentTrip.driver?.car || 'Tesla Model Y — Matte Black'} • ★{' '}
                    {currentTrip.driver?.rating || 4.98}
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-1 text-[9px] font-bold tracking-widest text-white/70">
                    {currentTrip.driver?.plate || 'RUSH-88'}
                  </span>
                </div>
              </div>

              {/* Trip preferences — moved to in-ride, small and quiet */}
              <div className="mt-2 flex flex-wrap gap-2">
                {PREFERENCES.filter((p) => ['quiet', 'ac'].includes(p.key)).map((p) => {
                  const Icon = p.icon
                  return (
                    <span
                      key={p.key}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-white/50"
                    >
                      <Icon size={11} /> {p.label}
                    </span>
                  )
                })}
              </div>

              {/* Ride Lifecycle Demo Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {currentTrip.status === 'ACCEPTED' ? (
                  <button
                    onClick={handleSimulateStartTrip}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/15 py-2 text-[11px] font-bold text-[#38BDF8] active:scale-95"
                  >
                    Start Ride Demo
                  </button>
                ) : (
                  <button
                    onClick={handleSimulateCompleteTrip}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#34D399]/40 bg-[#34D399]/15 py-2 text-[11px] font-bold text-[#34D399] active:scale-95"
                  >
                    <Check size={14} /> Complete Ride
                  </button>
                )}
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    cancelRequest()
                  }}
                  className="flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] py-2 text-[11px] font-semibold text-white/50 hover:text-white"
                >
                  End Session
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {stage === 'completed' && (
          <motion.div
            key="completed"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-void/80 backdrop-blur-sm"
          >
            <div className="glass-strong flex max-h-full w-full max-w-[320px] flex-col overflow-y-auto no-scrollbar rounded-3xl border border-[#34D399]/30 p-6 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399] mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Trip Completed</h2>
              <p className="mt-1 text-sm font-medium text-white/60">
                {lastCompleted?.driverName || 'Your driver'} got you there safely.
              </p>

              {/* Receipt */}
              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Receipt</p>
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-white/55">{lastCompleted?.tier || 'Rush Standard'} fare</span>
                  <span className="text-white">{usd(lastCompleted?.fare || 0)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-[12px] font-semibold">
                  <span className="text-white/55">Driver payout (88%)</span>
                  <span className="text-[#34D399]">−{usd((lastCompleted?.fare || 0) * DRIVER_PCT)}</span>
                </div>
                <div className="mt-1.5 flex justify-between text-[12px] font-semibold">
                  <span className="text-white/55">Platform fee (12%)</span>
                  <span className="text-white/80">{usd((lastCompleted?.fare || 0) * (1 - DRIVER_PCT))}</span>
                </div>
                {tip > 0 && (
                  <div className="mt-1.5 flex justify-between text-[12px] font-semibold">
                    <span className="text-white/55">Driver tip</span>
                    <span className="text-[#FFD166]">+{usd(tip)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-[13px] font-bold">
                  <span className="text-white/70">Total paid</span>
                  <span className="text-white">{usd((lastCompleted?.fare || 0) + tip)}</span>
                </div>
              </div>

              {/* Tip selector */}
              <div className="mt-4 w-full text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Add a tip?</p>
                <div className="flex justify-between gap-2">
                  {[{ v: 0, l: 'No tip' }, { v: 2, l: '$2' }, { v: 5, l: '$5' }, { v: 10, l: '$10' }].map((t) => (
                    <button
                      key={t.v}
                      onClick={() => {
                        triggerHaptic('light')
                        setTip(t.v)
                      }}
                      className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-all active:scale-95 ${
                        tip === t.v
                          ? 'border-[#FFD166]/60 bg-[#FFD166]/15 text-[#FFD166]'
                          : 'border-white/10 bg-white/[0.05] text-white/60'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star rating */}
              <div className="mt-4 w-full text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Rate your trip</p>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <motion.button
                      key={s}
                      whileTap={{ scale: 0.75 }}
                      onClick={() => {
                        triggerHaptic('light')
                        setRating(s)
                      }}
                      className="p-1"
                    >
                      <Star
                        size={28}
                        strokeWidth={1.6}
                        fill={s <= rating ? '#FFD166' : 'transparent'}
                        stroke={s <= rating ? '#FFD166' : 'rgba(255,255,255,0.25)'}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="mt-1.5 text-center text-[11px] font-medium text-white/45">
                  {rating === 0 ? 'Tap a star to rate' : `${rating} star${rating > 1 ? 's' : ''} — thanks!`}
                </p>
              </div>

              <button
                onClick={finishCompleted}
                className="mt-5 w-full rounded-xl bg-[#38BDF8] py-3 text-sm font-black text-[#061018] active:scale-95 transition-transform"
              >
                Submit Rating & Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Driver View — online toggle, honest request card, payout-first     */
/* ------------------------------------------------------------------ */

function DriverViewContent({ onImmersiveChange }) {
  const { user, creditDriverEarnings } = useAuth()
  const { currentTrip, acceptRide, startRide, completeRide, cancelRequest } = useTrip()
  const timers = useTimeout()

  const [online, setOnline] = useState(true)
  const [toast, setToast] = useState(null)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (currentTrip?.status === 'SEARCHING') setCountdown(10)
  }, [currentTrip?.id, currentTrip?.status])

  useEffect(() => {
    onImmersiveChange?.(Boolean(currentTrip))
  }, [currentTrip, onImmersiveChange])

  useEffect(() => {
    let timer
    if (currentTrip?.status === 'SEARCHING' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    } else if (currentTrip?.status === 'SEARCHING' && countdown === 0) {
      cancelRequest()
    }
    return () => clearTimeout(timer)
  }, [countdown, currentTrip?.status, cancelRequest])

  const handleAccept = () => {
    acceptRide({
      name: user ? user.name : 'Marcus Vance',
      car: user?.car || 'Tesla Model Y — Matte Black',
      plate: user?.plate || 'RUSH-88',
      rating: 4.98,
      initials: user?.avatar || 'MV',
      verified: !!user?.humanVerified,
    })
  }

  const handleComplete = () => {
    if (!currentTrip) return
    const fare = currentTrip.driverFare || currentTrip.fare * DRIVER_PCT
    creditDriverEarnings(fare)
    completeRide()
    setToast(`Trip Completed! +${usd(fare)} added to wallet`)
    timers.set(() => setToast(null), 3500)
  }

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar">
      <div className="absolute inset-0">
        <MapShell showRoute={Boolean(currentTrip)} radar={online && !currentTrip} />
      </div>

      <div className="relative z-10 mx-auto min-h-full w-full max-w-lg p-3">
        {/* Status card */}
        <div className="glass rounded-3xl border border-white/10 p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Driver Operator</p>
              <p className={`mt-0.5 text-[14px] font-extrabold ${online ? 'text-[#34D399]' : 'text-white/60'}`}>
                {online ? 'Online & Listening' : 'Offline'}
              </p>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`relative h-7 w-12 rounded-full border transition-all ${
                online ? 'border-[#34D399]/50 bg-[#34D399]/20' : 'border-white/15 bg-white/[0.06]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  online ? 'left-6 bg-[#34D399]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/55">Today</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-white">{usd(user?.todayEarnings || 286.4)}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/55">Trips</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-[#38BDF8]">{user?.todayRides || 14}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/55">Keep Rate</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-[#34D399]">88%</p>
            </div>
          </div>
        </div>

        {/* Incoming Trip Alert */}
        {online && currentTrip && currentTrip.status === 'SEARCHING' && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-strong mt-3 rounded-3xl border border-[#38BDF8]/40 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-[#38BDF8]/20 px-2.5 py-0.5 text-[9.5px] font-black uppercase text-[#38BDF8]">
                New Trip Request ({countdown}s)
              </span>
              <span className="text-[14px] font-black text-[#34D399]">
                Earn {usd(currentTrip.driverFare || currentTrip.fare * 0.88)}
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-[12px]">
              <p className="font-bold text-white">Rider: {currentTrip.riderName}</p>
              <p className="truncate text-[11px] text-white/60">Pickup: {currentTrip.pickup}</p>
              <p className="truncate text-[11px] text-white/60">Dropoff: {currentTrip.destination}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-[#38BDF8]">
                <Navigation size={11} /> Rider is {currentTrip.distance || '2.1 mi'} away — about{' '}
                {currentTrip.eta || '2–5 min'} drive to pickup
              </p>
            </div>

            <button
              onClick={handleAccept}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#34D399] py-3 text-[13px] font-black text-[#04140F]"
            >
              <Check size={16} /> Accept Rush Ride
            </button>
          </motion.div>
        )}

        {/* Active Trip Execution */}
        {currentTrip && (currentTrip.status === 'ACCEPTED' || currentTrip.status === 'IN_PROGRESS') && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-strong mt-3 rounded-3xl border border-white/15 p-4"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
              {currentTrip.status === 'ACCEPTED' ? 'En Route to Pickup' : 'Driving to Dropoff'}
            </p>
            <p className="truncate text-[14px] font-extrabold text-white">{currentTrip.destination}</p>
            <p className="text-[11px] font-medium text-[#34D399]">
              Net Payout: {usd(currentTrip.driverFare || currentTrip.fare * 0.88)} (88%)
            </p>

            {currentTrip.status === 'ACCEPTED' ? (
              <button
                onClick={startRide}
                className="mt-3 w-full rounded-xl border border-[#38BDF8]/50 bg-[#38BDF8]/15 py-3 text-[13px] font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25"
              >
                Start Ride
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="mt-3 w-full rounded-xl border border-[#34D399]/50 bg-[#34D399]/15 py-3 text-[13px] font-bold text-[#34D399] hover:bg-[#34D399]/25"
              >
                Complete Ride & Claim Payout
              </button>
            )}
          </motion.div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="glass-strong mt-3 flex items-center gap-2 rounded-2xl border border-[#34D399]/40 p-3 text-[12px] font-bold text-[#34D399]">
            <CircleCheck size={16} /> {toast}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App Shell                                                          */
/* ------------------------------------------------------------------ */

function AppShell({
  view,
  setView,
  isAuthOpen,
  setIsAuthOpen,
  isWalletOpen,
  setIsWalletOpen,
  isHistoryOpen,
  setIsHistoryOpen,
  isFeedbackOpen,
  setIsFeedbackOpen,
}) {
  const { user } = useAuth()
  const [immersive, setImmersive] = useState(false)
  const [showHero, setShowHero] = useState(true)

  useEffect(() => {
    if (user?.role) setView(user.role)
  }, [user?.role, setView])

  useEffect(() => {
    setImmersive(false)
  }, [view])

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-void">
      <Header
        view={view}
        setView={setView}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWallet={() => setIsWalletOpen(true)}
      />

      <main className="relative flex-1 overflow-hidden">
        {view === 'passenger' ? (
          <PassengerViewContent onOpenWallet={() => setIsWalletOpen(true)} onImmersiveChange={setImmersive} />
        ) : (
          <DriverViewContent onImmersiveChange={setImmersive} />
        )}
      </main>

      {!immersive && (
        <BottomNav
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />
      )}

      <AccountModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <PWAInstallPrompt />
      {showHero && <HeroMoment onDone={() => setShowHero(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Root Gate — the landing/auth page is the front door. Users only    */
/*  reach the main UI after authenticating (or completing the flow).   */
/* ------------------------------------------------------------------ */

function RootGate() {
  const { user } = useAuth()
  const [sessionDone, setSessionDone] = useState(() => !!user)
  const [view, setView] = useState('passenger')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  // Returning visitors (restored session) skip the landing page;
  // logging out sends everyone back to the front door.
  useEffect(() => {
    if (!user) setSessionDone(false)
  }, [user])

  if (!user || !sessionDone) {
    return <SignUpFlow onComplete={() => setSessionDone(true)} />
  }

  return (
    <AppShell
      view={view}
      setView={setView}
      isAuthOpen={isAuthOpen}
      setIsAuthOpen={setIsAuthOpen}
      isWalletOpen={isWalletOpen}
      setIsWalletOpen={setIsWalletOpen}
      isHistoryOpen={isHistoryOpen}
      setIsHistoryOpen={setIsHistoryOpen}
      isFeedbackOpen={isFeedbackOpen}
      setIsFeedbackOpen={setIsFeedbackOpen}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Main App Root Component                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <AuthProvider>
      <TripProvider>
        <div className="relative h-[100dvh] w-full overflow-hidden bg-void font-sans">
          <RootGate />
        </div>
      </TripProvider>
    </AuthProvider>
  )
}
