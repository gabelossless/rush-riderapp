import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Battery,
  Car,
  Check,
  ChevronLeft,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Home,
  MessageSquare,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react'

import { AuthProvider, useAuth } from './context/AuthContext'
import { TripProvider, useTrip } from './context/TripContext'
import AuthModal from './components/AuthModal'
import LocationSearch from './components/LocationSearch'
import MapEngine from './components/MapEngine'
import WalletModal from './components/WalletModal'
import HistoryModal from './components/HistoryModal'
import FeedbackModal from './components/FeedbackModal'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { PREFERENCES, RIDE_TIERS } from './data/mockData'
import { triggerHaptic } from './utils/haptics'

const usd = (n) => `$${(n || 0).toFixed(2)}`
const DRIVER_PCT = 0.88

/* ------------------------------------------------------------------ */
/*  Small UI atoms                                                     */
/* ------------------------------------------------------------------ */

function StatusBar() {
  return (
    <div className="pwa-statusbar flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),12px)] pb-1 text-[11px] font-semibold text-white/70">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Wifi size={13} strokeWidth={2.4} />
        <Signal size={13} strokeWidth={2.4} />
        <Battery size={15} strokeWidth={2} />
      </div>
    </div>
  )
}

function Avatar({ size = 44, initials = 'US', className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl font-black text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#00F0FF 0%,#4770FF 55%,#7000FF 100%)',
        boxShadow: '0 0 16px rgba(0,240,255,0.35)',
      }}
    >
      <span className="text-[13px] font-bold">{initials}</span>
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#12151E] bg-emerald-400" />
    </div>
  )
}

