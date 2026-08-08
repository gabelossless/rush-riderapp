import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, Zap, ShieldCheck, Sparkles } from 'lucide-react'
import useTimeout from '../utils/useTimeout'
import { triggerHaptic } from '../utils/haptics'

/* ------------------------------------------------------------------ */
/*  HeroMoment — the "brand beat" that plays once per login, fading   */
/*  into the app. A car pulls up, the fare is shown transparently,    */
/*  and the FairFare promise lands in five seconds. Tap to skip.      */
/* ------------------------------------------------------------------ */

const FARE = 24.9
const DRIVER_SHARE = Math.round(FARE * 0.88 * 100) / 100 // 21.91
const RUSH_SHARE = Math.round(FARE * 0.12 * 100) / 100 // 2.99

export default function HeroMoment({ onDone }) {
  const timers = useTimeout()
  const [phase, setPhase] = useState('car') // car | fare | out
  const dismissRef = useRef(null)

  const dismiss = () => {
    if (phase === 'out') return
    triggerHaptic('light')
    setPhase('out')
    timers.set(() => onDone?.(), 700)
  }
  dismissRef.current = dismiss

  // Sequence: car drives up → fare card → hold → fade out (~5s total).
  useEffect(() => {
    timers.set(() => {
      triggerHaptic('medium')
      setPhase('fare')
    }, 1700)
    timers.set(() => dismissRef.current(), 4300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      role="presentation"
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex select-none flex-col items-center overflow-hidden bg-[#07080D]"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 'out' ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 left-1/2 h-[420px] w-[560px] -translate-x-1/2 rounded-full bg-[#38BDF8]/[0.12] blur-[110px]" />
        <div className="absolute -bottom-24 right-[-80px] h-[300px] w-[300px] rounded-full bg-[#34D399]/[0.08] blur-[90px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-x-0 top-[max(env(safe-area-inset-top),32px)] flex flex-col items-center gap-1.5"
      >
        <p className="text-[30px] font-black leading-none tracking-tight text-white">
          RUSH
        </p>
        <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.4em] text-white/40">
          <Sparkles size={10} className="text-[#38BDF8]" />
          Rideshare, Reimagined
        </p>
      </motion.div>

      {/* Car pulls up */}
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: phase === 'out' ? 80 : 0, opacity: phase === 'out' ? 0 : 1 }}
        transition={{ type: 'spring', stiffness: 110, damping: 15 }}
        className="relative z-10 mt-auto flex flex-col items-center pb-2 pt-16"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3 shadow-2xl shadow-black/50 backdrop-blur-md">
          <Car size={38} strokeWidth={1.8} className="text-[#38BDF8]" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Rush Express</p>
            <p className="text-[12px] font-black tracking-[0.25em] text-white">RUSH-88</p>
          </div>
        </div>

        {/* Road with moving dashes */}
        <div className="relative mt-5 h-6 w-56 overflow-hidden">
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/8" />
          <motion.div
            animate={{ x: [0, -48] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 flex -translate-y-1/2 gap-8"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[2px] w-6 rounded-full bg-[#38BDF8]/60" />
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Fare card */}
      <AnimatePresence>
        {phase === 'fare' && (
          <motion.div
            initial={{ y: 90, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            className="relative z-20 w-full max-w-sm px-6 pb-[max(env(safe-area-inset-bottom),32px)] pt-3"
          >
            <div className="rounded-3xl border border-white/12 bg-[#0B0F18]/92 p-5 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full border border-[#34D399]/30 bg-[#34D399]/10 px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-[#34D399]">
                  <Zap size={10} /> No surge
                </div>
                <p className="text-[10.5px] font-bold text-white/45">8 min · 2.4 mi</p>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Rush Express</p>
                  <p className="mt-0.5 text-[34px] font-black leading-none text-white">${FARE.toFixed(2)}</p>
                </div>
                <ShieldCheck size={30} strokeWidth={1.6} className="mb-1 text-[#34D399]" />
              </div>

              <div className="mt-4 space-y-2 border-t border-white/8 pt-3.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#34D399]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                    Driver keeps 88%
                  </span>
                  <span className="text-[13px] font-black text-[#34D399]">${DRIVER_SHARE.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-white/45">Rush keeps 12%</span>
                  <span className="text-[13px] font-bold text-white/60">${RUSH_SHARE.toFixed(2)}</span>
                </div>
              </div>

              <p className="mt-4 text-center text-[10px] font-medium text-white/25">
                No surge. 88% to the driver. Tap to continue.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
