import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, ChevronDown, Star, Car, Calendar } from 'lucide-react'
import { useTrip } from '../context/TripContext'
import { useAuth } from '../context/AuthContext'
import { triggerHaptic } from '../utils/haptics'

const DRIVER_PCT = 0.88
const usd = (n) => `$${(n || 0).toFixed(2)}`

/* ------------------------------------------------------------------ */
/*  Date helpers — every trip already carries a real `date`, it just   */
/*  wasn't rendered anywhere. Group by day (Today / Yesterday / Aug 4) */
/*  so each row only needs to show a time, not repeat the full date.   */
/* ------------------------------------------------------------------ */

function dayLabel(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'Earlier'
  const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime()
  const diffDays = Math.round((startOf(new Date()) - startOf(d)) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeLabel(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/* ------------------------------------------------------------------ */
/*  One trip row — tap to reveal the same FairFare receipt breakdown   */
/*  used on the completed-ride screen, so the payout promise shows up  */
/*  consistently everywhere a fare appears, not just once.             */
/* ------------------------------------------------------------------ */

function TripRow({ trip, isDriver }) {
  const [open, setOpen] = useState(false)
  const driverCut = (trip.fare || 0) * DRIVER_PCT
  const platformCut = (trip.fare || 0) - driverCut

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] transition-colors">
      <button
        onClick={() => {
          triggerHaptic('light')
          setOpen((v) => !v)
        }}
        className="flex w-full flex-col gap-2.5 p-3.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 rounded-full bg-[#38BDF8]/15 px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#38BDF8]">
              {trip.tier || 'Rush Express'}
            </span>
            <span className="shrink-0 text-[10.5px] font-semibold text-white/40">{timeLabel(trip.date)}</span>
          </div>
          <span className="shrink-0 text-[15px] font-black text-white">{usd(trip.fare)}</span>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-[12.5px] font-semibold text-white/85">
          <MapPin size={13} className="shrink-0 text-[#38BDF8]" />
          <span className="min-w-0 flex-1 truncate">
            {trip.pickup} <span className="text-white/30">→</span> {trip.destination}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10.5px]">
          <span className="flex min-w-0 items-center gap-1.5 text-white/50">
            <Car size={11} className="shrink-0" />
            <span className="truncate">
              {trip.driverName}
              {trip.car ? ` · ${trip.car}` : ''}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-0.5 font-bold text-amber-400">
              <Star size={11} fill="currentColor" /> {(trip.rating || 5).toFixed(1)}
            </span>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/30">
              <ChevronDown size={13} />
            </motion.span>
          </span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mx-3.5 mb-3.5 rounded-xl border border-white/8 bg-black/20 p-3 text-[11px] font-semibold">
              <div className="flex justify-between">
                <span className="text-white/55">{isDriver ? 'Your payout (88%)' : 'Driver payout (88%)'}</span>
                <span className="text-[#34D399]">{usd(driverCut)}</span>
              </div>
              <div className="mt-1.5 flex justify-between">
                <span className="text-white/55">Platform fee (12%)</span>
                <span className="text-white/80">{usd(platformCut)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-1.5 text-[12px]">
                <span className="text-white/70">Total fare</span>
                <span className="font-black text-white">{usd(trip.fare)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HistoryModal({ isOpen, onClose }) {
  const { tripHistory } = useTrip()
  const { user } = useAuth()
  const isDriver = user?.role === 'driver'

  const { groups, totalFare } = useMemo(() => {
    const map = new Map()
    let sum = 0
    for (const t of tripHistory) {
      sum += t.fare || 0
      const label = dayLabel(t.date)
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(t)
    }
    return { groups: Array.from(map.entries()), totalFare: sum }
  }, [tripHistory])

  const summaryAmount = isDriver ? totalFare * DRIVER_PCT : totalFare

  return (
    <AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-2xl shadow-black/50"
          style={{ maxHeight: '85dvh' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#38BDF8]">
                <Clock size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-wide text-white">Trip History</h2>
                <p className="text-[11px] font-medium text-white/50">
                  {tripHistory.length === 0
                    ? 'No past rides yet'
                    : `${tripHistory.length} ride${tripHistory.length === 1 ? '' : 's'} · ${usd(summaryAmount)} ${isDriver ? 'earned' : 'spent'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* History List */}
          <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto no-scrollbar">
            {tripHistory.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Clock size={32} className="text-white/25" />
                <p className="text-[13px] font-medium text-white/50">No past rides recorded yet.</p>
                <button
                  onClick={onClose}
                  className="mt-1 rounded-xl border border-[#38BDF8]/40 bg-[#38BDF8]/10 px-4 py-2 text-[12px] font-bold text-[#38BDF8] active:scale-95"
                >
                  Book your first ride
                </button>
              </div>
            ) : (
              groups.map(([label, trips]) => (
                <div key={label}>
                  <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                    <Calendar size={10} /> {label}
                  </p>
                  <div className="flex flex-col gap-2">
                    {trips.map((trip) => (
                      <TripRow key={trip.id} trip={trip} isDriver={isDriver} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
