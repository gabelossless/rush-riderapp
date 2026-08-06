import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Car,
  Check,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { triggerHaptic } from '../utils/haptics'

export default function SignUpFlow({ onComplete }) {
  const { register } = useAuth()

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [role, setRole] = useState(null) // 'passenger' | 'driver'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [color, setColor] = useState('')
  const [plate, setPlate] = useState('')
  const [pledged, setPledged] = useState(false)

  const totalSteps = role === 'driver' ? 3 : 2

  const nextStep = useCallback(() => {
    setDirection(1)
    if (step === 1 && role === 'passenger') {
      setStep(2)
    } else if (step === 2 && role === 'passenger') {
      register({ name, email, role: 'passenger' })
      setStep(3)
    } else if (step === 3) {
      register({
        name,
        email,
        role: 'driver',
        vehicle: `${vehicle} — ${color || 'Black'}`,
        plate: plate || 'RUSH-NEW',
        pledgeAccepted: true,
        humanVerified: true,
      })
      setStep(role === 'driver' ? 4 : 3)
    } else {
      setStep(step + 1)
    }
  }, [step, role, name, email, vehicle, color, plate, register])

  const prevStep = useCallback(() => {
    if (step <= 1) return
    setDirection(-1)
    setStep(step - 1)
  }, [step])

  const handleFinish = () => {
    triggerHaptic('success')
    onComplete?.()
  }

  const canAdvanceStep2 = name.trim() && email.trim()
  const canAdvanceStep3 = vehicle.trim() && pledged

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-void">
      {/* Background image */}
      <img
        src="/welcome-bg.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Gradient overlays */}
      <div
        className="absolute inset-x-0 top-0 h-[40%]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(5,5,10,0.82) 0%, rgba(5,5,10,0.55) 40%, rgba(5,5,10,0.15) 75%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[60%]"
        style={{
          background:
            'linear-gradient(to top, rgba(5,5,10,0.95) 0%, rgba(5,5,10,0.88) 30%, rgba(5,5,10,0.50) 55%, rgba(5,5,10,0.10) 75%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(3,3,8,0.45) 100%)',
        }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            'linear-gradient(160deg, rgba(255,185,60,0.07) 0%, rgba(200,120,40,0.05) 50%, rgba(180,100,30,0.04) 100%)',
        }}
      />

      {/* Logo lockup — top zone */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 flex flex-col items-center pt-[max(env(safe-area-inset-top),48px)] pb-4"
      >
        <img
          src="/logo.png"
          alt="Rush"
          className="h-14 w-14 rounded-2xl border border-white/20 object-cover"
          style={{
            boxShadow:
              '0 0 30px rgba(56,189,248,0.25), 0 4px 20px rgba(0,0,0,0.4)',
          }}
        />
        <h1
          className="mt-3 text-[32px] font-extrabold leading-none tracking-[0.28em]"
          style={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            background: 'linear-gradient(100deg, #ffffff 0%, #e0e8f0 40%, #38BDF8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 40px rgba(56,189,248,0.3)',
            filter: 'drop-shadow(0 2px 12px rgba(56,189,248,0.2))',
          }}
        >
          RUSH
        </h1>
        <div className="mt-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
          <p className="text-[11px] font-semibold tracking-wide text-white/60">
            100% Human. 0% Autopilot.
          </p>
        </div>
      </motion.div>

      {/* Glass card — bottom zone */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: 0.35,
          type: 'spring',
          stiffness: 350,
          damping: 28,
        }}
        className="relative z-20 mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-end px-4 pb-[max(env(safe-area-inset-bottom),12px)]"
      >
        <div
          className="relative overflow-hidden rounded-[28px] border border-white/[0.08]"
          style={{
            background: 'rgba(8,12,20,0.78)',
            backdropFilter: 'blur(40px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
            boxShadow:
              '0 -8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Back button */}
          {step > 1 && step < 4 && (
            <button
              onClick={() => {
                triggerHaptic('light')
                prevStep()
              }}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Step content */}
          <div className="p-5">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                >
                  <StepRole onSelect={(r) => { setRole(r); setDirection(1); setStep(2) }} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                >
                  <StepAccount
                    name={name}
                    email={email}
                    onNameChange={setName}
                    onEmailChange={setEmail}
                    canAdvance={canAdvanceStep2}
                    onNext={nextStep}
                    role={role}
                  />
                </motion.div>
              )}

              {step === 3 && role === 'driver' && (
                <motion.div
                  key="step3"
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                >
                  <StepDriver
                    vehicle={vehicle}
                    color={color}
                    plate={plate}
                    pledged={pledged}
                    onVehicleChange={setVehicle}
                    onColorChange={setColor}
                    onPlateChange={setPlate}
                    onPledgeToggle={() => setPledged(!pledged)}
                    canAdvance={canAdvanceStep3}
                    onNext={nextStep}
                  />
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                >
                  <StepSuccess name={name} role={role} onFinish={handleFinish} />
                </motion.div>
              )}

              {step === 3 && role === 'passenger' && (
                <motion.div
                  key="step3-passenger"
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -40 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 32,
                    mass: 0.8,
                  }}
                >
                  <StepSuccess name={name} role={role} onFinish={handleFinish} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress dots */}
            {step < 4 && (
              <div className="flex items-center justify-center gap-2 pt-3">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                  <motion.div
                    key={s}
                    className={`h-2 w-2 rounded-full transition-all duration-300 ${
                      s === step
                        ? 'bg-[#38BDF8]'
                        : s < step
                          ? 'bg-[#38BDF8]/40'
                          : 'bg-white/20'
                    }`}
                    layout
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-4 text-center text-[10.5px] font-semibold tracking-[0.15em] text-white/30"
        >
          Born in Denver. Kept human.
        </motion.p>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Role Selection                                           */
/* ------------------------------------------------------------------ */

function StepRole({ onSelect }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1 text-center">
        <p className="text-[16px] font-extrabold text-white">How will you use Rush?</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          Choose your role to get started
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            triggerHaptic('light')
            onSelect('passenger')
          }}
          className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] transition-colors group-hover:bg-white/[0.10]">
            <User size={26} className="text-white/50 group-hover:text-white/70" />
          </div>
          <div>
            <p className="text-[14px] font-extrabold text-white">Rider</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-white/45">
              Request rides{'\n'}in your city
            </p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            triggerHaptic('light')
            onSelect('driver')
          }}
          className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] transition-colors group-hover:bg-white/[0.10]">
            <Car size={26} className="text-white/50 group-hover:text-white/70" />
          </div>
          <div>
            <p className="text-[14px] font-extrabold text-white">Driver</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-white/45">
              Earn on your{'\n'}own schedule
            </p>
          </div>
        </motion.button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Account Details                                          */
