import React, { useState, useMemo, useRef, useEffect, Component } from 'react'
import { Layers, Compass, LocateFixed, Eye, RefreshCw, AlertTriangle } from 'lucide-react'

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0))

/**
 * Class Error Boundary to catch any unexpected map rendering/SVG errors
 */
class MapErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('MapEngine caught rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-[#0A0D15] text-white">
          <AlertTriangle className="h-10 w-10 text-[#38BDF8] mb-3 animate-pulse" />
          <h4 className="text-sm font-bold">Map Engine Re-initializing</h4>
          <p className="mt-1 text-xs text-white/50 max-w-[240px]">
            Recovering vector view state automatically...
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 flex items-center gap-2 rounded-xl bg-[#38BDF8]/20 border border-[#38BDF8]/40 px-4 py-2 text-xs font-bold text-[#38BDF8] hover:bg-[#38BDF8]/30 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload View
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function MapEngineContent({
  carProgress = 0,
  radar = false,
  showRoute = false,
  pickupCoords = { x: 80, y: 360 },
  dropoffCoords = { x: 322, y: 92 },
  onMapClick,
}) {
  const [mapMode, setMapMode] = useState('cyber') // 'cyber' | 'real'
  const [iframeStatus, setIframeStatus] = useState('loading') // 'loading' | 'loaded' | 'error'
  const routeRef = useRef(null)
  const [len, setLen] = useState(0)

  // Defensive sanitization of pickup/dropoff coordinates
  const safePickup = useMemo(() => ({
    x: Number.isFinite(Number(pickupCoords?.x)) ? Number(pickupCoords.x) : 80,
    y: Number.isFinite(Number(pickupCoords?.y)) ? Number(pickupCoords.y) : 360,
  }), [pickupCoords?.x, pickupCoords?.y])

  const safeDropoff = useMemo(() => ({
    x: Number.isFinite(Number(dropoffCoords?.x)) ? Number(dropoffCoords.x) : 322,
    y: Number.isFinite(Number(dropoffCoords?.y)) ? Number(dropoffCoords.y) : 92,
  }), [dropoffCoords?.x, dropoffCoords?.y])

  // Calculated mathematical distance fallback for SVG total length
  const fallbackLen = useMemo(() => {
    const dx = safeDropoff.x - safePickup.x
    const dy = safeDropoff.y - safePickup.y
    return Math.hypot(dx, dy) * 1.3
  }, [safePickup, safeDropoff])

  // Dynamic bezier path string generated between pickupCoords and dropoffCoords
  const routePath = useMemo(() => {
    const { x: x1, y: y1 } = safePickup
    const { x: x2, y: y2 } = safeDropoff
    const cx1 = x1 + (x2 - x1) * 0.3
    const cy1 = y1 - 80
    const cx2 = x1 + (x2 - x1) * 0.7
    const cy2 = y2 + 60
    return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`
  }, [safePickup, safeDropoff])

  // Update SVG total path length safely
  useEffect(() => {
    const el = routeRef.current
    if (el && typeof el.getTotalLength === 'function') {
      try {
        const l = el.getTotalLength()
        if (Number.isFinite(l) && l > 0) {
          setLen(l)
          return
        }
      } catch (err) {
        console.warn('SVG getTotalLength warning:', err)
      }
    }
    setLen(fallbackLen)
  }, [routePath, fallbackLen, showRoute])

  // Network preflight check for Real Map view.
  // A blocked/reset connection to a cross-origin host still lets the iframe
  // fire `onLoad` (the browser "loads" its own internal error page) — same-origin
  // policy also blocks us from inspecting that page afterwards to tell the
  // difference. So instead of trusting the iframe's own load events, probe
  // reachability with a real fetch() first: a blocked network genuinely
  // rejects the fetch promise, which lets us skip ever mounting the iframe
  // and show the offline Cyber Grid fallback instead of a blank/black pane.
  useEffect(() => {
    if (mapMode !== 'real') return
    setIframeStatus('loading')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)

    fetch('https://tile.openstreetmap.org/0/0/0.png', { mode: 'no-cors', signal: controller.signal })
      .then(() => setIframeStatus('loaded'))
      .catch(() => setIframeStatus('error'))
      .finally(() => clearTimeout(timer))

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [mapMode])

  // Interpolated car position along Bezier route with math fallback
  const carPos = useMemo(() => {
    const prog = clamp01(carProgress)
    if (routeRef.current && len > 0 && typeof routeRef.current.getPointAtLength === 'function') {
      try {
        const p = routeRef.current.getPointAtLength(len * prog)
        if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
          return { x: p.x, y: p.y }
        }
      } catch {
        // Fallback to math linear interpolation below
      }
    }
    return {
      x: safePickup.x + (safeDropoff.x - safePickup.x) * prog,
      y: safePickup.y + (safeDropoff.y - safePickup.y) * prog,
    }
  }, [carProgress, len, safePickup, safeDropoff])

  const handleSvgClick = (e) => {
    if (!onMapClick) return
    try {
      const svg = e.currentTarget
      const rect = svg.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = Math.round(Math.max(10, Math.min(390, ((e.clientX - rect.left) / rect.width) * 400)))
      const y = Math.round(Math.max(10, Math.min(460, ((e.clientY - rect.top) / rect.height) * 470)))
      onMapClick({ x, y })
    } catch (err) {
      console.warn('Map click handler error:', err)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#0A0D15] select-none">
      {/* Map layer toggle — a single unobtrusive icon button, like the layer
          switcher on Google/Apple Maps, rather than a labeled mode pill. */}
      <button
        onClick={() => setMapMode(mapMode === 'cyber' ? 'real' : 'cyber')}
        title={mapMode === 'cyber' ? 'Switch to Real Map' : 'Switch to Cyber Grid'}
        className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/80 backdrop-blur-md transition-colors hover:text-white active:scale-95"
      >
        {mapMode === 'cyber' ? <Compass size={15} /> : <Layers size={15} />}
      </button>

      {mapMode === 'cyber' ? (
        <svg
          viewBox="0 0 400 470"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full cursor-crosshair select-none touch-none"
          onClick={handleSvgClick}
          role="img"
          aria-label="Interactive cyber city map"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <radialGradient id="glowCyan" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="glowViolet" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="vignette" cx="50%" cy="45%" r="75%">
              <stop offset="55%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect width="400" height="470" fill="#0A0D15" />
          <ellipse cx="330" cy="60" rx="260" ry="200" fill="url(#glowViolet)" />
          <ellipse cx="60" cy="400" rx="240" ry="190" fill="url(#glowCyan)" />

          {/* Street Grid */}
          <g stroke="#33456B" strokeLinecap="round">
            <line x1="0" y1="120" x2="400" y2="120" strokeWidth="7" />
            <line x1="0" y1="200" x2="400" y2="200" strokeWidth="9" />
            <line x1="0" y1="280" x2="400" y2="280" strokeWidth="6" />
            <line x1="0" y1="360" x2="400" y2="360" strokeWidth="8" />
            <line x1="0" y1="440" x2="400" y2="440" strokeWidth="5" />
            <line x1="80" y1="0" x2="80" y2="470" strokeWidth="7" />
            <line x1="170" y1="0" x2="170" y2="470" strokeWidth="6" />
            <line x1="250" y1="0" x2="250" y2="470" strokeWidth="9" />
            <line x1="340" y1="0" x2="340" y2="470" strokeWidth="6" />
          </g>

          {/* City Blocks */}
          <g fill="#151F32" stroke="#35486E" strokeWidth="1.5">
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

          {/* Fine Grid Overlay */}
          <g stroke="#2C3E5F" strokeWidth="0.6" opacity="0.6">
            {Array.from({ length: 19 }).map((_, i) => (
              <line key={`v${i}`} x1={20 + i * 20} y1="0" x2={20 + i * 20} y2="470" />
            ))}
            {Array.from({ length: 22 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={20 + i * 20} x2="400" y2={20 + i * 20} />
            ))}
          </g>

          {/* Route path */}
          {showRoute && (
            <g>
              <path
                d={routePath}
                fill="none"
                stroke="#26334D"
                strokeWidth="6"
                strokeLinecap="round"
                opacity="0.65"
              />
              <path d={routePath} ref={routeRef} fill="none" stroke="transparent" />
              <path
                d={routePath}
                fill="none"
                stroke="url(#routeGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={len ? `${len * clamp01(carProgress)} ${len}` : '0 1000'}
                style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.85))' }}
              />
            </g>
          )}

          {/* Pickup Pin */}
          <g transform={`translate(${safePickup.x},${safePickup.y})`}>
            <circle r="30" fill="#38BDF8" opacity="0.12">
              <animate attributeName="r" values="12;32" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle r="12" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.55" />
            <circle r="5" fill="#38BDF8" style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }} />
          </g>

          {/* Dropoff Pin */}
          {showRoute && (
            <g transform={`translate(${safeDropoff.x},${safeDropoff.y})`}>
              <circle r="26" fill="#818CF8" opacity="0.15">
                <animate attributeName="r" values="10;28" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0" dur="2.8s" begin="0.6s" repeatCount="indefinite" />
              </circle>
              <rect
                x="-6"
                y="-6"
                width="12"
                height="12"
                rx="2.5"
                fill="#A86BFF"
                transform="rotate(45)"
                style={{ filter: 'drop-shadow(0 0 6px #818CF8)' }}
              />
            </g>
          )}

          {/* Radar Scan */}
          {radar && (
            <g transform={`translate(${safePickup.x},${safePickup.y})`}>
              {[0, 1, 2].map((i) => (
                <circle key={i} r="6" fill="none" stroke="#38BDF8" strokeWidth="1.4">
                  <animate attributeName="r" values="6;54" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.85;0" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
                </circle>
              ))}
            </g>
          )}

          {/* Live Vehicle */}
          {carPos && (
            <g transform={`translate(${carPos.x},${carPos.y})`}>
              <circle r="11" fill="#38BDF8" opacity="0.25" />
              <rect
                x="-7"
                y="-5"
                width="14"
                height="10"
                rx="3.5"
                fill="#0A0D15"
                stroke="#38BDF8"
                strokeWidth="1.8"
                style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.95))' }}
              />
            </g>
          )}

          <rect width="400" height="470" fill="url(#vignette)" />
        </svg>
      ) : (
        /* Real Map OpenStreetMap Dark Mode Frame with Load Protection */
        <div className="relative h-full w-full bg-[#0A0D15]">
          {/* Status content is anchored near the top, not vertically centered —
              the pickup/destination card floats over the lower half of the
              map, so anything centered in the full-height container would be
              rendered invisibly behind it. */}
          {iframeStatus === 'loading' && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-20 bg-[#0A0D15] text-white">
              <div className="h-7 w-7 rounded-full border-2 border-[#34D399] border-t-transparent animate-spin mb-2" />
              <span className="text-[11px] font-medium text-white/70">Connecting OpenStreetMap...</span>
            </div>
          )}

          {iframeStatus === 'error' ? (
            <div className="flex h-full w-full flex-col items-center justify-start pt-16 p-6 text-center text-white">
              <AlertTriangle className="h-8 w-8 text-[#34D399] mb-2" />
              <p className="text-xs font-bold">Real Map Unavailable</p>
              <p className="text-[11px] text-white/70 mt-1 max-w-[200px]">
                Network connection restricted. Switched to offline Cyber Grid engine.
              </p>
              <button
                onClick={() => setMapMode('cyber')}
                className="mt-3 rounded-xl bg-[#34D399] px-3.5 py-1.5 text-xs font-bold text-black shadow-lg"
              >
                Use Cyber Grid Engine
              </button>
            </div>
          ) : (
            <iframe
              title="Real Map View"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-122.435%2C37.765%2C-122.395%2C37.795&amp;layer=mapnik"
              className="h-full w-full invert contrast-[1.25] hue-rotate-180 brightness-[0.7]"
              onError={() => setIframeStatus('error')}
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-[#0A0D15]/40 backdrop-contrast-125" />
          <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-[#34D399]/30 bg-black/75 px-3 py-1.5 text-[11px] font-bold text-[#34D399]">
            <LocateFixed size={14} /> Live OpenStreetMap Tracking Active
          </div>
        </div>
      )}

      {/* Tap hint overlay */}
      {onMapClick && mapMode === 'cyber' && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[9.5px] font-medium text-white/50 backdrop-blur-md">
          <Eye size={10} className="text-[#38BDF8]" /> Tap map to place pins
        </div>
      )}
    </div>
  )
}

export default function MapEngine(props) {
  return (
    <MapErrorBoundary>
      <MapEngineContent {...props} />
    </MapErrorBoundary>
  )
}

