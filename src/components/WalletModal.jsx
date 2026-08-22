import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Check, Receipt } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrip } from '../context/TripContext'
import useTimeout from '../utils/useTimeout'
import { triggerHaptic } from '../utils/haptics'

const DRIVER_PCT = 0.88

export default function WalletModal({ isOpen, onClose }) {
  const { user, addFunds } = useAuth()
  const { tripHistory } = useTrip()
  const [successToast, setSuccessToast] = useState(false)
  const [demoDeposits, setDemoDeposits] = useState([]) // funds added this session
  const timers = useTimeout()
  const isDriver = user.role === 'driver'

  const handleAddFunds = (amt) => {
    triggerHaptic('success')
    addFunds(amt)
    setDemoDeposits((prev) => [{ id: `dep_${Date.now()}`, amount: amt, at: new Date().toISOString() }, ...prev])
    setSuccessToast(true)
    timers.set(() => setSuccessToast(false), 2500)
  }

  const usd = (n) => `$${(n || 0).toFixed(2)}`

  // Real activity feed — combines actual completed trips with demo funds
  // added this session, instead of two fixed sample rows that never
  // reflected anything the person testing the demo actually did.
  const activity = useMemo(() => {
    const rideEntries = tripHistory.map((t) => ({
      id: t.id,
      at: t.date,
      icon: isDriver ? ArrowDownLeft : ArrowUpRight,
      tint: isDriver ? '#34D399' : '#38BDF8',
      label: isDriver ? `${t.tier || 'Ride'} Payout` : `${t.tier || 'Ride'}`,
      // Tips are chosen after the ride completes and settle separately (see
      // TripContext's recordTip), but they're still part of the same trip —
      // fold them into one line here rather than a second entry the rider
      // never asked for, and 100% of the tip goes to the driver (unlike the
      // fare, it isn't split by the FairFare platform cut).
      sub: t.tip ? `${t.pickup} → ${t.destination} · incl. ${usd(t.tip)} tip` : `${t.pickup} → ${t.destination}`,
      amount: isDriver ? (t.fare || 0) * DRIVER_PCT + (t.tip || 0) : -((t.fare || 0) + (t.tip || 0)),
    }))
    const depositEntries = demoDeposits.map((d) => ({
      id: d.id,
      at: d.at,
      icon: ArrowDownLeft,
      tint: '#34D399',
      label: 'Test Fund Deposit',
      sub: 'Demo instant refill',
      amount: d.amount,
    }))
    return [...rideEntries, ...depositEntries]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5)
  }, [tripHistory, demoDeposits, isDriver])

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
              aria-label="Close wallet"
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

          {/* Recent Activity — real, not a fixed sample */}
          <div className="mt-5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/50">Recent Activity</h3>
            {activity.length === 0 ? (
              <div className="mt-2 flex flex-col items-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.03] py-6 text-center">
                <Receipt size={18} className="text-white/25" />
                <p className="text-[11.5px] font-medium text-white/40">Nothing yet — take a ride or add funds.</p>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {activity.map((item) => {
                  const Icon = item.icon
                  const positive = item.amount >= 0
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: `${item.tint}22`, color: item.tint }}
                        >
                          <Icon size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold text-white">{item.label}</p>
                          <p className="truncate text-[10px] text-white/45">{item.sub}</p>
                        </div>
                      </div>
                      <span
                        className="shrink-0 text-[13px] font-bold"
                        style={{ color: positive ? '#34D399' : 'rgba(255,255,255,0.8)' }}
                      >
                        {positive ? '+' : '-'}
                        {usd(Math.abs(item.amount))}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