function SegmentToggle({ value, onChange }) {
  const options = [
    { id: 'passenger', label: 'Passenger', icon: Car },
    { id: 'driver', label: 'Driver', icon: Zap },
  ]
  return (
    <div className="relative flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
      <motion.div
        layoutId="viewPill"
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl"
        style={{
          left: value === 'passenger' ? 4 : 'calc(50% + 0px)',
          background: 'linear-gradient(135deg,rgba(0,240,255,0.16),rgba(112,0,255,0.16))',
          border: '1px solid rgba(0,240,255,0.35)',
          boxShadow: '0 0 16px rgba(0,240,255,0.25)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      />
      {options.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => {
              triggerHaptic('light')
              onChange(opt.id)
            }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-colors active:scale-95 ${
              active ? 'text-white' : 'text-white/45 hover:text-white/75'
            }`}
          >
            <Icon size={14} className={active ? 'text-[#00F0FF]' : ''} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function FairFareTicker({ totalFare = 24.9 }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">FairFare Model</span>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-white/60">
          {usd(totalFare)} total
        </span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-l-full"
          style={{ background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)' }}
          initial={{ width: 0 }}
          animate={{ width: '88%' }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: 'linear-gradient(90deg,#8B3BFF,#7000FF)' }}
          initial={{ width: 0 }}
          animate={{ width: '12%' }}
          transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10.5px] font-semibold">
        <span className="flex items-center gap-1 text-[#3DFFC2]">
          <span className="h-2 w-2 rounded-full bg-[#3DFFC2]" /> 88% Driver Payout ({usd(totalFare * DRIVER_PCT)})
        </span>
        <span className="flex items-center gap-1 text-[#C084FC]">
          <span className="h-2 w-2 rounded-full bg-[#C084FC]" /> 12% Platform Fee ({usd(totalFare * (1 - DRIVER_PCT))})
        </span>
      </div>
    </div>
  )
}

function Header({ view, setView, onOpenAuth, onOpenWallet, onOpenHistory, onOpenFeedback }) {
  const { user } = useAuth()

  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-white/8 px-4 pb-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Rush Logo"
            className="h-8 w-8 rounded-xl object-cover shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-white/20"
          />
          <div>
            <p className="text-[13px] font-extrabold leading-none tracking-wide text-white">RUSH</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#3DFFC2]">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#3DFFC2] align-middle" />
              Tester Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wallet Balance Badge */}
          <button
            onClick={onOpenWallet}
            className="flex items-center gap-1.5 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-2.5 py-1 text-[11px] font-extrabold text-[#00F0FF] transition-all hover:bg-[#00F0FF]/20"
          >
            <Wallet size={13} />
            {usd(user?.walletBalance)}
          </button>

          {/* User Account Avatar / Auth Button */}
          {user ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 pr-2 transition-colors hover:border-white/20"
            >
              <Avatar size={24} initials={user.avatar || 'US'} />
              <span className="hidden text-[11px] font-bold text-white/80 sm:block">{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-full border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-3 py-1 text-[11px] font-bold text-[#00F0FF]"
            >
              Log In
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex-1">
          <SegmentToggle value={view} onChange={setView} />
        </div>
        <button
          onClick={onOpenHistory}
          title="Trip History"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition-colors hover:text-white"
        >
          <Clock size={16} />
        </button>
        <button
          onClick={onOpenFeedback}
          title="Tester Feedback"
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition-colors hover:text-white"
        >
          <MessageSquare size={16} />
        </button>
      </div>
    </header>
  )
}

function BottomNav({ onOpenWallet, onOpenHistory, onOpenFeedback }) {
  return (
    <div className="relative z-30 glass-strong border-t border-white/8 px-6 pb-[max(env(safe-area-inset-bottom),16px)] pt-2.5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => triggerHaptic('click')}
          className="flex flex-col items-center gap-1 text-[#00F0FF] active:scale-95 transition-transform"
        >
          <Home size={19} strokeWidth={2.2} className="drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
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
/*  Passenger View Component                                           */
/* ------------------------------------------------------------------ */

function PassengerViewContent({ onOpenWallet }) {
  const { user, deductRiderFare } = useAuth()
  const { currentTrip, tripHistory, requestRide, cancelRequest, acceptRide, startRide, completeRide, updateProgress } = useTrip()

  const prevTripId = useRef(null)

  const [pickup, setPickup] = useState('Neon District Ave')
  const [destination, setDestination] = useState(null)
  const [selectedTier, setSelectedTier] = useState('express')
  const [prefs, setPrefs] = useState({ quiet: false, ac: true, express: false })
  const [stage, setStage] = useState('home')
  const [pickupCoords, setPickupCoords] = useState({ x: 80, y: 360 })
  const [dropoffCoords, setDropoffCoords] = useState({ x: 322, y: 92 })
  const [demoNotification, setDemoNotification] = useState(null)

  const currentTierObj = RIDE_TIERS.find((t) => t.id === selectedTier) || RIDE_TIERS[1]
  const basePrice = destination ? destination.distance ? parseFloat(destination.distance) * 2.2 + 10 : 22.5 : 22.5
  const totalFare = Math.round((basePrice * currentTierObj.multiplier) * 100) / 100

  useEffect(() => {
    if (currentTrip) {
      prevTripId.current = currentTrip.id
    }
  }, [currentTrip])

  useEffect(() => {
    if (!currentTrip) {
      if (prevTripId.current) {
        const completedTrip = tripHistory.find(t => t.id === prevTripId.current)
        if (completedTrip) {
          setStage('completed')
          deductRiderFare(completedTrip.fare)
        }
        prevTripId.current = null
      } else if (stage !== 'options' && stage !== 'home' && stage !== 'completed') {
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

  const handleSelectDestination = (dest) => {
    triggerHaptic('light')
    setDestination(dest)
    if (dest.coords) {
      setDropoffCoords(dest.coords)
    }
    setStage('options')
  }

  const handleConfirmRide = () => {
    triggerHaptic('medium')
    if (user && user.walletBalance < totalFare) {
      setDemoNotification('Insufficient wallet balance. Please add demo funds.')
      setTimeout(() => setDemoNotification(null), 3000)
      onOpenWallet()
      return
    }
    requestRide({
      pickup,
      destination: destination ? destination.name : 'Downtown Tech Hub',
      tier: currentTierObj.name,
      fare: totalFare,
      eta: currentTierObj.eta,
      distance: destination ? destination.distance : '2.4 mi',
      riderName: user ? user.name : 'Alex Rivera',
    })
    setStage('searching')
  }

  const handleAutoMatchDriver = () => {
    triggerHaptic('success')
    acceptRide({
      name: 'Marcus Vance',
      car: 'Tesla Model Y — Cyber Black',
      plate: 'RUSH-88',
      rating: 4.98,
      initials: 'MV',
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
    setTimeout(() => setDemoNotification(null), 3500)
  }

  const togglePref = (key) => {
    triggerHaptic('light')
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  const handleMapClick = (coords) => {
    if (stage === 'home' || stage === 'options') {
      triggerHaptic('click')
      setPickupCoords(coords)
      setPickup(`Grid (${coords.x}, ${coords.y})`)
    }
  }

  return (
    <div className="relative h-full">
      {/* Dynamic Demo Banner Notification */}
      {demoNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-3 inset-x-3 z-30 flex items-center justify-between rounded-2xl border border-[#3DFFC2]/40 bg-[#0A0D15]/90 p-3 text-[12px] font-bold text-[#3DFFC2] shadow-xl backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>{demoNotification}</span>
          </div>
        </motion.div>
      )}

      {/* Interactive Map */}
      <div className="absolute inset-0">
        <MapEngine
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
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <div className="glass mx-3 mb-3 rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <LocationSearch
                pickup={pickup}
                destination={destination}
                onSelectPickup={setPickup}
                onSelectDestination={handleSelectDestination}
              />

              <p className="mb-2 mt-3.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Preferences
              </p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => {
                  const Icon = p.icon
                  const on = prefs[p.key]
                  return (
                    <button
                      key={p.key}
                      onClick={() => togglePref(p.key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                        on
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/15 text-white shadow-[0_0_14px_rgba(0,240,255,0.35)]'
                          : 'border-white/10 bg-white/[0.04] text-white/50'
                      }`}
                    >
                      <Icon size={13} className={on ? 'text-[#00F0FF]' : ''} /> {p.label}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => {
                  triggerHaptic('light')
                  if (destination) setStage('options')
                }}
                disabled={!destination}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13.5px] font-extrabold text-[#061018] transition-transform active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)',
                  boxShadow: '0 0 24px rgba(0,240,255,0.45)',
                }}
              >
                <span className="truncate">{destination ? `Choose Tier for ${destination.name}` : 'Select a Destination above'}</span> <ArrowRight size={16} className="shrink-0" />
              </button>
            </div>
          </motion.div>
        )}

        {stage === 'options' && (
          <motion.div
            key="options"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <div className="glass mx-3 mb-3 max-h-[500px] overflow-y-auto rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50 no-scrollbar">
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={() => {
                    triggerHaptic('light')
                    setStage('home')
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white">{destination?.name}</p>
                  <p className="truncate text-[10.5px] font-medium text-white/45">{destination?.address}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {RIDE_TIERS.map((tier) => {
                  const Icon = tier.icon
                  const active = selectedTier === tier.id
                  const fareAmt = Math.round((basePrice * tier.multiplier) * 100) / 100
                  return (
                    <button
                      key={tier.id}
                      onClick={() => {
                        triggerHaptic('light')
                        setSelectedTier(tier.id)
                      }}
                      className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        active
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          active ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-white/[0.06] text-white/60'
                        }`}
                      >
                        <Icon size={20} />
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">{tier.name}</span>
                          {tier.featured && (
                            <span className="rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-white">
                              Fastest
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10.5px] font-medium text-white/45">
                          {tier.eta} pickup • {tier.desc}
                        </p>
                      </div>
                      <span className="text-[15px] font-extrabold text-white">{usd(fareAmt)}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-3">
                <FairFareTicker totalFare={totalFare} />
              </div>

              {/* Payment Method Badge */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px]">
                <span className="text-white/50">Payment Method</span>
                <button
                  onClick={onOpenWallet}
                  className="flex items-center gap-1.5 font-bold text-[#00F0FF] hover:underline"
                >
                  <Wallet size={13} /> Rush Wallet ({usd(user?.walletBalance || 100)})
                </button>
              </div>

              <button
                onClick={handleConfirmRide}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-extrabold text-white transition-transform active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#4770FF,#7000FF)',
                  boxShadow: '0 0 30px rgba(112,0,255,0.5)',
                }}
              >
                Confirm {currentTierObj.name} ({usd(totalFare)}) <Sparkles size={16} />
              </button>
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
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#00F0FF]/25">
                <span className="absolute inset-0 rounded-full border border-[#00F0FF]/40 animate-pulse-ring" />
                <Radio size={28} className="animate-spin text-[#00F0FF]" style={{ animationDuration: '2s' }} />
              </div>
              <p className="text-[14px] font-extrabold text-white">Matching with Nearby Driver…</p>
              <p className="mt-1 text-center text-[11px] font-medium leading-relaxed text-white/50">
                Searching nearby drivers for {destination?.name || 'your ride'}
              </p>

              {/* Instant Auto-Match Button for Seamless 1-Person Demo */}
              <button
                onClick={handleAutoMatchDriver}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3DFFC2]/50 bg-[#3DFFC2]/15 py-2.5 text-[12px] font-extrabold text-[#3DFFC2] shadow-[0_0_16px_rgba(61,255,194,0.3)] transition-all active:scale-[0.98]"
              >
                <Zap size={14} /> Auto-Match Demo Driver
              </button>

              <p className="mt-2 text-[9.5px] font-semibold text-white/40">
                Or toggle to Driver mode in top header to accept request manually
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
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <div className="glass mx-3 mb-3 rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-[#00F0FF]/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#00F0FF]">
                  {currentTrip.status === 'ACCEPTED' ? 'Driver En Route' : 'Trip In Progress'}
                </span>
                <span className="text-[12px] font-black text-[#3DFFC2]">{usd(currentTrip.fare)}</span>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <Avatar size={44} initials={currentTrip.driver?.initials || 'MV'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-extrabold text-white">{currentTrip.driver?.name || 'Marcus Vance'}</p>
                  <p className="truncate text-[10.5px] font-medium text-white/50">{currentTrip.driver?.car || 'Tesla Model Y — Cyber Black'}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-1 text-[9px] font-bold tracking-widest text-white/70">
                    {currentTrip.driver?.plate || 'RUSH-88'}
                  </span>
                </div>
              </div>

              {/* Ride Lifecycle Demo Actions */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {currentTrip.status === 'ACCEPTED' ? (
                  <button
                    onClick={handleSimulateStartTrip}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/15 py-2 text-[11px] font-bold text-[#00F0FF] active:scale-95"
                  >
                    Start Ride Demo
                  </button>
                ) : (
                  <button
                    onClick={handleSimulateCompleteTrip}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#3DFFC2]/40 bg-[#3DFFC2]/15 py-2 text-[11px] font-bold text-[#3DFFC2] active:scale-95"
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
            <div className="glass-strong w-full max-w-[320px] flex flex-col items-center rounded-3xl border border-[#3DFFC2]/30 p-6 shadow-2xl text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#3DFFC2]/20 text-[#3DFFC2] mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-black text-white">Trip Completed</h2>
              <p className="mt-1 text-sm font-medium text-white/60">Your fare has been processed.</p>
              
              <div className="mt-6 w-full">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/40">Add a tip?</p>
                <div className="flex justify-between gap-2">
                  {[2, 5, 10].map(tip => (
                    <button key={tip} className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-sm font-bold text-white transition-colors hover:bg-white/10 active:bg-white/20">
                      ${tip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStage('home')}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#3DFFC2] to-[#00F0FF] py-3 text-sm font-black text-[#0A0D15] active:scale-95 transition-transform"
              >
                Submit Rating
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Driver View Component                                              */
/* ------------------------------------------------------------------ */

function DriverViewContent() {
  const { user, creditDriverEarnings } = useAuth()
  const { currentTrip, acceptRide, startRide, completeRide, cancelRequest } = useTrip()

  const [online, setOnline] = useState(true)
  const [toast, setToast] = useState(null)
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (currentTrip?.status === 'SEARCHING') {
      setCountdown(10)
    }
  }, [currentTrip?.id, currentTrip?.status])

  useEffect(() => {
    let timer
    if (currentTrip?.status === 'SEARCHING' && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000)
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
    })
  }

  const handleComplete = () => {
    if (!currentTrip) return
    const fare = currentTrip.driverFare || currentTrip.fare * DRIVER_PCT
    creditDriverEarnings(fare)
    completeRide()
    setToast(`Trip Completed! +${usd(fare)} added to wallet`)
    setTimeout(() => setToast(null), 3500)
  }

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar">
      <div className="absolute inset-0">
        <MapEngine showRoute={Boolean(currentTrip)} radar={online && !currentTrip} />
      </div>

      <div className="relative z-10 min-h-full p-3">
        {/* Status card */}
        <div className="glass rounded-3xl border border-white/10 p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Driver Operator</p>
              <p className={`mt-0.5 text-[14px] font-extrabold ${online ? 'text-[#3DFFC2]' : 'text-white/60'}`}>
                {online ? 'Online & Listening' : 'Offline'}
              </p>
            </div>
            <button
              onClick={() => setOnline(!online)}
              className={`relative h-7 w-12 rounded-full border transition-all ${
                online ? 'border-[#3DFFC2]/50 bg-[#3DFFC2]/20' : 'border-white/15 bg-white/[0.06]'
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                  online ? 'left-6 bg-[#3DFFC2]' : 'left-0.5'
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
              <p className="mt-0.5 text-[15px] font-extrabold text-[#00F0FF]">{user?.todayRides || 14}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/55">Keep Rate</span>
              <p className="mt-0.5 text-[15px] font-extrabold text-[#3DFFC2]">88%</p>
            </div>
          </div>
        </div>

        {/* Incoming Trip Alert */}
        {online && currentTrip && currentTrip.status === 'SEARCHING' && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-strong mt-3 rounded-3xl border border-[#00F0FF]/40 p-4 shadow-[0_0_30px_rgba(0,240,255,0.2)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-[#00F0FF]/20 px-2.5 py-0.5 text-[9.5px] font-black uppercase text-[#00F0FF]">
                New Trip Request! ({countdown}s)
              </span>
              <span className="text-[12px] font-extrabold text-[#3DFFC2]">
                Earn {usd(currentTrip.driverFare || currentTrip.fare * 0.88)}
              </span>
            </div>

            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-[12px]">
              <p className="font-bold text-white">Rider: {currentTrip.riderName}</p>
              <p className="truncate text-[11px] text-white/60">Pickup: {currentTrip.pickup}</p>
              <p className="truncate text-[11px] text-white/60">Dropoff: {currentTrip.destination}</p>
            </div>

            <button
              onClick={handleAccept}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-black text-[#04140F]"
              style={{
                background: 'linear-gradient(90deg,#3DFFC2,#00F0FF)',
                boxShadow: '0 0 20px rgba(61,255,194,0.5)',
              }}
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
              {currentTrip.status === 'ACCEPTED' ? 'En Route to Pickup' : 'Driving to Dropoff'}
            </p>
            <p className="truncate text-[14px] font-extrabold text-white">{currentTrip.destination}</p>
            <p className="text-[11px] font-medium text-[#3DFFC2]">
              Net Payout: {usd(currentTrip.driverFare || currentTrip.fare * 0.88)}
            </p>

            {currentTrip.status === 'ACCEPTED' ? (
              <button
                onClick={startRide}
                className="mt-3 w-full rounded-xl border border-[#00F0FF]/50 bg-[#00F0FF]/15 py-3 text-[13px] font-bold text-[#00F0FF] hover:bg-[#00F0FF]/25"
              >
                Start Ride
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="mt-3 w-full rounded-xl border border-[#3DFFC2]/50 bg-[#3DFFC2]/15 py-3 text-[13px] font-bold text-[#3DFFC2] hover:bg-[#3DFFC2]/25"
              >
                Complete Ride & Claim Payout
              </button>
            )}
          </motion.div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div className="glass-strong mt-3 flex items-center gap-2 rounded-2xl border border-[#3DFFC2]/40 p-3 text-[12px] font-bold text-[#3DFFC2]">
            <CircleCheck size={16} /> {toast}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Desktop Investor Overview Panel                                    */
/* ------------------------------------------------------------------ */

function InvestorPanel({ onOpenAuth }) {
  const { user } = useAuth()

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden w-[380px] lg:block">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-[#3DFFC2]/40 bg-[#3DFFC2]/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#3DFFC2]">
          Series A · Interactive Tester Hub
        </span>
      </div>
      <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
        Rideshare,
        <br />
        <span className="text-gradient">reimagined.</span>
      </h1>
      <p className="mt-4 max-w-[340px] text-[13.5px] font-medium leading-relaxed text-white/60">
        Test authentication, location search, live driver matching, custom SVG/Real OpenStreetMap views, and 88% driver payouts.
      </p>

      <div className="mt-5 flex flex-col gap-2.5">
        <div className="glass flex items-center gap-3.5 rounded-2xl border border-white/10 p-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3DFFC2]/15 text-[#3DFFC2]">
            <CircleDollarSign size={20} />
          </span>
          <div>
            <p className="text-[17px] font-extrabold text-white">88% Driver Payout</p>
            <p className="text-[11px] font-medium text-white/50">FairFare transparent pricing model</p>
          </div>
        </div>

        <div className="glass flex items-center gap-3.5 rounded-2xl border border-white/10 p-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00F0FF]/15 text-[#00F0FF]">
            <Zap size={20} />
          </span>
          <div>
            <p className="text-[17px] font-extrabold text-white">Cross-Role Sync</p>
            <p className="text-[11px] font-medium text-white/50">Rider requests appear on Driver screen live</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-[11.5px] text-white/60">
        <ShieldCheck size={18} className="text-[#00F0FF]" />
        <div>
          <span>Logged in as: </span>
          <strong className="text-white">{user?.name}</strong> ({user?.role})
        </div>
        <button
          onClick={onOpenAuth}
          className="ml-auto rounded-lg border border-[#00F0FF]/40 bg-[#00F0FF]/10 px-2.5 py-1 text-[10.5px] font-bold text-[#00F0FF]"
        >
          Switch Profile
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Phone Frame Container                                              */
/* ------------------------------------------------------------------ */

function PhoneFrame({
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

  useEffect(() => {
    if (user?.role) {
      setView(user.role)
    }
  }, [user?.role, setView])
  return (
    <div className="relative h-[100dvh] w-full max-h-none sm:h-[820px] sm:max-h-[calc(100vh-64px)] sm:w-[410px]">
      <div
        className="pointer-events-none absolute -inset-6 hidden rounded-[3.5rem] opacity-40 blur-3xl sm:block"
        style={{ background: 'linear-gradient(160deg,rgba(0,240,255,0.35),rgba(112,0,255,0.35))' }}
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-void shadow-2xl sm:rounded-[2.6rem] sm:border sm:border-white/15">
        <StatusBar />
        <Header
          view={view}
          setView={setView}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />

        <main className="relative flex-1 overflow-hidden">
          {view === 'passenger' ? (
            <PassengerViewContent onOpenWallet={() => setIsWalletOpen(true)} />
          ) : (
            <DriverViewContent />
          )}
        </main>

        <BottomNav
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenFeedback={() => setIsFeedbackOpen(true)}
        />

        {/* Modals */}
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
        <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main App Root Component                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState('passenger')
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  return (
    <AuthProvider>
      <TripProvider>
        <div className="relative min-h-screen overflow-hidden bg-void font-sans">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 grid-bg opacity-70" />
            <div
              className="absolute -left-40 top-0 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle,#00F0FF,transparent 65%)' }}
            />
            <div
              className="absolute -right-40 bottom-0 h-[620px] w-[620px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle,#7000FF,transparent 65%)' }}
            />
          </div>

          <div className="relative z-10 flex min-h-screen items-center justify-center gap-14 p-0 sm:px-6 sm:py-8">
            <InvestorPanel onOpenAuth={() => setIsAuthOpen(true)} />
            <PhoneFrame
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
          </div>
          <PWAInstallPrompt />
        </div>
      </TripProvider>
    </AuthProvider>
  )
}

