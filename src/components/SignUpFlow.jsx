import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Car,
  Check,
  ChevronLeft,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { triggerHaptic } from '../utils/haptics'
import useTimeout from '../utils/useTimeout'

/* ------------------------------------------------------------------ */
/*  SignUpFlow — the app's front door.                                 */
/*  Email-first adaptive auth: one entry point that branches based on  */
/*  whether the email is recognized. Demo access is a first-class      */
/*  choice (investors must see the product in seconds).                */
/* ------------------------------------------------------------------ */

export default function SignUpFlow({ onComplete }) {
  const { register, loginWithEmail, findKnownUser, demoLogin } = useAuth()

  const [step, setStep] = useState('landing') // landing | checking | welcome-back | name | role | vehicle | success | demo
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState(null)
  const [vehicle, setVehicle] = useState('')
  const [color, setColor] = useState('')
  const [plate, setPlate] = useState('')
  const [pledged, setPledged] = useState(false)
  const [welcomeUser, setWelcomeUser] = useState(null)

  const emailRef = useRef(null)
  const checkTimer = useRef(null)

  const timers = useTimeout()

  useEffect(() => {
    if (step === 'name') emailRef.current?.focus({ preventScroll: true })
  }, [step])

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())

  const handleEmailSubmit = () => {
    if (!isValidEmail(email)) {
      triggerHaptic('warning')
      return
    }
    triggerHaptic('light')
    setStep('checking')
    // Simulated identity check — the "Apple moment" of silent auth.
    checkTimer.current = timers.set(() => {
      const known = findKnownUser(email)
      if (known) {
        setWelcomeUser(known)
        setStep('welcome-back')
      } else {
        setStep('name')
      }
    }, 900)
  }

  const handleWelcomeBackContinue = () => {
    triggerHaptic('success')
    loginWithEmail(welcomeUser?.email || email)
    setStep('success')
  }

  const handleNameSubmit = () => {
    if (!name.trim()) return
    triggerHaptic('light')
    setStep('role')
  }

  const handleRoleSelect = (r) => {
    triggerHaptic('light')
    setRole(r)
    if (r === 'passenger') {
      register({ name, email, role: 'passenger' })
      setStep('success')
    } else {
      setStep('vehicle')
    }
  }

  const handleDriverSubmit = () => {
    if (!vehicle.trim() || !pledged) return
    triggerHaptic('success')
    register({
      name,
      email,
      role: 'driver',
      vehicle: `${vehicle} — ${color || 'Black'}`,
      plate: plate || 'RUSH-NEW',
      pledgeAccepted: true,
      humanVerified: true,
    })
    setStep('success')
  }

  const handleDemo = (roleKey) => {
    triggerHaptic('success')
    if (roleKey === 'driver') {
      setName('Marcus Vance')
      setRole('driver')
    } else {
      setName('Alex Rivera')
      setRole('passenger')
    }
    demoLogin(roleKey)
    setStep('success')
  }

  const goBack = () => {
    triggerHaptic('light')
    if (checkTimer.current) {
      timers.clear(checkTimer.current)
      checkTimer.current = null
    }
    const map = {
      checking: 'landing',
      'welcome-back': 'landing',
      name: 'landing',
      role: 'name',
      vehicle: 'role',
      demo: 'landing',
    }
    setStep(map[step] || 'landing')
  }

  const handleFinish = () => {
    triggerHaptic('success')
    onComplete?.()
  }

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
        className="relative z-20 flex flex-col items-center pt-[max(env(safe-area-inset-top),40px)] pb-3"
      >
        <motion.img
          src="/logo.png"
          alt="Rush"
          className="h-14 w-14 rounded-2xl border border-white/20 object-cover"
          style={{
            boxShadow: '0 0 30px rgba(56,189,248,0.25), 0 4px 20px rgba(0,0,0,0.4)',
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 20 }}
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
        transition={{ delay: 0.35, type: 'spring', stiffness: 350, damping: 28 }}
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
          {step !== 'landing' && step !== 'success' && (
            <button
              onClick={goBack}
              className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition-colors hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          {/* Step content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {step === 'landing' && (
                <motion.div
                  key="landing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                >
                  <StepLanding
                    email={email}
                    onEmailChange={setEmail}
                    onSubmit={handleEmailSubmit}
                    onDemo={() => setStep('demo')}
                  />
                </motion.div>
              )}

              {step === 'checking' && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col items-center py-6 text-center">
                    <div className="relative mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#38BDF8]/30">
                      <span className="absolute inset-0 rounded-full border border-[#38BDF8]/40 animate-pulse-ring" />
                      <Mail size={20} className="text-[#38BDF8]" />
                    </div>
                    <p className="text-[14px] font-extrabold text-white">Checking your email…</p>
                    <p className="mt-1 text-[11px] font-medium text-white/45">
                      We'll find your account instantly
                    </p>
                    {/* shimmer bar */}
                    <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full w-full animate-shimmer"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(56,189,248,0.1), rgba(56,189,248,0.6), rgba(56,189,248,0.1))',
                          backgroundSize: '200% 100%',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'welcome-back' && welcomeUser && (
                <motion.div
                  key="welcome-back"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                >
                  <StepWelcomeBack
                    user={welcomeUser}
                    onContinue={handleWelcomeBackContinue}
                    onSwitch={() => {
                      setEmail('')
                      goBack()
                    }}
                  />
                </motion.div>
              )}

              {step === 'name' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                >
                  <StepName
                    name={name}
                    email={email}
                    onNameChange={setName}
                    onSubmit={handleNameSubmit}
                    inputRef={emailRef}
                  />
                </motion.div>
              )}

              {step === 'role' && (
                <motion.div
                  key="role"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                >
                  <StepRole onSelect={handleRoleSelect} />
                </motion.div>
              )}

              {step === 'vehicle' && (
                <motion.div
                  key="vehicle"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
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
                    onSubmit={handleDriverSubmit}
                  />
                </motion.div>
              )}

              {step === 'demo' && (
                <motion.div
                  key="demo"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32, mass: 0.8 }}
                >
                  <StepDemo onSelect={handleDemo} />
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                >
                  <StepSuccess
                    name={name || welcomeUser?.name || 'there'}
                    role={role || welcomeUser?.role}
                    onFinish={handleFinish}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
