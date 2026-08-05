import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, CheckCircle2, Star, Car } from 'lucide-react'
import { useTrip } from '../context/TripContext'

export default function HistoryModal({ isOpen, onClose }) {
  const { tripHistory } = useTrip()

  const usd = (n) => `$${(n || 0).toFixed(2)}`

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
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-[0_0_50px_rgba(0,240,255,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-[#00F0FF]">
                <Clock size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-wide text-white">Trip History</h2>
                <p className="text-[11px] font-medium text-white/50">Completed & past rides</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* History List */}
          <div className="mt-5 flex max-h-[400px] flex-col gap-3 overflow-y-auto pr-1">
            {tripHistory.length === 0 ? (
              <div className="py-8 text-center text-white/40">
                <Clock size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-[13px] font-medium">No past rides recorded yet.</p>
              </div>
            ) : (
              tripHistory.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#00F0FF]/15 px-2.5 py-0.5 text-[9.5px] font-extrabold text-[#00F0FF]">
                        {trip.tier || 'Rush Express'}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 size={11} /> {trip.status}
                      </span>
                    </div>
                    <span className="text-[15px] font-black text-white">{usd(trip.fare)}</span>
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-[12px]">
                    <div className="flex items-center gap-2 text-white/90 font-semibold min-w-0">
                      <MapPin size={13} className="text-[#00F0FF] shrink-0" /> <span className="truncate">{trip.pickup} → {trip.destination}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] text-white/50 pt-1 border-t border-white/5 mt-1">
                      <span className="flex items-center gap-1 min-w-0">
                        <Car size={11} className="shrink-0" /> <span className="truncate">{trip.driverName} ({trip.car})</span>
                      </span>
                      <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                        <Star size={11} fill="currentColor" /> {trip.rating || 5}.0
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
