import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ArrowRight,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { triggerHaptic } from '../utils/haptics'
import SignUpFlow from './SignUpFlow'

export default function AuthModal({ isOpen, onClose }) {
  const { loginPresetRider, loginPresetDriver, logout, user } = useAuth()
  const [toastMessage, setToastMessage] = useState(null)
  const [showSignUp, setShowSignUp] = useState(false)

  const showToast = (msg) => {
    triggerHaptic('success')
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
      onClose()
    }, 1200)
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

  // If the SignUpFlow is active, render it full-screen instead of the modal
  if (showSignUp) {
    return (
      <SignUpFlow
        onComplete={() => {
          setShowSignUp(false)
          onClose()
        }}
      />
    )
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
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Rush Logo"
                  className="h-9 w-9 rounded-xl object-cover border border-white/20"
                />
                <div>
                  <h2 className="text-lg font-extrabold tracking-wide text-white">
                    Quick Access
                  </h2>
                  <p className="text-[11px] font-medium text-white/50">
                    Jump right in or create an account
                  </p>
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

            {/* Quick Presets */}
            <div className="mt-5 flex flex-col gap-3">
              <p className="text-[11.5px] font-medium text-white/55">
                Select a ready-to-test preset account:
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
                      <span className="text-[14px] font-extrabold text-white">
                        Alex Rivera
                      </span>
                      <span className="rounded-full bg-[#38BDF8]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        Rider Profile
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-white/50">
                      $142.50 Balance • 4.95 Rating • Ready to request rides
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#38BDF8] transition-transform group-hover:translate-x-1"
                />
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
                      <span className="text-[14px] font-extrabold text-white">
                        Marcus Vance
                      </span>
                      <span className="rounded-full bg-[#34D399]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#34D399]">
                        Driver Profile
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-white/50">
                      Tesla Model Y • 88% Payout Rate • Accepts requests
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={18}
                  className="text-[#34D399] transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>

            {/* Create Account CTA */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  triggerHaptic('medium')
                  setShowSignUp(true)
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3 text-[13px] font-extrabold text-white transition-all hover:bg-white/[0.08] active:scale-[0.98]"
              >
                <Sparkles size={15} className="text-[#38BDF8]" />
                Create Account
                <ArrowRight size={14} />
              </button>
              <p className="mt-2 text-center text-[10px] font-medium text-white/35">
                Full onboarding with role selection & verification
              </p>
            </div>

            {/* Active Session Card with Logout */}
            {user && (
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
                  <span className="text-[11.5px] font-medium text-white/60">
                    Logged in as{' '}
                    <strong className="text-white">{user.name}</strong> (
                    {user.role})
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
        </div>
      )}
    </AnimatePresence>
  )
}