/*  Step: Landing — email entry with equal-weight demo access          */
/* ------------------------------------------------------------------ */

function StepLanding({ email, onEmailChange, onSubmit, onDemo }) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-[18px] font-extrabold text-white">Welcome to Rush</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          Human-driven rides. Fair fares. No surge games.
        </p>
      </div>

      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
          Email
        </label>
        <input
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit()}
          autoFocus
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#38BDF8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 focus:bg-white/[0.07]"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={!valid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3.5 text-[14px] font-extrabold text-[#061018] transition-all disabled:opacity-35 disabled:pointer-events-none"
      >
        Get Started <ArrowRight size={16} />
      </motion.button>

      <div className="relative flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">or</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDemo}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] py-3.5 text-[13.5px] font-extrabold text-white transition-all hover:bg-white/[0.08]"
      >
        <Sparkles size={15} className="text-[#38BDF8]" /> Explore the Demo
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step: Welcome Back — one-tap silent auth for recognized emails     */
/* ------------------------------------------------------------------ */

function StepWelcomeBack({ user, onContinue, onSwitch }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-[18px] font-extrabold text-white">Welcome back</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          We found your Rush account
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[13px] font-black text-[#04140F]"
          style={{ background: user.role === 'driver' ? '#34D399' : '#38BDF8' }}
        >
          {user.avatar || 'US'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-extrabold text-white">{user.name}</p>
          <p className="truncate text-[11px] font-medium capitalize text-white/45">
            {user.role} • Joined {user.joinedDate}
          </p>
        </div>
        <span className="h-2 w-2 rounded-full bg-[#34D399] animate-pulse" />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3.5 text-[14px] font-extrabold text-[#061018]"
      >
        Continue as {user.name.split(' ')[0]} <ArrowRight size={16} />
      </motion.button>

      <button
        onClick={onSwitch}
        className="text-center text-[11px] font-semibold text-white/40 hover:text-white"
      >
        Not you? Use a different email
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step: Name — minimal, one field, return-key advances               */
/* ------------------------------------------------------------------ */

function StepName({ name, email, onNameChange, onSubmit, inputRef }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-[18px] font-extrabold text-white">What's your name?</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          We'll use it to personalize your rides
        </p>
      </div>

      <div>
        <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">
          Full Name
        </label>
        <input
          ref={inputRef}
          type="text"
          autoCapitalize="words"
          placeholder="e.g. Jordan Lee"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && onSubmit()}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-3 text-[16px] text-white placeholder-white/35 transition-all duration-200 focus:border-[#38BDF8]/60 focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/20 focus:bg-white/[0.07]"
        />
        <p className="mt-2 text-[10.5px] font-medium text-white/35">Signed up with {email}</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={!name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3.5 text-[14px] font-extrabold text-[#061018] transition-all disabled:opacity-35 disabled:pointer-events-none"
      >
        Continue <ArrowRight size={16} />
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step: Role — Rider vs Driver cards, tap to continue                */
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
          onClick={() => onSelect('passenger')}
          className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition-all duration-200 hover:border-[#38BDF8]/50 hover:bg-[#38BDF8]/[0.06]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] transition-colors group-hover:bg-[#38BDF8]/15">
            <User size={26} className="text-white/50 transition-colors group-hover:text-[#38BDF8]" />
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
          onClick={() => onSelect('driver')}
          className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center transition-all duration-200 hover:border-[#34D399]/50 hover:bg-[#34D399]/[0.06]"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] transition-colors group-hover:bg-[#34D399]/15">
            <Car size={26} className="text-white/50 transition-colors group-hover:text-[#34D399]" />
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
/*  Step: Driver — vehicle details + Human Driver Pledge               */
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
  onSubmit,
}) {
  const valid = vehicle.trim() && pledged

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1 text-center">
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
          onKeyDown={(e) => e.key === 'Enter' && valid && onSubmit()}
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

      <button
        type="button"
        onClick={onPledgeToggle}
        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
          pledged ? 'border-[#34D399]/50 bg-[#34D399]/10' : 'border-white/10 bg-white/[0.03]'
        }`}
      >
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
            pledged ? 'border-[#34D399] bg-[#34D399]' : 'border-white/20 bg-white/[0.05]'
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
            I confirm I am a real person and will operate this vehicle safely and
            professionally.
          </p>
        </div>
      </button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubmit}
        disabled={!valid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#34D399] py-3.5 text-[13.5px] font-extrabold text-[#04140F] transition-all disabled:opacity-35 disabled:pointer-events-none"
      >
        <ShieldCheck size={16} /> Complete Registration
      </motion.button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step: Demo — one-tap preset accounts                               */
/* ------------------------------------------------------------------ */

function StepDemo({ onSelect }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-1 text-center">
        <p className="text-[16px] font-extrabold text-white">Explore the demo</p>
        <p className="mt-1 text-[12px] font-medium text-white/50">
          Jump in with a ready-to-test account
        </p>
      </div>

      <button
        onClick={() => onSelect('passenger')}
        className="group flex items-center justify-between rounded-2xl border border-[#38BDF8]/30 bg-white/[0.04] p-4 text-left transition-all hover:border-[#38BDF8] hover:bg-white/[0.08] active:scale-[0.98]"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#38BDF8] font-bold text-[#04140F]">
            AR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-extrabold text-white">Alex Rivera</span>
              <span className="rounded-full bg-[#38BDF8]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#38BDF8]">
                Rider
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-white/50">
              $142.50 Balance • 4.95 Rating
            </p>
          </div>
        </div>
        <ArrowRight size={18} className="text-[#38BDF8] transition-transform group-hover:translate-x-1" />
      </button>

      <button
        onClick={() => onSelect('driver')}
        className="group flex items-center justify-between rounded-2xl border border-[#34D399]/30 bg-white/[0.04] p-4 text-left transition-all hover:border-[#34D399] hover:bg-white/[0.08] active:scale-[0.98]"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34D399] font-bold text-[#04140F]">
            MV
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-extrabold text-white">Marcus Vance</span>
              <span className="rounded-full bg-[#34D399]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#34D399]">
                Driver
              </span>
            </div>
            <p className="mt-0.5 text-[11px] font-medium text-white/50">
              Tesla Model Y • 88% Payout Rate
            </p>
          </div>
        </div>
        <ArrowRight size={18} className="text-[#34D399] transition-transform group-hover:translate-x-1" />
      </button>

      <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-white/35">
        <Zap size={11} className="text-[#38BDF8]" /> No credit card. No backend. Instant access.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step: Success — animated check + welcome                           */
/* ------------------------------------------------------------------ */

function StepSuccess({ name, role, onFinish }) {
  const firstName = name.split(' ')[0] || 'there'

  return (
    <div className="flex flex-col items-center py-4 text-center">
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
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
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
