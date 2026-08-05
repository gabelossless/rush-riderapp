import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Battery,
  Bell,
  Building2,
  Car,
  Check,
  ChevronLeft,
  CircleCheck,
  CircleDollarSign,
  Clock,
  Gauge,
  Home,
  Landmark,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Plane,
  Radio,
  Search,
  ShieldCheck,
  Signal,
  Snowflake,
  Sparkles,
  Star,
  Timer,
  TrendingUp,
  User,
  Users,
  VolumeX,
  Wallet,
  Wifi,
  X,
  Zap,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const DESTINATIONS = [
  { name: 'Downtown Tech Hub', eta: '9 min', icon: Building2, tint: '#00F0FF' },
  { name: 'Airport Terminal 2', eta: '18 min', icon: Plane, tint: '#7000FF' },
  { name: 'Convention Center', eta: '6 min', icon: Landmark, tint: '#3DFFC2' },
]

const PREFERENCES = [
  { key: 'quiet', label: 'Quiet Mode', icon: VolumeX },
  { key: 'ac', label: 'AC 68°F', icon: Snowflake },
  { key: 'express', label: 'Express Route', icon: Zap },
]

const RIDES = [
  { id: 'standard', name: 'Rush Standard', desc: 'Everyday comfort', eta: '12 min', price: 18.4, icon: Car, seats: 4 },
  { id: 'express', name: 'Rush Express', desc: 'Priority • top drivers', eta: '8 min', price: 24.9, icon: Zap, seats: 4, featured: true },
  { id: 'xl', name: 'Rush XL', desc: 'Extra space for up to 6', eta: '15 min', price: 29.8, icon: Users, seats: 6 },
]

const DRIVER = {
  name: 'Alex Vance',
  car: 'Tesla Model Y — Matte Black',
  rating: 4.98,
  plate: 'RUSH-88',
  initials: 'AV',
}

const FARE_TOTAL = 24.0
const DRIVER_PCT = 0.88

