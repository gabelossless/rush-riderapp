import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserCheck, ArrowRight, User, Car, Zap, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { triggerHaptic } from '../utils/haptics'

export default function AuthModal({ isOpen, onClose }) {
  const { loginPresetRider, loginPresetDriver, register, logout, user } = useAuth()
  const [tab, setTab] = useState('presets') // 'presets' | 'custom'
  const [role, setRole] = useState('passenger')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (msg) => {
    triggerHaptic('success')
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
      onClose()
    }, 1200)
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!name || !email) return
    register({ name, email, role })
    showToast(`Logged in as ${name}!`)
  }

  const handlePresetRider = () => {
    loginPresetRider()
    showToast('Logged in as Rider (Alex Rivera)')
  }

  const handlePresetDriver = () => {
    loginPresetDriver()
    showToast('Logged in as Driver (Marcus Vance)')
  }

  const handleLogout = () => {
    triggerHaptic('medium')
    logout()
    setToastMessage('Logged out successfully')
    setTimeout(() => setToastMessage(null), 1500)
  }

  return (
    <AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Rush Logo"
                className="h-9 w-9 rounded-xl object-cover border border-white/20"
              />
              <div>
                <h2 className="text-lg font-extrabold tracking-wide text-white">Rider & Driver Auth</h2>
                <p className="text-[11px] font-medium text-white/50">Instant profile switching & authentication</p>
              </div>
            </div>
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

          {/* Feedback Toast */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#34D399]/40 bg-[#34D399]/15 p-2.5 text-[12px] font-bold text-[#34D399]"
            >
              <ShieldCheck size={16} /> {toastMessage}
            </motion.div>
          )}

          {/* Mode Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1 text-[12px] font-semibold">
            <button
              onClick={() => {
                triggerHaptic('light')
                setTab('presets')
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                tab === 'presets'
                  ? 'bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-white'
                  : 'text-white/45 hover:text-white'
              }`}
            >
              <Zap size={14} className={tab === 'presets' ? 'text-[#38BDF8]' : ''} /> Quick Presets
            </button>
            <button
              onClick={() => {
                triggerHaptic('light')
                setTab('custom')
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all ${
                tab === 'custom'
                  ? 'bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-white'
                  : 'text-white/45 hover:text-white'
              }`}
            >
              <User size={14} className={tab === 'custom' ? 'text-[#38BDF8]' : ''} /> Sign Up / Login
            </button>
          </div>

          {/* Content */}
          {tab === 'presets' ? (
            <div className="mt-5 flex flex-col gap-3">
              <p className="text-[11.5px] font-medium text-white/55">
                Select a ready-to-test preset account to simulate real rider and driver interactions:
              </p>

              {/* Rider Preset Card */}
              <button
                onClick={handlePresetRider}
                className="group relative flex items-center justify-between rounded-2xl border border-[#38BDF8]/30 bg-white/[0.04] p-4 text-left transition-all hover:border-[#38BDF8] hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38BDF8] font-bold text-[#04140F]">
                    AR
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-white">Alex Rivera</span>
                      <span className="rounded-full bg-[#38BDF8]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        Rider Profile
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-white/50">
                      $142.50 Balance • 4.95 Rating • Ready to request rides
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#38BDF8] transition-transform group-hover:translate-x-1" />
              </button>

              {/* Driver Preset Card */}
              <button
                onClick={handlePresetDriver}
                className="group relative flex items-center justify-between rounded-2xl border border-[#34D399]/30 bg-white/[0.04] p-4 text-left transition-all hover:border-[#34D399] hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34D399] font-bold text-[#04140F]">
                    MV
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-extrabold text-white">Marcus Vance</span>
                      <span className="rounded-full bg-[#34D399]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#34D399]">
                        Driver Profile
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-white/50">
                      Tesla Model Y • 88% Payout Rate • Accepts requests
                    </p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-[#34D399] transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="mt-5 flex flex-col gap-3.5">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Account Type</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light')
                      setRole('passenger')
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-bold transition-all ${
                      role === 'passenger'
                        ? 'border-[#38BDF8] bg-[#38BDF8]/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    }`}
                  >
                    <User size={14} /> Passenger (Rider)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light')
                      setRole('driver')
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-bold transition-all ${
                      role === 'driver'
                        ? 'border-[#34D399] bg-[#34D399]/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    }`}
                  >
                    <Car size={14} /> Driver Partner
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[16px] text-white placeholder-white/40 focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="rider@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-[16px] text-white placeholder-white/40 focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3 text-[13.5px] font-extrabold text-[#061018] transition-transform active:scale-[0.98]"
              >
                <UserCheck size={16} /> Save & Enter App
              </button>
            </form>
          )}

          {/* Active Session Card with Logout */}
          {user && (
            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
                <span className="text-[11.5px] font-medium text-white/60">
                  Logged in as <strong className="text-white">{user.name}</strong> ({user.role})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:bg-red-500/20 active:scale-95"
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>
          )}
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
