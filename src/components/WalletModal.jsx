import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useTimeout from '../utils/useTimeout'
import { triggerHaptic } from '../utils/haptics'

export default function WalletModal({ isOpen, onClose }) {
  const { user, addFunds } = useAuth()
  const [successToast, setSuccessToast] = useState(false)
  const timers = useTimeout()

  const handleAddFunds = (amt) => {
    triggerHaptic('success')
    addFunds(amt)
    setSuccessToast(true)
    timers.set(() => setSuccessToast(false), 2500)
  }

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
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#38BDF8]/30 bg-[#38BDF8]/10 text-[#38BDF8]">
                <Wallet size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-wide text-white">Rush Wallet</h2>
                <p className="text-[11px] font-medium text-white/50">
                  {user.role === 'passenger' ? 'Rider Balance & Payments' : 'Driver Earnings & Payouts'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Current Balance Card */}
          <div className="mt-5 rounded-2xl border border-[#38BDF8]/30 bg-[#38BDF8]/[0.08] p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Available Balance</span>
            <p className="mt-1 text-4xl font-black tracking-tight text-white">{usd(user.walletBalance)}</p>

            {user.role === 'driver' && (
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px]">
                <span className="text-white/60">Today's Payout Share</span>
                <span className="font-bold text-[#34D399]">88% Net ({usd(user.todayEarnings)})</span>
              </div>
            )}
          </div>

          {/* Toast Notice */}
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 rounded-xl border border-[#34D399]/40 bg-[#34D399]/10 p-2.5 text-[12px] font-bold text-[#34D399]"
            >
              <Check size={16} /> Added test funds successfully!
            </motion.div>
          )}

          {/* Add Test Funds Buttons */}
          <div className="mt-5">
            <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
              Add Demo Funds for Testing
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleAddFunds(amt)}
                  className="flex items-center justify-center gap-1 rounded-xl border border-[#38BDF8]/30 bg-white/[0.04] py-2.5 text-[13px] font-bold text-white transition-all hover:border-[#38BDF8] hover:bg-[#38BDF8]/10 active:scale-95"
                >
                  <Plus size={14} className="text-[#38BDF8]" /> +${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Recent Transactions */}
          <div className="mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/50">Recent Activity</h3>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#34D399]/15 text-[#34D399]">
                    <ArrowDownLeft size={16} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-white">Test Fund Deposit</p>
                    <p className="text-[10px] text-white/40">Demo Instant Refill</p>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-[#34D399]">+$50.00</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#38BDF8]/15 text-[#38BDF8]">
                    <ArrowUpRight size={16} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-white">Rush Express Ride</p>
                    <p className="text-[10px] text-white/60 truncate">Current Location → Union Station</p>
                  </div>
                </div>
                <span className="text-[13px] font-bold text-white/80">-$24.90</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
