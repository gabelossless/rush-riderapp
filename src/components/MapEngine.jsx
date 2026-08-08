import React, { useState, useMemo, useRef, useEffect, Component } from 'react'
import { Map as MapLibreMap, Marker, NavigationControl, AttributionControl, LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { AlertTriangle, Eye, LocateFixed, RefreshCw } from 'lucide-react'
import { SURGE_ZONES } from '../data/mockData'

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0))

const DENVER_CENTER = { lat: 39.7392, lng: -104.9903 }
const COLORADO_BOUNDS = [
  [-109.1, 36.9],
  [-102.0, 41.0],
]
const FLEET_COUNT = 40
const OSRM_BASE = 'https://router.project-osrm.org'
const STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord'

/* ------------------------------------------------------------------ */
/*  Error boundary — catches any map/WebGL crash and offers recovery   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

function cumulativeDistances(coords) {
  const cum = [0]
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1]
    const [lng2, lat2] = coords[i]
    cum.push(cum[i - 1] + Math.hypot(lng2 - lng1, lat2 - lat1))
  }
  return cum
}

function pointAtFraction(coords, cum, fraction) {
  if (!coords || coords.length === 0) return null
  if (coords.length === 1 || !cum) return coords[0]
  const total = cum[cum.length - 1] || 1
  const target = total * clamp01(fraction)
  for (let i = 1; i < cum.length; i++) {
    if (cum[i] >= target) {
      const seg = cum[i] - cum[i - 1] || 1
      const f = (target - cum[i - 1]) / seg
      const a = coords[i - 1]
      const b = coords[i]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
  }
  return coords[coords.length - 1]
}

function makeMarkerEl(innerHtml, className) {
  const el = document.createElement('div')
  el.className = className
  el.innerHTML = innerHtml
  return el
}

/* ------------------------------------------------------------------ */
/*  Main map component                                                 */
/* ------------------------------------------------------------------ */

