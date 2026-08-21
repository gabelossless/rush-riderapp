import { useEffect, useState, useRef, useMemo, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Navigation2,
  Radio,
  Search,
  ShieldAlert,
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
import SafetySheet from './components/SafetySheet'
import HeroMoment from './components/HeroMoment'
import { PREFERENCES, RIDE_TIERS, PRESET_DESTINATIONS, SAVED_PLACES } from './data/mockData'
import { triggerHaptic } from './utils/haptics'
import { haversineMiles } from './utils/geocode'
import { googleMapsUrl, wazeUrl } from './utils/navLinks'

const usd = (n) => `$${(n || 0).toFixed(2)}`
const DRIVER_PCT = 0.88
const DEFAULT_PICKUP_COORDS = { lat: 39.7526, lng: -105.0047 }
const initialsOf = (name) =>
  (name || 'US')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
const weekdayOf = (iso) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' })
}
const DEMO_DRIVER = {
  name: 'Marcus Vance',
  car: 'Tesla Model Y — Matte Black',
  plate: 'RUSH-88',
  rating: 4.98,
  initials: 'MV',
  verified: true,
}

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

// A tab's "active" pill is a resting-state highlight, not a routed-tab
// indicator — Wallet/History/Feedback open overlays, they don't become the
// current screen, so only Ride (the one persistent view underneath
// everything) ever actually carries the active treatment. Pretending the
// others are "selected" when tapped would be modeling a navigation
// structure the app doesn't have.
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-1 flex-col items-center gap-1 py-1 active:scale-95 transition-transform"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 ${
          active ? 'bg-[#38BDF8]/15' : ''
        }`}
      >
        <Icon size={19} strokeWidth={2.3} className={active ? 'text-[#38BDF8]' : 'text-white/45'} />
      </span>
      <span className={`text-[10.5px] font-bold tracking-tight ${active ? 'text-white' : 'text-white/45'}`}>
        {label}
      </span>
    </button>
  )
}

function BottomNav({ onOpenWallet, onOpenHistory, onOpenFeedback }) {
  return (
    <div className="relative z-30 border-t border-white/[0.07] bg-[#0A0D15]/85 pb-[max(env(safe-area-inset-bottom),14px)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-lg items-stretch px-3">
        <NavItem icon={Car} label="Ride" active onClick={() => triggerHaptic('click')} />
        <NavItem
          icon={Wallet}
          label="Wallet"
          onClick={() => {
            triggerHaptic('click')
            onOpenWallet()
          }}
        />
        <NavItem
          icon={Clock}
          label="History"
          onClick={() => {
            triggerHaptic('click')
            onOpenHistory()
          }}
        />
        <NavItem
          icon={MessageSquare}
          label="Feedback"
          onClick={() => {
            triggerHaptic('click')
            onOpenFeedback()
          }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Passenger View — Where to? → confirm → searching → matched → done  */
/* ------------------------------------------------------------------ */

function PassengerViewContent({ onOpenWallet, onImmersiveChange }) {
  const { user, deductRiderFare } = useAuth()
  const {
    currentTrip,
    tripHistory,
    requestRide,
    cancelRequest,
    acceptRide,
    startRide,
    completeRide,
    updateProgress,
    recordTip,
  } = useTrip()
  const timers = useTimeout()

  const prevTripId = useRef(null)

  const [pickup, setPickup] = useState('Current Location')
  const [destination, setDestination] = useState(null)
  const [selectedTier, setSelectedTier] = useState('standard')
  const [stage, setStage] = useState('home') // home | dest | confirm | searching | matched | completed
  const [pickupCoords, setPickupCoords] = useState(DEFAULT_PICKUP_COORDS)
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 39.7539, lng: -105.0002 })
  const [demoNotification, setDemoNotification] = useState(null)
  const [searchNote, setSearchNote] = useState(false)
  const [tip, setTip] = useState(null)
  const [rating, setRating] = useState(0)
  const [lastCompleted, setLastCompleted] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showSafety, setShowSafety] = useState(false)
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [customTipValue, setCustomTipValue] = useState('')

  const currentTierObj = RIDE_TIERS.find((t) => t.id === selectedTier) || RIDE_TIERS[0]
  // Prefer the numeric distanceMiles a geocoded destination carries (see
  // handleSelectDestination) over parsing the display string — that string
  // is prefixed "~" for estimated addresses, which parseFloat can't read
  // (parseFloat('~3.2 mi') is NaN, silently corrupting every fare/wallet
  // calculation downstream). Number.isFinite guards every path so basePrice
  // can never itself become NaN.
  const estimatedMiles = destination?.distanceMiles ?? parseFloat(destination?.distance)
  const basePrice = Number.isFinite(estimatedMiles) ? estimatedMiles * 2.2 + 10 : 22.5
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

  // Ticks currentTrip.progress 0->1 while a leg is actively driving — the
  // same field/ticker drives both legs (ACCEPTED = driver -> pickup,
  // IN_PROGRESS = pickup -> dropoff); acceptRide()/startRide() each reset
  // it to 0 for their leg. This is what actually moves the car marker on
  // the map, via carProgress -> MapEngine.
  useEffect(() => {
    let timeout
    if (currentTrip?.status === 'ACCEPTED' || currentTrip?.status === 'IN_PROGRESS') {
      timeout = setTimeout(() => {
        updateProgress(Math.min(1, (currentTrip.progress || 0) + 0.015))
      }, 80)
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
    // Custom geocoded addresses (typed by the user) don't carry a preset
    // `distance` string — estimate one (straight-line, from pickup) so the
    // fare calc below has something to work with, same as preset places.
    let d = dest
    if (!d.distance && d.latlng) {
      const miles = haversineMiles(pickupCoords, d.latlng)
      // distanceMiles is the numeric value the fare calc actually uses;
      // `distance` stays a display-only string (its "~" prefix isn't
      // parseFloat-safe, see basePrice above).
      if (miles != null) d = { ...d, distance: `~${miles.toFixed(1)} mi`, distanceMiles: miles }
    }
    setDestination(d)
    if (d.latlng) setDropoffCoords(d.latlng)
    setStage('confirm')
  }

  // Typing/selecting a real address for pickup — updates both the display
  // string and the actual coordinates the map/driver rely on.
  const handlePickupSelect = (place) => {
    triggerHaptic('light')
    setPickup(place.name)
    if (place.latlng) setPickupCoords(place.latlng)
  }

  const handlePickupChange = (value) => {
    setPickup(value)
    if (value === 'Current Location') setPickupCoords(DEFAULT_PICKUP_COORDS)
  }

  const handleRequestRide = () => {
    triggerHaptic('medium')
    if (user && user.walletBalance < totalFare && !user.isDemo) {
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
      pickupCoords,
      dropoffCoords,
    })
    setStage('searching')
  }

  // Auto-advancing demo ride lifecycle (Uber/Lyft-style watchable simulation).
  //   SEARCHING → ACCEPTED (driver matches) → IN_PROGRESS (en route → pickup → ride) → COMPLETED
  const tripStatus = currentTrip?.status
  const tripProgress = currentTrip?.progress || 0
  const tripFare = currentTrip?.fare
  useEffect(() => {
    if (!tripStatus) return
    let t

    if (tripStatus === 'SEARCHING') {
      // Match a demo driver after a short realistic wait.
      t = setTimeout(() => acceptRide(DEMO_DRIVER), 2500)
    } else if (tripStatus === 'ACCEPTED' && tripProgress >= 1) {
      // Driver's car has actually reached the pickup pin (see the progress
      // ticker above) — a short settle beat, then "hop in", then leg 2
      // (pickup -> dropoff) begins. Progress-gated the same way completion
      // is below, instead of a fixed timer, so the notification always
      // lines up with the car visibly arriving rather than an arbitrary
      // duration that happened to look right.
      t = setTimeout(() => {
        setDemoNotification('Marcus is here — hop in!')
        setTimeout(() => {
          setDemoNotification(null)
          startRide()
        }, 1800)
      }, 400)
    } else if (tripStatus === 'IN_PROGRESS' && tripProgress >= 1) {
      // Auto-complete once the car animation reaches the destination.
      t = setTimeout(() => {
        completeRide()
        setDemoNotification(`Trip complete — ${usd(tripFare)} charged.`)
        setTimeout(() => setDemoNotification(null), 3500)
      }, 600)
    }

    return () => clearTimeout(t)
    // Deliberately keyed off the derived primitives (tripStatus/tripProgress/
    // tripFare), not the raw `currentTrip` object — see the note on
    // TripContext's action functions for why: currentTrip gets a new object
    // identity on every progress tick, and including it here previously
    // meant this effect tore down and rescheduled its own completion timer
    // on every tick, so it could never survive long enough to fire.
  }, [tripStatus, tripProgress, tripFare, acceptRide, startRide, completeRide])

  const finishCompleted = () => {
    triggerHaptic('success')
    // The base fare is already deducted the moment the trip completes (see
    // the effect above) — before the rider ever sees this tip picker. The
    // tip itself is only ever chosen here, so it has to be settled here too,
    // or "Total Paid" on this screen is a number that was never actually
    // charged. 100% of the tip goes to the driver on real platforms (unlike
    // the base fare, it isn't subject to the FairFare platform cut).
    if (tip > 0) {
      deductRiderFare(tip, { countsAsRide: false })
      if (lastCompleted?.id) recordTip(lastCompleted.id, tip)
    }
    setStage('home')
    setTip(null)
    setRating(0)
    setLastCompleted(null)
    setShowReceipt(false)
    setShowCustomTip(false)
    setCustomTipValue('')
  }

  const handleMapClick = (coords) => {
    if (stage === 'home' || stage === 'confirm') {
      triggerHaptic('click')
      setPickupCoords(coords)
      setPickup('Pinned location')
    }
  }

  const walkingNote = pickup === 'Current Location' ? '~2 min walk' : 'At pin'

  // Which leg of the trip the map/car should currently be showing: while
  // the driver is en route to pickup, the active route is driver -> pickup
  // (not the trip's overall pickup -> dropoff); pickup/dropoff pins stay
  // visible throughout regardless of which leg is animating.
  const isApproachingPickup = tripStatus === 'ACCEPTED'
  const mapRouteOrigin = isApproachingPickup ? currentTrip?.driverStartCoords || pickupCoords : pickupCoords
  const mapRouteDestination = isApproachingPickup ? pickupCoords : dropoffCoords

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
          routeOrigin={mapRouteOrigin}
          routeDestination={mapRouteDestination}
          // Only on the confirm screen — during searching/matched a
          // centered card already occupies the same part of the map for
          // nearby pickup/dropoff pairs, and the label just clutters
          // behind it there.
          dropoffLabel={stage === 'confirm' ? destination?.name : null}
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
                onPickupChange={handlePickupChange}
                onPickupSelect={handlePickupSelect}
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
              <p className="text-base font-extrabold text-white">Matching you with a human driver…</p>
              <p className="mt-1 text-center text-xs font-medium leading-relaxed text-white/50">
                {searchNote
                  ? 'Still searching — expanding to nearby neighborhoods. Typically adds 3–6 min in Denver.'
                  : 'Usually takes 2–4 minutes in your area.'}
              </p>

              <div className="mt-4 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1, 0.9] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-[#38BDF8]"
                  >
                    <Car size={14} />
                  </motion.div>
                ))}
                <span className="text-[10px] font-semibold text-white/40">Pinging nearby drivers…</span>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light')
                  cancelRequest()
                }}
                className="mt-4 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-bold text-white/50 hover:text-white active:scale-95"
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
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full bg-[#38BDF8]/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">
                  {currentTrip.status === 'ACCEPTED' ? 'Driver En Route' : 'Trip In Progress'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('light')
                      setShowSafety(true)
                    }}
                    aria-label="Trip safety"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/55 transition-colors hover:border-[#FF6B6B]/40 hover:text-[#FF6B6B] active:scale-95"
                  >
                    <ShieldAlert size={14} />
                  </button>
                  <span className="text-sm font-black text-[#34D399]">{usd(currentTrip.fare)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/15 bg-zinc-900/90 p-3 shadow-lg shadow-black/60">
                <Avatar size={44} initials={currentTrip.driver?.initials || 'MV'} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-extrabold text-white">
                      {currentTrip.driver?.name || 'Marcus Vance'}
                    </p>
                    {(currentTrip.driver?.verified ?? true) && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#34D399]/15 px-2 py-0.5 text-xs font-extrabold uppercase tracking-wider text-[#34D399]">
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
                  <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-1 text-xs font-bold tracking-widest text-white/70">
                    {currentTrip.driver?.plate || 'RUSH-88'}
                  </span>
                </div>
              </div>

              {/* Live status timeline */}
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#38BDF8] text-[#061018]">
                    <Check size={12} />
                  </span>
                  <span className="text-xs font-semibold text-white">Driver matched — Marcus is on the way</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    currentTrip.status === 'ACCEPTED' ? 'bg-[#38BDF8]/30' : 'bg-[#38BDF8] text-[#061018]'
                  }`}>
                    {currentTrip.status === 'ACCEPTED' ? (
                      <Radio size={10} className="animate-spin text-[#38BDF8]" />
                    ) : (
                      <Check size={12} />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-white">Driver arrives &mdash; pickup confirmed</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    currentTrip.status === 'IN_PROGRESS' ? 'bg-[#38BDF8]/30' : 'bg-white/10'
                  }`}>
                    {currentTrip.status === 'IN_PROGRESS' && (
                      <Car size={10} className="text-[#38BDF8] animate-bounce" />
                    )}
                  </span>
                  <span className="text-xs font-semibold text-white">Trip in progress &mdash; en route to destination</span>
                </div>
              </div>

              {/* Trip preferences — moved to in-ride, small and quiet */}
              <div className="mt-3 flex flex-wrap gap-2">
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

              {/* Progress bar — driver approaching pickup, then the trip
                  itself; same bar, same currentTrip.progress field drives
                  both (see the ticker effect above), just two different
                  legs of one continuous "car is moving" story. */}
              {(currentTrip.status === 'ACCEPTED' || currentTrip.status === 'IN_PROGRESS') && (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full w-full max-w-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#818CF8] transition-all"
                    style={{ width: `${Math.round((currentTrip.progress || 0) * 100)}%` }}
                  />
                </div>
              )}

              {/* Only escape hatch: End Session */}
              <button
                onClick={() => {
                  triggerHaptic('light')
                  cancelRequest()
                }}
                className="mt-3 w-full rounded-xl border border-white/15 bg-white/[0.05] py-2 text-xs font-semibold text-white/50 hover:text-white active:scale-95"
              >
                End Session
              </button>
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
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399]/20 text-[#34D399]">
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2
                  return (
                    <motion.span
                      key={i}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{ x: Math.cos(angle) * 40, y: Math.sin(angle) * 40, opacity: 0 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute h-1.5 w-1.5 rounded-full bg-[#34D399]"
                    />
                  )
                })}
                <Check size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Trip Completed</h2>

              {/* Driver row */}
              <div className="mt-3 flex items-center justify-center gap-3">
                <Avatar size={48} initials={lastCompleted?.driver?.initials || initialsOf(lastCompleted?.driverName)} />
                <div className="text-left">
                  <p className="text-[13px] font-extrabold text-white">{lastCompleted?.driverName || 'Your driver'}</p>
                  <p className="text-[11px] font-medium text-white/50">got you there safely</p>
                </div>
              </div>

              {/* Payment split — driver payout vs. total paid up front, full
                  itemized breakdown one tap away. Mirrors the "driver
                  earnings / your payment" split pattern, but every line is
                  the real FairFare math, not an opaque platform fee. */}
              <div className="mt-5 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] text-left">
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setShowReceipt((v) => !v)
                  }}
                  className="flex w-full items-center gap-3 px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Driver payout</p>
                    <p className="mt-0.5 truncate text-[18px] font-black text-[#34D399]">
                      {usd((lastCompleted?.fare || 0) * DRIVER_PCT)}
                    </p>
                  </div>
                  <div className="h-8 w-px shrink-0 bg-white/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total paid</p>
                    <p className="mt-0.5 truncate text-[18px] font-black text-white">
                      {usd((lastCompleted?.fare || 0) + tip)}
                    </p>
                  </div>
                  <span className="shrink-0 text-white/40">
                    {showReceipt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                <AnimatePresence>
                  {showReceipt && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/10 px-3.5 py-3 text-[11.5px] font-semibold">
                        <div className="flex justify-between">
                          <span className="text-white/55">{lastCompleted?.tier || 'Rush Standard'} fare</span>
                          <span className="text-white">{usd(lastCompleted?.fare || 0)}</span>
                        </div>
                        <div className="mt-1.5 flex justify-between">
                          <span className="text-white/55">Driver payout (88%)</span>
                          <span className="text-[#34D399]">−{usd((lastCompleted?.fare || 0) * DRIVER_PCT)}</span>
                        </div>
                        <div className="mt-1.5 flex justify-between">
                          <span className="text-white/55">Platform fee (12%)</span>
                          <span className="text-white/80">{usd((lastCompleted?.fare || 0) * (1 - DRIVER_PCT))}</span>
                        </div>
                        {tip > 0 && (
                          <div className="mt-1.5 flex justify-between">
                            <span className="text-white/55">Driver tip</span>
                            <span className="text-[#FFD166]">+{usd(tip)}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tip selector */}
              <div className="mt-4 w-full text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Add a tip for {lastCompleted?.driverName || 'your driver'}?
                </p>
                <div className="flex justify-between gap-2">
                  {[{ v: 0, l: 'No tip' }, { v: 2, l: '$2' }, { v: 5, l: '$5' }, { v: 10, l: '$10' }].map((t) => (
                    <button
                      key={t.v}
                      onClick={() => {
                        triggerHaptic('light')
                        setTip(t.v)
                        setShowCustomTip(false)
                        setCustomTipValue('')
                      }}
                      className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-all active:scale-95 ${
                        tip === t.v && !showCustomTip
                          ? 'border-[#FFD166]/60 bg-[#FFD166]/15 text-[#FFD166]'
                          : 'border-white/10 bg-white/[0.05] text-white/60'
                      }`}
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
                {!showCustomTip ? (
                  <button
                    onClick={() => {
                      triggerHaptic('light')
                      setShowCustomTip(true)
                    }}
                    className="mt-2 w-full text-center text-[11px] font-bold text-[#38BDF8] active:opacity-70"
                  >
                    Enter custom amount
                  </button>
                ) : (
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#38BDF8]/40 bg-white/[0.05] px-3 py-2">
                    <span className="text-sm font-bold text-white/50">$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="1"
                      autoFocus
                      value={customTipValue}
                      onChange={(e) => {
                        const raw = e.target.value
                        setCustomTipValue(raw)
                        const v = Math.max(0, parseFloat(raw) || 0)
                        setTip(v)
                      }}
                      placeholder="0"
                      className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder-white/30"
                    />
                  </div>
                )}
              </div>

              {/* Star rating */}
              <div className="mt-4 w-full text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Rate your trip</p>
                <p className="mt-0.5 text-[11px] font-medium text-white/45">
                  {weekdayOf(lastCompleted?.date) || 'Trip'} to {lastCompleted?.destination || 'your destination'}
                </p>
                <div className="mt-2 flex justify-center gap-1.5">
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

      <SafetySheet isOpen={showSafety} onClose={() => setShowSafety(false)} trip={currentTrip} />
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
  const [showSafety, setShowSafety] = useState(false)
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

  // Same leg logic as the passenger view — the driver's own map should
  // show them approaching pickup first, then driving to dropoff, not the
  // whole trip route the entire time. Both views read the same
  // driverStartCoords, so rider and driver see one consistent picture.
  const driverPickupCoords = currentTrip?.pickupCoords || SAVED_PLACES[0].latlng
  const driverDropoffCoords = currentTrip?.dropoffCoords || PRESET_DESTINATIONS[0].latlng
  const isApproachingPickup = currentTrip?.status === 'ACCEPTED'
  const mapRouteOrigin = isApproachingPickup
    ? currentTrip?.driverStartCoords || driverPickupCoords
    : driverPickupCoords
  const mapRouteDestination = isApproachingPickup ? driverPickupCoords : driverDropoffCoords

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar">
      <div className="absolute inset-0">
        <MapShell
          showRoute={Boolean(currentTrip)}
          radar={online && !currentTrip}
          pickupCoords={driverPickupCoords}
          dropoffCoords={driverDropoffCoords}
          routeOrigin={mapRouteOrigin}
          routeDestination={mapRouteDestination}
          dropoffLabel={currentTrip?.destination || PRESET_DESTINATIONS[0].name}
          carProgress={currentTrip?.progress || 0}
        />
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
            <div className="rounded-2xl border border-white/15 bg-zinc-900/90 p-3 shadow-lg shadow-black/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Today</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-white">{usd(user?.todayEarnings || 286.4)}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-zinc-900/90 p-3 shadow-lg shadow-black/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Trips</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-[#38BDF8]">{user?.todayRides || 14}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-zinc-900/90 p-3 shadow-lg shadow-black/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Keep Rate</span>
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
                <Navigation size={11} /> Pickup is {currentTrip.pickupDistance || '2.1 mi'} away — about{' '}
                {currentTrip.pickupEta || '2–5 min'} drive
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#38BDF8]">
                  {currentTrip.status === 'ACCEPTED' ? 'En Route to Pickup' : 'Driving to Dropoff'}
                </p>
                <p className="truncate text-[14px] font-extrabold text-white">
                  {currentTrip.status === 'ACCEPTED' ? currentTrip.pickup : currentTrip.destination}
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light')
                  setShowSafety(true)
                }}
                aria-label="Trip safety"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] text-white/55 transition-colors hover:border-[#FF6B6B]/40 hover:text-[#FF6B6B] active:scale-95"
              >
                <ShieldAlert size={14} />
              </button>
            </div>
            <p className="text-[11px] font-medium text-[#34D399]">
              Net Payout: {usd(currentTrip.driverFare || currentTrip.fare * 0.88)} (88%)
            </p>

            {/* Hand off turn-by-turn to the driver's own phone — Rush shows
                the address, Google Maps/Waze does the actual navigating. */}
            <div className="mt-3">
              <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-wider text-white/35">
                Navigate with your own app
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={googleMapsUrl(
                    currentTrip.status === 'ACCEPTED'
                      ? currentTrip.pickupCoords || SAVED_PLACES[0].latlng
                      : currentTrip.dropoffCoords || PRESET_DESTINATIONS[0].latlng
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic('light')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] py-2.5 text-[12px] font-bold text-white/80 transition-colors hover:text-white active:scale-95"
                >
                  <MapPin size={14} className="text-[#38BDF8]" /> Google Maps
                </a>
                <a
                  href={wazeUrl(
                    currentTrip.status === 'ACCEPTED'
                      ? currentTrip.pickupCoords || SAVED_PLACES[0].latlng
                      : currentTrip.dropoffCoords || PRESET_DESTINATIONS[0].latlng
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => triggerHaptic('light')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] py-2.5 text-[12px] font-bold text-white/80 transition-colors hover:text-white active:scale-95"
                >
                  <Navigation2 size={14} className="text-[#38BDF8]" /> Waze
                </a>
              </div>
            </div>

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

      <SafetySheet isOpen={showSafety} onClose={() => setShowSafety(false)} trip={currentTrip} />
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
  const heroKey = `rush_hero_seen_${user?.id || 'anonymous'}`
  const [showHero, setShowHero] = useState(() => {
    try {
      return !sessionStorage.getItem(heroKey)
    } catch {
      return true
    }
  })

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
      {showHero && (
        <HeroMoment
          onDone={() => {
            try {
              sessionStorage.setItem(heroKey, '1')
            } catch {
              /* noop */
            }
            setShowHero(false)
          }}
        />
      )}
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