/* ------------------------------------------------------------------ */

function StepAccount({ name, email, onNameChange, onEmailChange, canAdvance, onNext, role }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <p className="text-[16px] font-extrabold text-white">Create your account</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          {role === 'driver' ? 'Tell us about yourself' : 'Just a couple details'}
        </p>
      </div>

      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
          Full Name
        </label>
        <input
          type="text"
          required
          placeholder="e.g. Jordan Lee"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#38BDF8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 focus:bg-white/[0.07]"
        />
      </div>

      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
          Email Address
        </label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#38BDF8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 focus:bg-white/[0.07]"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={!canAdvance}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3.5 text-[13.5px] font-extrabold text-[#061018] transition-all disabled:opacity-35 disabled:pointer-events-none"
      >
        Continue <ArrowRight size={16} />
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Driver Vehicle Info + Pledge                             */
/* ------------------------------------------------------------------ */

function StepDriver({
  vehicle,
  color,
  plate,
  pledged,
  onVehicleChange,
  onColorChange,
  onPlateChange,
  onPledgeToggle,
  canAdvance,
  onNext,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <p className="text-[16px] font-extrabold text-white">Your vehicle</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          Tell us what you'll be driving
        </p>
      </div>

      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
          Vehicle
        </label>
        <input
          type="text"
          placeholder="e.g. Tesla Model 3"
          value={vehicle}
          onChange={(e) => onVehicleChange(e.target.value)}
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#34D399]/60 focus:outline-none focus:ring-2 focus:ring-[#34D399]/20 focus:bg-white/[0.07]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
            Color
          </label>
          <input
            type="text"
            placeholder="e.g. Black"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#34D399]/60 focus:outline-none focus:ring-2 focus:ring-[#34D399]/20 focus:bg-white/[0.07]"
          />
        </div>
        <div>
          <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
            Plate
          </label>
          <input
            type="text"
            placeholder="e.g. ABC-1234"
            value={plate}
            onChange={(e) => onPlateChange(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[14px] font-mono tracking-wider text-white placeholder-white/35 uppercase transition-all duration-200 focus:border-[#34D399]/60 focus:outline-none focus:ring-2 focus:ring-[#34D399]/20 focus:bg-white/[0.07]"
          />
        </div>
      </div>

      {/* Human Driver Pledge */}
      <button
        type="button"
        onClick={onPledgeToggle}
        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
          pledged
            ? 'border-[#34D399]/50 bg-[#34D399]/10'
            : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
            pledged
              ? 'border-[#34D399] bg-[#34D399]'
              : 'border-white/20 bg-white/[0.05]'
          }`}
        >
          {pledged && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check size={12} className="text-[#04140F]" />
            </motion.div>
          )}
        </div>
        <div>
          <p className="text-[12px] font-bold text-white">Human Driver Pledge</p>
          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-white/45">
            I confirm I am a real person and will operate this vehicle safely
            and professionally.
          </p>
        </div>
      </button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onNext}
        disabled={!canAdvance}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#34D399] py-3.5 text-[13.5px] font-extrabold text-[#04140F] transition-all disabled:opacity-35 disabled:pointer-events-none"
      >
        <ShieldCheck size={16} /> Complete Registration
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Success                                                  */
/* ------------------------------------------------------------------ */

function StepSuccess({ name, role, onFinish }) {
  const firstName = name.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col items-center py-4 text-center">
      {/* Animated checkmark */}
      <div className="relative mb-5">
        <motion.div
          className="absolute inset-0 rounded-full bg-[#34D399]/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 2.2, opacity: [0, 0.4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          style={{ width: 80, height: 80, margin: '-10px' }}
        />
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#34D399]/50 bg-[#34D399]/20"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.15,
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Check size={36} strokeWidth={3} className="text-[#34D399]" />
          </motion.div>
        </motion.div>
      </div>

      <motion.h2
        className="text-[22px] font-black text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        Welcome, {firstName}
      </motion.h2>

      <motion.p
        className="mt-1.5 text-[12px] font-medium text-white/50"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.3 }}
      >
        {role === 'driver'
          ? "Your driver profile is ready. Let's get you on the road."
          : 'Your account is set up. Request your first ride anytime.'}
      </motion.p>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onFinish}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.3 }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3.5 text-[13.5px] font-extrabold text-[#061018]"
      >
        <Sparkles size={16} /> Enter Rush
      </motion.button>
    </div>
  )
}
