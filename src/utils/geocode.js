import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Free-text address geocoding — OpenStreetMap Nominatim.             */
/*  Free, no API key, same "no gatekeeping" philosophy as the map      */
/*  (OpenFreeMap tiles) and routing (OSRM). Usage policy caps public   */
/*  requests at ~1/sec, so callers must debounce — see useAddressSearch*/
/*  below. https://operations.osmfoundation.org/policies/nominatim/    */
/* ------------------------------------------------------------------ */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

// Soft-bias results toward metro Denver without excluding addresses
// elsewhere — bounded=0 keeps the search nationwide/global.
const DENVER_VIEWBOX = '-105.35,39.85,-104.55,39.55' // left,top,right,bottom

export async function searchAddress(query, { signal, limit = 5 } = {}) {
  const q = query.trim()
  if (q.length < 3) return []

  const url = new URL(`${NOMINATIM_BASE}/search`)
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('viewbox', DENVER_VIEWBOX)
  url.searchParams.set('bounded', '0')

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Nominatim ${res.status}`)
  const data = await res.json()

  return (Array.isArray(data) ? data : []).map((r) => ({
    id: `geo_${r.place_id}`,
    name: shortLabel(r),
    address: r.display_name,
    latlng: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
  }))
}

function shortLabel(r) {
  const a = r.address || {}
  if (a.house_number && a.road) return `${a.house_number} ${a.road}`
  return a.road || a.pedestrian || a.amenity || r.display_name.split(',')[0]
}

/**
 * Debounced live-search hook. Cancels the in-flight request whenever the
 * query changes again before it resolves.
 */
export function useAddressSearch(query, { minLength = 3, debounceMs = 450 } = {}) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const controllerRef = useRef(null)

  useEffect(() => {
    const q = (query || '').trim()
    controllerRef.current?.abort()

    if (q.length < minLength) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const controller = new AbortController()
    controllerRef.current = controller

    const t = setTimeout(() => {
      searchAddress(q, { signal: controller.signal })
        .then((r) => setResults(r))
        .catch((err) => {
          if (err?.name === 'AbortError') return
          console.warn('Address search failed:', err)
          setResults([])
        })
        .finally(() => setLoading(false))
    }, debounceMs)

    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [query, minLength, debounceMs])

  return { results, loading }
}

/** Straight-line distance in miles — used to estimate fare for a custom
 * geocoded address that has no preset `distance` field. */
export function haversineMiles(a, b) {
  if (!a || !b) return null
  const R = 3958.8
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Destination point given a start point, a distance (miles), and a
 * bearing (degrees, 0=N clockwise) — the great-circle inverse of
 * haversineMiles. Used to place a driver's simulated starting position a
 * plausible distance from pickup, in a stand-in for real driver GPS. */
export function offsetLatLng(center, distanceMiles, bearingDeg) {
  if (!center) return null
  const R = 3958.8
  const angular = distanceMiles / R
  const bearingRad = (bearingDeg * Math.PI) / 180
  const lat1 = (center.lat * Math.PI) / 180
  const lng1 = (center.lng * Math.PI) / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRad)
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    )
  return { lat: (lat2 * 180) / Math.PI, lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180 }
}