function MapEngineContent({
  carProgress = 0,
  radar = false,
  showRoute = false,
  pickupCoords = null,
  dropoffCoords = null,
  onMapClick,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [mapState, setMapState] = useState('loading') // loading | ready | error
  const [showFocusDenver, setShowFocusDenver] = useState(false)
  const [routeVersion, setRouteVersion] = useState(0)

  const routeGeoRef = useRef(null)
  const routeCumRef = useRef(null)
  const pickupMarkerRef = useRef(null)
  const dropoffMarkerRef = useRef(null)
  const carMarkerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const radarMarkerRef = useRef(null)
  const surgeMarkersRef = useRef([])
  const fleetRef = useRef(null)
  const gpsDoneRef = useRef(false)

  const pickupKey = pickupCoords ? `${pickupCoords.lat},${pickupCoords.lng}` : ''
  const dropoffKey = dropoffCoords ? `${dropoffCoords.lat},${dropoffCoords.lng}` : ''

  /* ---------- Map creation ---------- */
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let map = null
    try {
      map = new MapLibreMap({
        container,
        style: STYLE_URL,
        center: [DENVER_CENTER.lng, DENVER_CENTER.lat],
        zoom: 11.5,
        attributionControl: false,
        fadeDuration: 120,
      })
      mapRef.current = map
    } catch (err) {
      console.error('WebGL/MapLibre init failed:', err)
      setMapState('error')
      return
    }

    map.addControl(new NavigationControl({ showCompass: false }), 'top-left')
    map.addControl(
      new AttributionControl({ compact: true }),
      'bottom-right'
    )

    map.on('load', () => {
      // Route layers (hidden until data arrives)
      map.addSource('route', {
        type: 'geojson',
        lineMetrics: true,
        data: { type: 'Feature', geometry: null, properties: {} },
      })
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 9,
          'line-opacity': 0.18,
          'line-cap': 'round',
        },
      })
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-width': 4,
          'line-gradient': [
            'interpolate',
            ['linear'],
            ['line-progress'],
            0,
            '#38BDF8',
            1,
            '#818CF8',
          ],
          'line-cap': 'round',
        },
      })

      // Phase 2 — live fleet layer
      map.addSource('fleet', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'fleet',
        type: 'circle',
        source: 'fleet',
        paint: {
          'circle-radius': 3.5,
          'circle-color': '#38BDF8',
          'circle-opacity': 0.55,
          'circle-blur': 0.15,
        },
      })

      // Pickup / dropoff / car DOM markers
      pickupMarkerRef.current = new Marker({
        element: makeMarkerEl(
          '<span class="rush-marker-dot"></span><span class="rush-marker-ring"></span>',
          'rush-marker pickup'
        ),
      }).setLngLat([DENVER_CENTER.lng, DENVER_CENTER.lat]).addTo(map)

      dropoffMarkerRef.current = new Marker({
        element: makeMarkerEl('<span class="rush-marker-square"></span>', 'rush-marker dropoff'),
      }).setLngLat([DENVER_CENTER.lng, DENVER_CENTER.lat]).addTo(map)

      carMarkerRef.current = new Marker({
        element: makeMarkerEl('<span class="rush-car-dot"></span>', 'rush-car'),
      }).setLngLat([DENVER_CENTER.lng, DENVER_CENTER.lat]).addTo(map)

      // Surge zones — pulsing warm rings (Phase 2)
      SURGE_ZONES.forEach((z) => {
        const m = new Marker({
          element: makeMarkerEl(
            '<span class="rush-surge-ring"></span><span class="rush-surge-core"></span>',
            'rush-surge'
          ),
        })
          .setLngLat([z.latlng.lng, z.latlng.lat])
          .addTo(map)
        surgeMarkersRef.current.push(m)
      })

      setMapState('ready')
    })

    map.on('error', () => {
      // Tolerate style/tile hiccups briefly; hard-fail only if the style
      // itself cannot load (offline / blocked network).
      if (!map.loaded() && mapStateRef.current === 'loading') {
        setMapState('error')
      }
    })

    return () => {
      try {
        map.remove()
      } catch {
        /* noop */
      }
      mapRef.current = null
      gpsDoneRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Stable read of mapState inside the map error handler
  const mapStateRef = useRef(mapState)
  useEffect(() => {
    mapStateRef.current = mapState
  }, [mapState])

  /* ---------- Loading watchdog ---------- */
  // On some networks (blocked/rate-limited third-party tile host, flaky
  // cellular, content blockers) the style never fires 'load' *or* 'error' —
  // it just hangs. Without a timeout the user is stuck on the spinner
  // forever even though a fully working offline map is one state away.
  useEffect(() => {
    if (mapState !== 'loading') return
    const timeout = setTimeout(() => {
      if (mapStateRef.current === 'loading') {
        console.warn('MapLibre style did not load in time — falling back to offline map')
        setMapState('error')
      }
    }, 8000)
    return () => clearTimeout(timeout)
  }, [mapState])

  const map = mapRef.current

  /* ---------- Tap-to-pin ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready') return
    const handler = (e) => {
      if (!onMapClick) return
      onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    }
    map.on('click', handler)
    return () => map.off('click', handler)
  }, [map, mapState, onMapClick])

  /* ---------- GPS boot ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready' || gpsDoneRef.current) return
    gpsDoneRef.current = true

    if (!navigator.geolocation) {
      setShowFocusDenver(true)
      map.fitBounds(COLORADO_BOUNDS, { duration: 1800, padding: 40 })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        map.flyTo({ center: [longitude, latitude], zoom: 12.5, duration: 1800 })
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude])
        } else {
          userMarkerRef.current = new Marker({
            element: makeMarkerEl('<span class="rush-user-dot"></span>', 'rush-user'),
          })
            .setLngLat([longitude, latitude])
            .addTo(map)
        }
      },
      () => {
        // GPS denied/unavailable — Colorado-wide reveal with a focus pill
        setShowFocusDenver(true)
        map.fitBounds(COLORADO_BOUNDS, { duration: 1800, padding: 40 })
      },
      { timeout: 4000, maximumAge: 60000 }
    )
  }, [map, mapState])

  const focusDenver = () => {
    if (!map) return
    setShowFocusDenver(false)
    map.flyTo({ center: [DENVER_CENTER.lng, DENVER_CENTER.lat], zoom: 11.5, duration: 1400 })
  }

  /* ---------- Route fetching (OSRM) ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready') return
    if (!showRoute || !pickupCoords || !dropoffCoords) {
      if (map.getSource('route')) {
        map.getSource('route').setData({ type: 'Feature', geometry: null, properties: {} })
      }
      routeGeoRef.current = null
      routeCumRef.current = null
      setRouteVersion((v) => v + 1)
      return
    }

    const { lat: pLat, lng: pLng } = pickupCoords
    const { lat: dLat, lng: dLng } = dropoffCoords
    const controller = new AbortController()
    const url = `${OSRM_BASE}/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`

    fetch(url, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('OSRM ' + r.status))))
      .then((data) => {
        if (!data || data.code !== 'Ok' || !data.routes?.length) return
        const geometry = data.routes[0].geometry
        if (!geometry?.coordinates?.length) return
        routeGeoRef.current = geometry
        routeCumRef.current = cumulativeDistances(geometry.coordinates)
        map.getSource('route')?.setData({ type: 'Feature', geometry, properties: {} })

        // Fit the route into view
        const bounds = new LngLatBounds()
        geometry.coordinates.forEach((c) => bounds.extend(c))
        map.fitBounds(bounds, { padding: 70, duration: 900, maxZoom: 13.5 })
        setRouteVersion((v) => v + 1)
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        console.warn('OSRM route fetch failed:', err)
      })

    return () => controller.abort()
  }, [map, mapState, showRoute, pickupKey, dropoffKey]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Marker positions ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready') return
    if (pickupCoords) pickupMarkerRef.current?.setLngLat([pickupCoords.lng, pickupCoords.lat])
    const dropEl = dropoffMarkerRef.current?.getElement()
    const carEl = carMarkerRef.current?.getElement()
    if (dropoffCoords && showRoute) {
      dropoffMarkerRef.current?.setLngLat([dropoffCoords.lng, dropoffCoords.lat])
      if (dropEl) dropEl.style.display = 'block'
    } else if (dropEl) {
      dropEl.style.display = 'none'
    }
    if (!showRoute && carEl) carEl.style.display = 'none'
  }, [map, mapState, pickupKey, dropoffKey, showRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Car animation along the real route ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready' || !routeGeoRef.current || !showRoute) return
    const coords = routeGeoRef.current.coordinates
    const cum = routeCumRef.current
    const pt = pointAtFraction(coords, cum, carProgress)
    const carEl = carMarkerRef.current?.getElement()
    if (pt) {
      carMarkerRef.current?.setLngLat(pt)
      if (carEl) carEl.style.display = 'block'
    }
  }, [map, mapState, carProgress, routeVersion, showRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Radar pulse while searching ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready') return
    const el = radarMarkerRef.current?.getElement()
    if (radar && pickupCoords) {
      if (!radarMarkerRef.current) {
        radarMarkerRef.current = new Marker({
          element: makeMarkerEl('<span class="rush-radar-ring"></span>', 'rush-radar'),
        }).addTo(map)
      }
      radarMarkerRef.current.setLngLat([pickupCoords.lng, pickupCoords.lat])
      radarMarkerRef.current.getElement().style.display = 'block'
    } else if (el) {
      el.style.display = 'none'
    }
  }, [map, mapState, radar, pickupKey]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- Phase 2: live fleet animation ---------- */
  useEffect(() => {
    if (!map || mapState !== 'ready') return

    const cars = Array.from({ length: FLEET_COUNT }, () => ({
      lat: DENVER_CENTER.lat + (Math.random() - 0.5) * 0.16,
      lng: DENVER_CENTER.lng + (Math.random() - 0.5) * 0.22,
      heading: Math.random() * Math.PI * 2,
      speed: 0.00009 + Math.random() * 0.00018,
    }))
    fleetRef.current = cars

    const toFeatureCollection = () => ({
      type: 'FeatureCollection',
      features: cars.map((c) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
        properties: {},
      })),
    })

    map.getSource('fleet')?.setData(toFeatureCollection())

    const interval = setInterval(() => {
      const fleet = fleetRef.current
      if (!fleet) return
      fleet.forEach((c) => {
        c.heading += (Math.random() - 0.5) * 0.35
        c.lat += Math.sin(c.heading) * c.speed
        c.lng += Math.cos(c.heading) * c.speed
      })
      try {
        map.getSource('fleet')?.setData(toFeatureCollection())
      } catch {
        /* source may be mid-removal */
      }
    }, 300)

    return () => clearInterval(interval)
  }, [map, mapState])

  /* ---------- Resize ---------- */
  useEffect(() => {
    if (!map) return
    const ro = new ResizeObserver(() => {
      try {
        map.resize()
      } catch {
        /* noop */
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [map, mapState])

  /* ---------- Fallback when MapLibre cannot start ---------- */
  const fallbackPickup = useMemo(() => {
    if (!pickupCoords) return null
    return projectToGrid(pickupCoords.lat, pickupCoords.lng)
  }, [pickupKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const fallbackDropoff = useMemo(() => {
    if (!dropoffCoords) return null
    return projectToGrid(dropoffCoords.lat, dropoffCoords.lng)
  }, [dropoffKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const fallbackCar = useMemo(() => {
    if (!fallbackPickup || !fallbackDropoff) return null
    return {
      x: fallbackPickup.x + (fallbackDropoff.x - fallbackPickup.x) * clamp01(carProgress),
      y: fallbackPickup.y + (fallbackDropoff.y - fallbackPickup.y) * clamp01(carProgress),
    }
  }, [fallbackPickup, fallbackDropoff, carProgress])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-[#0A0D15] select-none">
      {/* Real vector map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading state */}
      {mapState === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-20 bg-[#0A0D15] text-white">
          <div className="h-7 w-7 rounded-full border-2 border-[#34D399] border-t-transparent animate-spin mb-2" />
          <span className="text-[11px] font-medium text-white/70">Loading Denver map…</span>
        </div>
      )}

      {/* Fallback (no WebGL / offline) */}
      {mapState === 'error' && (
        <CyberGridFallback
          showRoute={showRoute}
          pickup={fallbackPickup}
          dropoff={fallbackDropoff}
          car={fallbackCar}
          radar={radar}
          onMapClick={onMapClick}
        />
      )}

      {/* Focus Denver pill — shown after a Colorado-wide reveal when GPS is unavailable */}
      {showFocusDenver && mapState === 'ready' && (
        <button
          onClick={focusDenver}
          className="absolute top-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#38BDF8]/50 bg-black/70 px-4 py-2 text-[12px] font-extrabold text-[#38BDF8] shadow-xl backdrop-blur-md transition-transform active:scale-95"
        >
          <LocateFixed size={14} /> Focus Denver
        </button>
      )}

      {/* Live badge */}
      {mapState === 'ready' && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl border border-[#34D399]/30 bg-black/75 px-3 py-1.5 text-[11px] font-bold text-[#34D399]">
          <LocateFixed size={14} /> Live Denver Map • Human Fleet Active
        </div>
      )}

      {/* Tap hint */}
      {onMapClick && mapState === 'ready' && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[9.5px] font-medium text-white/50 backdrop-blur-md">
          <Eye size={10} className="text-[#38BDF8]" /> Tap map to pin pickup
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Denver lat/lng → fallback grid projection                          */
/* ------------------------------------------------------------------ */

function projectToGrid(lat, lng) {
  const LON_MIN = -105.35
  const LON_MAX = -104.55
  const LAT_MIN = 39.55
  const LAT_MAX = 39.85
  const x = 20 + ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * 360
  const y = 20 + ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * 430
  return { x: Math.round(x), y: Math.round(y) }
}

/* ------------------------------------------------------------------ */
/*  Offline/WebGL fallback — simplified Denver grid                    */
/* ------------------------------------------------------------------ */

function CyberGridFallback({ showRoute, pickup, dropoff, car, radar, onMapClick }) {
  const routePath = useMemo(() => {
    if (!pickup || !dropoff) return ''
    const x1 = pickup.x, y1 = pickup.y, x2 = dropoff.x, y2 = dropoff.y
    const cx1 = x1 + (x2 - x1) * 0.35
    const cy1 = y1 - 40
    const cx2 = x1 + (x2 - x1) * 0.65
    const cy2 = y2 + 40
    return `M ${x1} ${y1} C ${cx1} ${cy1} ${cx2} ${cy2} ${x2} ${y2}`
  }, [pickup, dropoff])

  const handleClick = (e) => {
    if (!onMapClick) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const { lat, lng } = projectToGridInverse(
      Math.round(((e.clientX - rect.left) / rect.width) * 400),
      Math.round(((e.clientY - rect.top) / rect.height) * 470)
    )
    onMapClick({ lat, lng })
  }

  return (
    <svg
      viewBox="0 0 400 470"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full cursor-crosshair select-none touch-none"
      onClick={handleClick}
      role="img"
      aria-label="Simplified Denver map (offline mode)"
    >
      <defs>
        <linearGradient id="fgRoute" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <radialGradient id="fgVignette" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width="400" height="470" fill="#0A0D15" />
      <g stroke="#33456B" strokeLinecap="round">
        <line x1="0" y1="120" x2="400" y2="120" strokeWidth="7" />
        <line x1="0" y1="200" x2="400" y2="200" strokeWidth="9" />
        <line x1="0" y1="280" x2="400" y2="280" strokeWidth="6" />
        <line x1="0" y1="360" x2="400" y2="360" strokeWidth="8" />
        <line x1="80" y1="0" x2="80" y2="470" strokeWidth="7" />
        <line x1="170" y1="0" x2="170" y2="470" strokeWidth="6" />
        <line x1="250" y1="0" x2="250" y2="470" strokeWidth="9" />
        <line x1="340" y1="0" x2="340" y2="470" strokeWidth="6" />
      </g>
      <g stroke="#2C3E5F" strokeWidth="0.6" opacity="0.6">
        {Array.from({ length: 19 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 20} y1="0" x2={20 + i * 20} y2="470" />
        ))}
        {Array.from({ length: 22 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={20 + i * 20} x2="400" y2={20 + i * 20} />
        ))}
      </g>

      {showRoute && pickup && dropoff && (
        <g>
          <path d={routePath} fill="none" stroke="#26334D" strokeWidth="6" strokeLinecap="round" opacity="0.65" />
          <path d={routePath} fill="none" stroke="url(#fgRoute)" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {pickup && (
        <g transform={`translate(${pickup.x},${pickup.y})`}>
          <circle r="12" fill="none" stroke="#38BDF8" strokeWidth="1.2" opacity="0.55" />
          <circle r="5" fill="#38BDF8" style={{ filter: 'drop-shadow(0 0 6px #38BDF8)' }} />
        </g>
      )}

      {showRoute && dropoff && (
        <g transform={`translate(${dropoff.x},${dropoff.y})`}>
          <rect x="-6" y="-6" width="12" height="12" rx="2.5" fill="#A86BFF" transform="rotate(45)" style={{ filter: 'drop-shadow(0 0 6px #818CF8)' }} />
        </g>
      )}

      {radar && pickup && (
        <g transform={`translate(${pickup.x},${pickup.y})`}>
          {[0, 1, 2].map((i) => (
            <circle key={i} r="6" fill="none" stroke="#38BDF8" strokeWidth="1.4">
              <animate attributeName="r" values="6;54" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0" dur="2.2s" begin={`${i * 0.73}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {car && (
        <g transform={`translate(${car.x},${car.y})`}>
          <circle r="11" fill="#38BDF8" opacity="0.25" />
          <rect x="-7" y="-5" width="14" height="10" rx="3.5" fill="#0A0D15" stroke="#38BDF8" strokeWidth="1.8" style={{ filter: 'drop-shadow(0 0 10px rgba(56,189,248,0.95))' }} />
        </g>
      )}

      <rect width="400" height="470" fill="url(#fgVignette)" />

      <text x="200" y="455" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="9" fontWeight="600" letterSpacing="2">
        OFFLINE MAP MODE
      </text>
    </svg>
  )
}

function projectToGridInverse(x, y) {
  const LON_MIN = -105.35
  const LON_MAX = -104.55
  const LAT_MIN = 39.55
  const LAT_MAX = 39.85
  const lng = LON_MIN + ((x - 20) / 360) * (LON_MAX - LON_MIN)
  const lat = LAT_MIN + ((y - 20) / 430) * (LAT_MAX - LAT_MIN)
  return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) }
}

/* ------------------------------------------------------------------ */

export default function MapEngine(props) {
  return (
    <MapErrorBoundary>
      <MapEngineContent {...props} />
    </MapErrorBoundary>
  )
}
