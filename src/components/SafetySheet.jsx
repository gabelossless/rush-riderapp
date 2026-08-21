import { motion, AnimatePresence } from 'framer-motion'
import { X, ShieldAlert, PhoneCall, Share2 } from 'lucide-react'
import { triggerHaptic } from '../utils/haptics'

/* ------------------------------------------------------------------ */
/*  SafetySheet — a real, minimal safety affordance during an active   */
/*  trip. Rideshare's single most-cited complaint (safety access)      */
/*  doesn't get fixed by adding a menu of icons; it gets fixed by two  */
/*  things that actually work, one tap away, on both rider and driver  */
/*  screens: a real emergency call, and a real way to hand your trip   */
/*  details to someone who isn't in the car.                           */
/* ------------------------------------------------------------------ */

export default function SafetySheet({ isOpen, onClose, trip }) {
  const handleShare = async () => {
    triggerHaptic('light')
    const text = `I'm on a Rush trip: ${trip?.pickup || 'pickup'} → ${trip?.destination || 'destination'}. Driver: ${
      trip?.driver?.name || 'assigned'
    }, plate ${trip?.driver?.plate || '—'}.`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Rush trip', text })
      } catch {
        /* user dismissed the native share sheet — not an error */
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        /* clipboard permission denied — nothing else to do here */
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass-strong relative w-full max-w-lg rounded-3xl border border-[#FF6B6B]/25 p-5 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B]">
                  <ShieldAlert size={20} />
                </span>
                <div>
                  <h2 className="text-base font-extrabold">Trip Safety</h2>
                  <p className="text-[11px] font-medium text-white/50">No menus to dig through</p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic('light')
                  onClose()
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5 pb-[max(env(safe-area-inset-bottom),4px)]">
              <a
                href="tel:911"
                onClick={() => triggerHaptic('medium')}
                className="flex items-center gap-3 rounded-2xl border border-[#FF6B6B]/40 bg-[#FF6B6B]/10 px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
              >
                <PhoneCall size={18} className="shrink-0 text-[#FF6B6B]" />
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-white">Call 911</p>
                  <p className="text-[10.5px] text-white/50">For a real emergency, right now</p>
                </div>
              </a>
              <button
                onClick={handleShare}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.08] active:scale-[0.99]"
              >
                <Share2 size={18} className="shrink-0 text-[#38BDF8]" />
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-white">Share trip status</p>
                  <p className="text-[10.5px] text-white/50">Driver, plate, and route — sent to someone you trust</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