const usd = (n) => `$${n.toFixed(2)}`

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function useInterval(callback, delay) {
  const saved = useRef(callback)
  useEffect(() => {
    saved.current = callback
  }, [callback])
  useEffect(() => {
    if (delay === null || delay === undefined) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

const makeRequest = () => ({
  id: Date.now(),
  fare: 21.12,
  minutes: 12,
  distance: '1.8 mi',
  pickup: 'Neon District Ave',
  destination: 'Rush HQ — 88 Circuit',
})

const clamp01 = (n) => Math.min(1, Math.max(0, n))

/* ------------------------------------------------------------------ */
/*  MapCanvas                                                          */
/* ------------------------------------------------------------------ */

const ROUTE_PATH = 'M 80 360 C 70 288 150 290 158 232 C 166 174 232 176 250 118 C 262 78 312 84 322 92'

const AMBIENT_CARS = [
  { path: 'M -8 200 L 408 200', dur: 12, color: '#00F0FF', begin: '0s' },
  { path: 'M 250 -8 L 250 468', dur: 16, color: '#9D6BFF', begin: '1.2s' },
  { path: 'M -8 320 L 408 64', dur: 20, color: '#3DFFC2', begin: '2.4s' },
  { path: 'M -8 96 L 408 96', dur: 18, color: '#00F0FF', begin: '3.6s' },
]

function MapCanvas({ carProgress = 0, radar = false, showRoute = false }) {
  const routeRef = useRef(null)
  const [len, setLen] = useState(0)

  useEffect(() => {
    const el = routeRef.current
    if (!el) return
    setLen(el.getTotalLength())
  }, [])

  const pos = useMemo(() => {
    if (!routeRef.current || !len) return null
    const p = routeRef.current.getPointAtLength(len * clamp01(carProgress))
    return { x: p.x, y: p.y }
  }, [carProgress, len])

  return (
    <svg
      viewBox="0 0 400 470"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Interactive city map"
    >
      <defs>
        <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="100%" stopColor="#8B3BFF" />
        </linearGradient>
        <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowViolet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7000FF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7000FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width="400" height="470" fill="#0A0D15" />
      <ellipse cx="330" cy="60" rx="260" ry="200" fill="url(#glowViolet)" />
      <ellipse cx="60" cy="400" rx="240" ry="190" fill="url(#glowCyan)" />

      {/* street grid */}
      <g stroke="#151C2A" strokeLinecap="round">
        <line x1="0" y1="120" x2="400" y2="120" strokeWidth="7" />
        <line x1="0" y1="200" x2="400" y2="200" strokeWidth="9" />
        <line x1="0" y1="280" x2="400" y2="280" strokeWidth="6" />
        <line x1="0" y1="360" x2="400" y2="360" strokeWidth="8" />
        <line x1="0" y1="440" x2="400" y2="440" strokeWidth="5" />
        <line x1="80" y1="0" x2="80" y2="470" strokeWidth="7" />
        <line x1="170" y1="0" x2="170" y2="470" strokeWidth="6" />
        <line x1="250" y1="0" x2="250" y2="470" strokeWidth="9" />
        <line x1="340" y1="0" x2="340" y2="470" strokeWidth="6" />
        <line x1="150" y1="150" x2="60" y2="60" strokeWidth="5" />
        <line x1="330" y1="330" x2="230" y2="250" strokeWidth="5" />
      </g>

      {/* blocks */}
      <g fill="#0E1420" stroke="#151D2B" strokeWidth="1.5">
        <rect x="8" y="8" width="64" height="104" rx="10" />
        <rect x="88" y="8" width="74" height="60" rx="10" />
        <rect x="258" y="8" width="74" height="60" rx="10" />
        <rect x="178" y="8" width="64" height="104" rx="10" />
        <rect x="8" y="128" width="64" height="64" rx="10" />
        <rect x="258" y="128" width="74" height="64" rx="10" />
        <rect x="178" y="128" width="64" height="64" rx="10" />
        <rect x="8" y="208" width="154" height="64" rx="10" />
        <rect x="258" y="208" width="74" height="64" rx="10" />
        <rect x="178" y="208" width="64" height="64" rx="10" />
        <rect x="8" y="288" width="154" height="64" rx="10" />
        <rect x="258" y="288" width="74" height="64" rx="10" />
        <rect x="178" y="288" width="64" height="64" rx="10" />
        <rect x="88" y="368" width="74" height="64" rx="10" />
        <rect x="178" y="368" width="154" height="64" rx="10" />
      </g>

      {/* park */}
      <g>
        <rect x="348" y="76" width="46" height="116" rx="12" fill="#0D1F18" stroke="#14241D" strokeWidth="2" />
        <circle cx="364" cy="108" r="9" fill="#12352B" />
        <circle cx="382" cy="140" r="11" fill="#12352B" />
        <circle cx="370" cy="168" r="8" fill="#12352B" />
      </g>

      {/* glow nodes */}
      <g>
        <circle cx="80" cy="120" r="3" fill="#00F0FF" opacity="0.7" />
        <circle cx="250" cy="200" r="3" fill="#8B3BFF" opacity="0.7" />
        <circle cx="170" cy="360" r="3" fill="#3DFFC2" opacity="0.7" />
        <circle cx="340" cy="120" r="3" fill="#00F0FF" opacity="0.5" />
        <circle cx="80" cy="280" r="3" fill="#8B3BFF" opacity="0.5" />
      </g>

      {/* fine grid overlay */}
      <g stroke="#1A2336" strokeWidth="0.6" opacity="0.5">
        {Array.from({ length: 19 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 20} y1="0" x2={20 + i * 20} y2="470" />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={20 + i * 20} x2="400" y2={20 + i * 20} />
        ))}
      </g>

      {/* route */}
      {showRoute && (
        <g>
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="#26334D"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.65"
          />
          <path d={ROUTE_PATH} ref={routeRef} fill="none" stroke="transparent" />
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={len ? `${len * clamp01(carProgress)} ${len}` : '0 1000'}
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.75))' }}
          />
        </g>
      )}

      {/* ambient traffic */}
      <g>
        {AMBIENT_CARS.map((c, i) => (
          <g key={i} opacity="0.85">
            <circle r="6" fill={c.color} opacity="0.25">
              <animateMotion dur={`${c.dur}s`} repeatCount="indefinite" path={c.path} begin={c.begin} />
            </circle>
            <circle r="2.6" fill="#E8FBFF">
              <animateMotion dur={`${c.dur}s`} repeatCount="indefinite" path={c.path} begin={c.begin} />
            </circle>
          </g>
        ))}
      </g>

      {/* pickup pin */}
      <g transform="translate(80,360)">
        <circle r="30" fill="#00F0FF" opacity="0.12">
          <animate attributeName="r" values="12;32" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <circle r="12" fill="none" stroke="#00F0FF" strokeWidth="1.2" opacity="0.55" />
        <circle r="5" fill="#00F0FF" style={{ filter: 'drop-shadow(0 0 6px #00F0FF)' }} />
      </g>

      {/* dropoff pin */}
      {showRoute && (
        <g transform="translate(322,92)">
          <circle r="26" fill="#8B3BFF" opacity="0.15">
            <animate attributeName="r" values="10;28" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
          </circle>
          <rect x="-6" y="-6" width="12" height="12" rx="2.5" fill="#A86BFF" transform="rotate(45)"
            style={{ filter: 'drop-shadow(0 0 6px #8B3BFF)' }} />
        </g>
      )}

      {/* radar scan */}
      {radar && (
        <g transform="translate(80,360)">
          {[0, 1, 2].map((i) => (
            <circle key={i} r="6" fill="none" stroke="#00F0FF" strokeWidth="1.4">
              <animate attributeName="r" values="6;54" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {[0, 1, 2].map((i) => (
            <circle key={`v${i}`} r="6" fill="none" stroke="#8B3BFF" strokeWidth="1.4">
              <animate attributeName="r" values="6;54" dur="2.2s" begin={`${1.1 + i * 0.73}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2.2s" begin={`${1.1 + i * 0.73}s`} repeatCount="indefinite" />
            </circle>
          ))}
          <line x1="-36" y1="0" x2="36" y2="0" stroke="#00F0FF" strokeWidth="1" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2.4s" repeatCount="indefinite" />
          </line>
          <line y1="-36" y2="36" stroke="#00F0FF" strokeWidth="0.6" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="45" to="405" dur="2.4s" repeatCount="indefinite" />
          </line>
          <circle r="4" fill="#00F0FF" style={{ filter: 'drop-shadow(0 0 6px #00F0FF)' }}>
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
      )}

      {/* live vehicle */}
      {pos && (
        <g transform={`translate(${pos.x},${pos.y})`}>
          <circle r="11" fill="#00F0FF" opacity="0.2" />
          <rect x="-6.5" y="-4" width="13" height="8" rx="3" fill="#0A0D15" stroke="#00F0FF" strokeWidth="1.6"
            style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.9))' }} />
        </g>
      )}

      <rect width="400" height="470" fill="url(#vignette)" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Small UI atoms                                                     */
/* ------------------------------------------------------------------ */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-white/70">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <Wifi size={13} strokeWidth={2.4} />
        <Signal size={13} strokeWidth={2.4} />
        <Battery size={15} strokeWidth={2} />
      </div>
    </div>
  )
}

function Avatar({ size = 56, className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg,#00F0FF 0%,#4770FF 55%,#7000FF 100%)',
        boxShadow: '0 0 22px rgba(0,240,255,0.35)',
      }}
    >
      <User size={size * 0.5} strokeWidth={2.2} className="text-white/90" />
      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#12151E] bg-emerald-400" />
    </div>
  )
}

function SegmentToggle({ value, onChange }) {
  const options = [
    { id: 'passenger', label: 'Passenger', icon: Car },
    { id: 'driver', label: 'Driver', icon: Zap },
  ]
  return (
    <div className="relative flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
      <motion.div
        layoutId="viewPill"
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl"
        style={{
          left: value === 'passenger' ? 4 : 'calc(50% + 0px)',
          background: 'linear-gradient(135deg,rgba(0,240,255,0.16),rgba(112,0,255,0.16))',
          border: '1px solid rgba(0,240,255,0.35)',
          boxShadow: '0 0 16px rgba(0,240,255,0.25)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      />
      {options.map((opt) => {
        const Icon = opt.icon
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-colors ${
              active ? 'text-white' : 'text-white/45 hover:text-white/75'
            }`}
          >
            <Icon size={14} className={active ? 'text-[#00F0FF]' : ''} />
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function FairFareTicker() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">FairFare Breakdown</span>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-semibold text-white/60">
          {usd(FARE_TOTAL)} total
        </span>
      </div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          className="h-full rounded-l-full"
          style={{ background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)' }}
          initial={{ width: 0 }}
          animate={{ width: '88%' }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ background: 'linear-gradient(90deg,#8B3BFF,#7000FF)' }}
          initial={{ width: 0 }}
          animate={{ width: '12%' }}
          transition={{ duration: 1, delay: 0.15, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
        <span className="flex items-center gap-1.5 text-[#3DFFC2]">
          <span className="h-2 w-2 rounded-full bg-[#3DFFC2]" /> 88% Driver Payout
          <span className="text-white">{usd(FARE_TOTAL * DRIVER_PCT)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-[#A86BFF]">
          <span className="h-2 w-2 rounded-full bg-[#A86BFF]" /> 12% Platform Fee
          <span className="text-white">{usd(FARE_TOTAL * (1 - DRIVER_PCT))}</span>
        </span>
      </div>
    </div>
  )
}

function BottomNav() {
  const items = [
    { icon: Home, label: 'Home', active: true },
    { icon: Wallet, label: 'Wallet', active: false },
    { icon: Activity, label: 'Activity', active: false },
    { icon: User, label: 'Profile', active: false },
  ]
  return (
    <div className="relative z-30 glass-strong border-t border-white/8 px-6 pb-5 pt-2.5">
      <div className="flex items-center justify-between">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <button key={it.label} className="flex flex-col items-center gap-1">
              <Icon
                size={19}
                strokeWidth={2.2}
                className={it.active ? 'text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]' : 'text-white/35'}
              />
              <span className={`text-[9px] font-semibold ${it.active ? 'text-white/80' : 'text-white/30'}`}>
                {it.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mx-auto mt-2.5 h-1 w-28 rounded-full bg-white/15" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Passenger View                                                     */
/* ------------------------------------------------------------------ */

function PassengerView() {
  const [stage, setStage] = useState('home')
  const [destination, setDestination] = useState(null)
  const [prefs, setPrefs] = useState({ quiet: false, ac: true, express: false })
  const [ride, setRide] = useState('standard')
  const [eta, setEta] = useState(0)
  const [tip, setTip] = useState(null)
  const [customTip, setCustomTip] = useState('')
  const [rating, setRating] = useState(0)

  const ETA_MAX = 18
  const carProgress = stage === 'matched' ? 1 - eta / ETA_MAX : 0

  useEffect(() => {
    if (stage !== 'searching') return
    const t = setTimeout(() => setStage('matched'), 3000)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (stage !== 'matched') return
    setEta(ETA_MAX)
  }, [stage])

  useInterval(
    () => {
      if (stage !== 'matched') return
      setEta((e) => {
        if (e <= 1) {
          setStage('complete')
          return 0
        }
        return e - 1
      })
    },
    1000,
  )

  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }))

  const pickDestination = (d) => {
    setDestination(d)
    setStage('options')
  }

  const reset = () => {
    setStage('home')
    setDestination(null)
    setTip(null)
    setCustomTip('')
    setRating(0)
  }

  const totalTip = tip === 'custom' ? Math.max(0, Number(customTip) || 0) : tip || 0
  const etaMins = Math.max(1, Math.ceil((1 - carProgress) * 3))

  return (
    <div className="relative h-full">
      {/* map background */}
      <div className="absolute inset-0">
        <MapCanvas
          carProgress={stage === 'matched' ? carProgress : 0}
          radar={stage === 'searching'}
          showRoute={stage !== 'home'}
        />
        {stage === 'home' && (
          <div className="pointer-events-none absolute left-5 top-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black text-white"
              style={{ background: 'linear-gradient(135deg,#00F0FF,#7000FF)', boxShadow: '0 0 18px rgba(0,240,255,0.4)' }}>
              R
            </span>
            <div>
              <p className="text-[13px] font-extrabold leading-none tracking-wide text-white">RUSH</p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
                your city • live
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Home sheet */}
      <AnimatePresence mode="wait">
        {stage === 'home' && (
          <motion.div
            key="home"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <div className="glass mx-3 mb-3 rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3.5">
                <Search size={18} className="text-[#00F0FF]" />
                <span className="flex-1 text-left text-[13px] font-semibold text-white/45">
                  {destination ? destination.name : 'Where to, Rush user?'}
                </span>
                {destination && (
                  <span className="rounded-full bg-[#00F0FF]/15 px-2.5 py-1 text-[10px] font-bold text-[#3DFFC2]">
                    {destination.eta}
                  </span>
                )}
              </button>

              <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                Quick destinations
              </p>
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {DESTINATIONS.map((d) => {
                  const Icon = d.icon
                  return (
                    <button
                      key={d.name}
                      onClick={() => pickDestination(d)}
                      className="group flex min-w-[128px] flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:border-[#00F0FF]/40"
                    >
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: `${d.tint}1F`, color: d.tint, boxShadow: `0 0 12px ${d.tint}33` }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="text-[11px] font-semibold leading-tight text-white/85">{d.name}</span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-white/40">
                        <Clock size={10} /> {d.eta}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                One-tap ride preferences
              </p>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => {
                  const Icon = p.icon
                  const on = prefs[p.key]
                  return (
                    <button
                      key={p.key}
                      onClick={() => togglePref(p.key)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-semibold transition-all ${
                        on
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/15 text-white shadow-[0_0_14px_rgba(0,240,255,0.35)]'
                          : 'border-white/10 bg-white/[0.04] text-white/50'
                      }`}
                    >
                      <Icon size={13} className={on ? 'text-[#00F0FF]' : ''} /> {p.label}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => destination && setStage('options')}
                disabled={!destination}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-extrabold text-[#061018] transition-transform active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)',
                  boxShadow: '0 0 26px rgba(0,240,255,0.45)',
                }}
              >
                {destination ? `Rush me to ${destination.name}` : 'Choose a destination'} <ArrowRight size={17} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Options sheet */}
        {stage === 'options' && (
          <motion.div
            key="options"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="absolute inset-x-0 bottom-0 z-20"
          >
            <div className="glass mx-3 mb-3 rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
              <div className="mb-3 flex items-center gap-3">
                <button
                  onClick={() => setStage('home')}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white">{destination?.name}</p>
                  <p className="flex items-center gap-1 text-[11px] font-medium text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00F0FF]" /> 88 Circuit Blvd
                  </p>
                </div>
                <span className="rounded-full border border-[#3DFFC2]/30 bg-[#3DFFC2]/10 px-2.5 py-1 text-[10px] font-bold text-[#3DFFC2]">
                  Live prices
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {RIDES.map((r) => {
                  const Icon = r.icon
                  const active = ride === r.id
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRide(r.id)}
                      className={`relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        active
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/10 shadow-[0_0_20px_rgba(0,240,255,0.25)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          active ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-white/[0.06] text-white/60'
                        }`}
                      >
                        <Icon size={21} />
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2 text-[13px] font-bold text-white">
                          {r.name}
                          {r.featured && (
                            <span className="rounded-full bg-gradient-to-r from-[#00F0FF] to-[#7000FF] px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white">
                              Fastest
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[10.5px] font-medium text-white/45">
                          <Clock size={11} /> {r.eta} · {r.seats} seats · {r.desc}
                        </span>
                      </span>
                      <span className="text-[15px] font-extrabold text-white">{usd(r.price)}</span>
                      {active && (
                        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#3DFFC2] shadow-[0_0_8px_#3DFFC2]" />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="mt-3">
                <FairFareTicker />
              </div>

              <button
                onClick={() => setStage('searching')}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-extrabold text-white transition-transform active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#4770FF,#7000FF)',
                  boxShadow: '0 0 30px rgba(112,0,255,0.5), 0 0 18px rgba(0,240,255,0.3)',
                }}
              >
                Confirm Rush <Sparkles size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Searching overlay */}
      <AnimatePresence>
        {stage === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center"
          >
            <div className="glass-strong mx-6 flex w-full max-w-[300px] flex-col items-center rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/60">
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[#00F0FF]/25">
                <span className="absolute inset-0 rounded-full border border-[#00F0FF]/40 animate-pulse-ring" />
                <span
                  className="absolute inset-0 rounded-full border border-[#8B3BFF]/40 animate-pulse-ring"
                  style={{ animationDelay: '0.55s' }}
                />
                <Radio size={26} className="animate-spin text-[#00F0FF]" style={{ animationDuration: '2.2s' }} />
              </div>
              <p className="text-[14px] font-extrabold text-white">Matching you…</p>
              <p className="mt-1 text-center text-[11px] font-medium leading-relaxed text-white/50">
                Scanning {destination?.name} for the nearest local driver
              </p>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#00F0FF,#7000FF)' }}
                  initial={{ width: '8%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.6, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matched overlay */}
      <AnimatePresence>
        {stage === 'matched' && (
          <motion.div key="matched" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20">
            <div className="absolute left-0 right-0 top-4 flex justify-center px-6">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-strong flex items-center gap-2.5 rounded-full border border-[#00F0FF]/30 px-4 py-2 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00F0FF] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00F0FF]" />
                </span>
                <Timer size={14} className="text-[#3DFFC2]" />
                <span className="text-[12px] font-bold text-white">
                  {carProgress >= 0.9 ? 'Arriving now' : `${etaMins} min away`}
                </span>
                <span className="text-[10px] font-semibold text-white/40">{DRIVER.name}</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-x-0 bottom-0 z-10"
            >
              <div className="glass mx-3 mb-3 rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
                <div className="mb-3 flex items-center gap-3.5">
                  <Avatar size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[14px] font-extrabold text-white">
                      {DRIVER.name} <BadgeCheck size={15} className="text-[#00F0FF]" />
                    </p>
                    <p className="truncate text-[11.5px] font-medium text-white/55">{DRIVER.car}</p>
                    <p className="mt-0.5 flex items-center gap-2 text-[11px] font-semibold">
                      <span className="flex items-center gap-0.5 text-[#FFD166]">
                        <Star size={11} fill="#FFD166" /> {DRIVER.rating}
                      </span>
                      <span className="rounded-md border border-white/15 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-white/70">
                        {DRIVER.plate}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 py-3 text-[12px] font-bold text-[#3DFFC2] transition-transform active:scale-95">
                    <Phone size={15} /> Call Driver
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] py-3 text-[12px] font-bold text-white/80 transition-transform active:scale-95">
                    <MessageCircle size={15} /> Message
                  </button>
                </div>

                <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-white/45">
                    <span className="flex items-center gap-1"><MapPin size={11} className="text-[#00F0FF]" /> Pickup</span>
                    <span className="flex items-center gap-1"><Navigation size={11} className="text-[#8B3BFF]" /> {destination?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                      <motion.span
                        className="block h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#00F0FF,#8B3BFF)' }}
                        animate={{ width: `${carProgress * 100}%` }}
                        transition={{ ease: 'linear', duration: 1 }}
                      />
                    </span>
                    <span className="text-[10px] font-bold text-[#3DFFC2]">{Math.round(carProgress * 100)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete sheet */}
      <AnimatePresence>
        {stage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-end"
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="glass-strong mx-3 mb-3 w-full rounded-3xl border border-white/10 p-5 shadow-2xl shadow-black/60"
            >
              <div className="mb-4 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
                  className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg,rgba(0,240,255,0.25),rgba(61,255,194,0.25))',
                    border: '1px solid rgba(0,240,255,0.5)',
                    boxShadow: '0 0 26px rgba(0,240,255,0.4)',
                  }}
                >
                  <CircleCheck size={34} className="text-[#3DFFC2]" />
                </motion.div>
                <h3 className="text-[16px] font-extrabold text-white">Trip Complete</h3>
                <p className="mt-1 text-[11px] font-medium text-white/45">
                  {DRIVER.name} · {DRIVER.car} · {destination?.name}
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Receipt</span>
                  <span className="text-[10px] font-semibold text-[#3DFFC2]">FairFare transparent</span>
                </div>
                {[
                  ['Base fare + distance', usd(FARE_TOTAL)],
                  ['Driver payout (88%)', `−${usd(FARE_TOTAL * DRIVER_PCT)}`],
                  ['Platform fee (12%)', usd(FARE_TOTAL * (1 - DRIVER_PCT))],
                ].map(([k, v], i) => (
                  <div key={k} className="flex items-center justify-between py-1.5 text-[12px] font-semibold">
                    <span className="text-white/55">{k}</span>
                    <span className={i === 1 ? 'text-[#3DFFC2]' : 'text-white/85'}>{v}</span>
                  </div>
                ))}
                {totalTip > 0 && (
                  <div className="flex items-center justify-between py-1.5 text-[12px] font-semibold">
                    <span className="text-white/55">Driver tip</span>
                    <span className="text-[#FFD166]">+{usd(totalTip)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2.5">
                  <span className="text-[12px] font-bold text-white/70">You paid</span>
                  <span className="text-[17px] font-extrabold text-white">{usd(FARE_TOTAL + totalTip)}</span>
                </div>
              </div>

              <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Add a tip</p>
              <div className="flex gap-2">
                {[2, 5, 10, 'custom'].map((t) => {
                  const isCustom = t === 'custom'
                  const active = tip === t
                  return (
                    <button
                      key={t}
                      onClick={() => setTip(isCustom ? 'custom' : t)}
                      className={`flex-1 rounded-xl border py-2.5 text-[12px] font-bold transition-all ${
                        active
                          ? 'border-[#FFD166]/60 bg-[#FFD166]/15 text-[#FFD166] shadow-[0_0_14px_rgba(255,209,102,0.3)]'
                          : 'border-white/10 bg-white/[0.04] text-white/55'
                      }`}
                    >
                      {isCustom ? 'Custom' : `$${t}`}
                    </button>
                  )
                })}
              </div>
              {tip === 'custom' && (
                <div className="mt-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="Enter tip amount"
                    value={customTip}
                    onChange={(e) => setCustomTip(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[13px] font-semibold text-white outline-none focus:border-[#FFD166]/60"
                  />
                </div>
              )}

              <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Rate your trip</p>
              <div className="mb-4 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.8 }}
                    onClick={() => setRating(s)}
                    className="p-1"
                  >
                    <Star
                      size={30}
                      strokeWidth={1.6}
                      fill={s <= rating ? '#FFD166' : 'transparent'}
                      stroke={s <= rating ? '#FFD166' : 'rgba(255,255,255,0.25)'}
                      style={s <= rating ? { filter: 'drop-shadow(0 0 8px rgba(255,209,102,0.8))' } : undefined}
                    />
                  </motion.button>
                ))}
              </div>

              <button
                onClick={reset}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[14px] font-extrabold text-[#061018] transition-transform active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(90deg,#00F0FF,#3DFFC2)',
                  boxShadow: '0 0 26px rgba(0,240,255,0.45)',
                }}
              >
                Done <Check size={17} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Driver View                                                        */
/* ------------------------------------------------------------------ */

function DriverView() {
  const [online, setOnline] = useState(false)
  const [request, setRequest] = useState(null)
  const [remaining, setRemaining] = useState(10)
  const [trip, setTrip] = useState(null)
  const [tripProgress, setTripProgress] = useState(0)
  const [earnings, setEarnings] = useState({ amount: 184.5, rides: 7 })
  const [toast, setToast] = useState(null)
  const onlineRef = useRef(false)
  const timerRef = useRef(null)
  const finishingRef = useRef(false)

  useEffect(() => {
    onlineRef.current = online
  }, [online])

  const scheduleRequest = useCallback((delay = 2400) => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (onlineRef.current) setRequest(makeRequest())
    }, delay)
    return timerRef.current
  }, [])

  useEffect(() => {
    if (!online) {
      clearTimeout(timerRef.current)
      setRequest(null)
      setTrip(null)
      return
    }
    scheduleRequest()
  }, [online, scheduleRequest])

  useEffect(() => {
    if (!request) return
    setRemaining(10)
    const start = Date.now()
    const id = setInterval(() => {
      const left = Math.max(0, 10 - Math.floor((Date.now() - start) / 1000))
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        setRequest(null)
        scheduleRequest(3600)
      }
    }, 200)
    return () => clearInterval(id)
  }, [request, scheduleRequest])

  const accept = () => {
    setTrip(request)
    setRequest(null)
    setTripProgress(0)
  }

  useEffect(() => {
    if (!trip) {
      finishingRef.current = false
      return
    }
    const start = Date.now()
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 15000)
      setTripProgress(p)
      if (p >= 1 && !finishingRef.current) {
        finishingRef.current = true
        finishTrip()
      }
    }, 100)
    return () => clearInterval(id)
  }, [trip, finishTrip])

  const finishTrip = useCallback(() => {
    setEarnings((e) => ({ amount: e.amount + 21.12, rides: e.rides + 1 }))
    setTrip(null)
    setToast('Trip completed • +$21.12 added')
    const id = setTimeout(() => setToast(null), 3000)
    scheduleRequest(4200)
    return () => clearTimeout(id)
  }, [scheduleRequest])

  const RING_R = 30
  const RING_C = 2 * Math.PI * RING_R
  const ringOffset = RING_C * (1 - remaining / 10)

  return (
    <div className="relative h-full overflow-y-auto no-scrollbar">
      <div className="absolute inset-0">
        <MapCanvas carProgress={tripProgress} showRoute={Boolean(trip)} />
      </div>

      <div className="relative z-10 min-h-full p-3">
        {/* Status switch + earnings */}
        <div className="glass rounded-3xl border border-white/10 p-4 shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Operator status</p>
              <p className={`mt-1 text-[15px] font-extrabold ${online ? 'text-[#3DFFC2]' : 'text-white/60'}`}>
                {online ? 'Online & earning' : 'Offline'}
              </p>
            </div>
            <button
              onClick={() => setOnline((o) => !o)}
              className={`relative h-8 w-14 rounded-full border transition-all ${
                online ? 'border-[#3DFFC2]/50 bg-[#3DFFC2]/20 shadow-[0_0_18px_rgba(61,255,194,0.4)]' : 'border-white/15 bg-white/[0.06]'
              }`}
            >
              <motion.span
                className="absolute top-1 h-6 w-6 rounded-full"
                animate={{ left: online ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                  background: online ? 'linear-gradient(135deg,#3DFFC2,#00F0FF)' : 'rgba(255,255,255,0.35)',
                  boxShadow: online ? '0 0 12px rgba(61,255,194,0.8)' : 'none',
                }}
              />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="flex items-center gap-1 text-[#3DFFC2]">
                <CircleDollarSign size={13} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Today</span>
              </div>
              <p className="mt-1.5 text-[17px] font-extrabold text-white">{usd(earnings.amount)}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="flex items-center gap-1 text-[#00F0FF]">
                <TrendingUp size={13} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Rides</span>
              </div>
              <p className="mt-1.5 text-[17px] font-extrabold text-white">{earnings.rides}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="flex items-center gap-1 text-[#8B3BFF]">
                <Gauge size={13} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Rate</span>
              </div>
              <p className="mt-1.5 text-[17px] font-extrabold text-white">88%</p>
            </div>
          </div>
        </div>

        {/* Idle listening state */}
        {online && !request && !trip && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-3 flex items-center gap-3 rounded-3xl border border-[#00F0FF]/20 p-4"
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-[#00F0FF]/50 animate-pulse-ring" />
              <span
                className="absolute inset-0 rounded-full border border-[#8B3BFF]/50 animate-pulse-ring"
                style={{ animationDelay: '0.6s' }}
              />
              <Radio size={18} className="text-[#00F0FF]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Listening for nearby requests…</p>
              <p className="text-[10.5px] font-medium text-white/45">Average 3.2s match time in your zone</p>
            </div>
          </motion.div>
        )}

        {/* Offline state */}
        {!online && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass mt-3 flex flex-col items-center rounded-3xl border border-white/10 p-6 text-center"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <ShieldCheck size={24} className="text-[#00F0FF]" />
            </div>
            <p className="text-[14px] font-extrabold text-white">Go online to start earning</p>
            <p className="mt-1 max-w-[230px] text-[11px] font-medium leading-relaxed text-white/45">
              Rush keeps 12% per ride. You keep 88%. Instant payouts after every trip.
            </p>
          </motion.div>
        )}

        {/* Incoming request */}
        <AnimatePresence>
          {request && !trip && (
            <motion.div
              key={`req-${request.id}`}
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="glass-strong mt-3 rounded-3xl border border-[#00F0FF]/30 p-4 shadow-[0_0_30px_rgba(0,240,255,0.18)]"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#00F0FF]/15 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#00F0FF]">
                    New trip request
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-white/45">
                    <Clock size={11} /> {request.distance} away
                  </span>
                </div>
                <div className="relative flex h-16 w-16 items-center justify-center">
                  <svg width="64" height="64" className="-rotate-90">
                    <circle cx="32" cy="32" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle
                      cx="32"
                      cy="32"
                      r={RING_R}
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={ringOffset}
                      style={{ filter: 'drop-shadow(0 0 5px #00F0FF)', transition: 'stroke-dashoffset 0.2s linear' }}
                    />
                  </svg>
                  <span className="absolute text-[15px] font-extrabold text-white">{remaining}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00F0FF]/15">
                    <MapPin size={18} className="text-[#00F0FF]" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-white">Pickup · {request.pickup}</p>
                    <p className="text-[10.5px] font-medium text-white/45">Dropoff · {request.destination}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between rounded-2xl border border-[#3DFFC2]/25 bg-[#3DFFC2]/[0.06] p-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Estimated earnings</p>
                  <p className="text-[22px] font-extrabold text-[#3DFFC2]">{usd(request.fare)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Payout</p>
                  <p className="text-[13px] font-bold text-white">88% · {request.minutes} min trip</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setRequest(null)
                    scheduleRequest(3200)
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] py-3.5 text-[13px] font-bold text-white/70 transition-transform active:scale-95"
                >
                  <X size={15} /> Decline
                </button>
                <button
                  onClick={accept}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-3.5 text-[13px] font-extrabold text-[#04140F] transition-transform active:scale-95"
                  style={{
                    background: 'linear-gradient(90deg,#3DFFC2,#00F0FF)',
                    boxShadow: '0 0 22px rgba(61,255,194,0.5)',
                  }}
                >
                  <Check size={15} /> Accept Rush
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active trip */}
        <AnimatePresence>
          {trip && (
            <motion.div
              key={`trip-${trip.id}`}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="glass-strong mt-3 rounded-3xl border border-white/10 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-[#00F0FF]/15 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#00F0FF]">
                  On trip · {Math.max(1, Math.ceil((1 - tripProgress) * 15))} secs
                </span>
                <span className="text-[10px] font-semibold text-white/45">Earnings locked</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <Avatar size={40} />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-white">Heading to {trip.destination}</p>
                  <p className="text-[10.5px] font-medium text-white/45">{DRIVER.car} · {DRIVER.plate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">This trip</p>
                  <p className="text-[16px] font-extrabold text-[#3DFFC2]">{usd(trip.fare)}</p>
                </div>
              </div>
              <button
                onClick={finishTrip}
                className="mt-3 w-full rounded-xl border border-[#3DFFC2]/40 bg-[#3DFFC2]/10 py-3 text-[13px] font-bold text-[#3DFFC2] transition-transform active:scale-95"
              >
                Complete Trip
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="absolute left-0 right-0 top-4 z-40 flex justify-center px-6"
          >
            <div className="glass-strong flex items-center gap-2 rounded-full border border-[#3DFFC2]/40 px-4 py-2.5 shadow-[0_0_20px_rgba(61,255,194,0.3)]">
              <CircleCheck size={15} className="text-[#3DFFC2]" />
              <span className="text-[12px] font-bold text-white">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function Header({ view, setView }) {
  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-white/8 px-4 pb-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black text-white"
            style={{ background: 'linear-gradient(135deg,#00F0FF,#7000FF)', boxShadow: '0 0 18px rgba(0,240,255,0.4)' }}
          >
            R
          </span>
          <div>
            <p className="text-[13px] font-extrabold leading-none tracking-wide text-white">RUSH</p>
            <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.22em] text-[#3DFFC2]">
              <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#3DFFC2] align-middle" />
              investor demo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold text-white/55 sm:block">
            {view === 'passenger' ? 'Rider' : 'Driver'} ID · R-4482
          </span>
          <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/70">
            <Bell size={15} />
          </button>
        </div>
      </div>
      <div className="mt-2.5">
        <SegmentToggle value={view} onChange={setView} />
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------ */
/*  Desktop investor panel                                             */
/* ------------------------------------------------------------------ */

function InvestorPanel({ view, setView }) {
  const stats = [
    { icon: CircleDollarSign, value: '$21.12', label: 'avg. driver payout', tint: '#3DFFC2' },
    { icon: TrendingUp, value: '88%', label: 'driver take-rate', tint: '#00F0FF' },
    { icon: Zap, value: '3.2s', label: 'match time', tint: '#8B3BFF' },
  ]
  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="hidden w-[380px] lg:block">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-[#3DFFC2]/40 bg-[#3DFFC2]/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#3DFFC2]">
          Series A · Investor Demo
        </span>
      </div>
      <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white">
        Rideshare,
        <br />
        <span className="text-gradient">reimagined.</span>
      </h1>
      <p className="mt-4 max-w-[340px] text-[14px] font-medium leading-relaxed text-white/55">
        A next-generation mobility marketplace. Real-time matching, transparent pricing, and the highest driver payout in
        the industry — all in one tap.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="glass flex items-center gap-3.5 rounded-2xl border border-white/10 p-4">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${s.tint}1A`, color: s.tint, boxShadow: `0 0 16px ${s.tint}33` }}
              >
                <Icon size={20} />
              </span>
              <div>
                <p className="text-[19px] font-extrabold text-white">{s.value}</p>
                <p className="text-[11px] font-semibold text-white/45">{s.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-center gap-3 text-[12px] font-semibold text-white/40">
        <ShieldCheck size={16} className="text-[#00F0FF]" />
        <p>
          Tap <span className="text-white/80">{view === 'passenger' ? 'Driver' : 'Passenger'}</span> on the phone to flip
          the experience live.
        </p>
        <button onClick={() => setView(view === 'passenger' ? 'driver' : 'passenger')} className="ml-auto rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-[11px] font-bold text-[#00F0FF]">
          Flip
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Phone frame                                                        */
/* ------------------------------------------------------------------ */

function PhoneFrame({ view, setView }) {
  return (
    <div className="relative h-[100dvh] w-full max-h-none sm:h-[820px] sm:max-h-[calc(100vh-64px)] sm:w-[410px]">
      {/* glow backdrop */}
      <div
        className="pointer-events-none absolute -inset-6 hidden rounded-[3.5rem] opacity-40 blur-3xl sm:block"
        style={{ background: 'linear-gradient(160deg,rgba(0,240,255,0.35),rgba(112,0,255,0.35))' }}
      />
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-void shadow-2xl shadow-black/80 sm:rounded-[2.6rem] sm:border sm:border-white/15">
        <StatusBar />
        <Header view={view} setView={setView} />
        <main className="relative flex-1 overflow-hidden">
          <div className="h-full w-full" style={view === 'passenger' ? undefined : { display: 'none' }}>
            <PassengerView />
          </div>
          <div className="h-full w-full" style={view === 'driver' ? undefined : { display: 'none' }}>
            <DriverView />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [view, setView] = useState('passenger')

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      {/* ambient desktop background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div
          className="absolute -left-40 top-0 h-[560px] w-[560px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle,#00F0FF,transparent 65%)' }}
        />
        <div
          className="absolute -right-40 bottom-0 h-[620px] w-[620px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle,#7000FF,transparent 65%)' }}
        />
        <div className="absolute left-1/3 top-1/4 h-[320px] w-[320px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle,#3DFFC2,transparent 65%)' }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center gap-14 p-0 sm:px-6 sm:py-8">
        <InvestorPanel view={view} setView={setView} />
        <PhoneFrame view={view} setView={setView} />
      </div>
    </div>
  )
}
