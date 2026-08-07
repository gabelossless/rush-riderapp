import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Car, User, Wallet, Star, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrip } from '../context/TripContext'
import { triggerHaptic } from '../utils/haptics'

/* ------------------------------------------------------------------ */
/*  AccountModal — the profile card. Authentication now lives on the  */
/*  landing page (SignUpFlow); this modal is for the signed-in user:   */
/*  profile, wallet balance, role switch, and logout.                  */
/* ------------------------------------------------------------------ */

export default function AccountModal({ isOpen, onClose }) {
  const { user, logout, switchRole } = useAuth()
  const { resetTripState } = useTrip()

  if (!user) return null

  const isDriver = user.role === 'driver'

  const handleLogout = () => {
    triggerHaptic('medium')
    resetTripState()
    logout()
    onClose()
  }

  const handleSwitchRole = () => {
    triggerHaptic('light')
    switchRole(isDriver ? 'passenger' : 'driver')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              triggerHaptic('light')
              onClose()
            }}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-wide text-white">Account</h2>
              <button
                onClick={() => {
                  triggerHaptic('light')
                  onClose()
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Profile header */}
            <div className="mt-5 flex items-center gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-[18px] font-black text-[#04140F]"
                style={{ background: isDriver ? '#34D399' : '#38BDF8' }}
              >
                {user.avatar || 'US'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-extrabold text-white">{user.name}</p>
                <p className="truncate text-[11px] font-medium text-white/45">{user.email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
                    {isDriver ? 'Driver Partner' : 'Rider'}
                  </span>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
                    Joined {user.joinedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
                <Wallet size={14} className="mx-auto text-[#38BDF8]" />
                <p className="mt-1 text-[13px] font-extrabold text-white">
                  ${(user.walletBalance || 0).toFixed(2)}
                </p>
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/40">Balance</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
                <Star size={14} className="mx-auto text-[#FFD166]" />
                <p className="mt-1 text-[13px] font-extrabold text-white">{user.rating || '5.0'}</p>
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/40">Rating</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-2.5">
                <Clock size={14} className="mx-auto text-[#34D399]" />
                <p className="mt-1 text-[13px] font-extrabold text-white">{user.totalRides || 0}</p>
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-white/40">Rides</p>
              </div>
            </div>

            {/* Driver vehicle card */}
            {isDriver && (
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#34D399]/25 bg-[#34D399]/[0.06] px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Car size={15} className="text-[#34D399]" />
                  <span className="text-[12px] font-bold text-white">{user.car}</span>
                </div>
                <span className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[9px] font-bold tracking-widest text-white/60">
                  {user.plate}
                </span>
              </div>
            )}

            {/* Role switch */}
            <button
              onClick={handleSwitchRole}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-[13px] font-extrabold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
            >
              {isDriver ? <User size={15} className="text-[#38BDF8]" /> : <Car size={15} className="text-[#34D399]" />}
              Switch to {isDriver ? 'Rider' : 'Driver'} view
            </button>

            {/* Logout */}
            <div className="mt-3 border-t border-white/10 pt-3.5">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-[12.5px] font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98]"
              >
                <LogOut size={14} /> Log Out
              </button>
              <p className="mt-2 text-center text-[9.5px] font-medium text-white/30">
                Logging out returns you to the Rush welcome screen
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
