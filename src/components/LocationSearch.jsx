import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Clock, Loader2, MapPin, Navigation, Search, X } from 'lucide-react'
import { PRESET_DESTINATIONS } from '../data/mockData'
import { triggerHaptic } from '../utils/haptics'
import { useAddressSearch } from '../utils/geocode'

/* ------------------------------------------------------------------ */
/*  LocationSearch — the "Where to?" destination sheet.                */
/*  Pickup row + destination row both support live free-text address   */
/*  geocoding (any real-world address, not just the Denver preset      */
/*  list) via OpenStreetMap Nominatim, alongside saved places/recents. */
/* ------------------------------------------------------------------ */

export default function LocationSearch({
  pickup,
  onPickupChange,
  onPickupSelect,
  onSelectDestination,
  onBack,
  savedPlaces = [],
  recents = [],
}) {
  const [query, setQuery] = useState('')
  const [pickupQuery, setPickupQuery] = useState('')
  const [pickupFocused, setPickupFocused] = useState(false)
  const inputRef = useRef(null)
  const justSelectedDest = useRef(false)
  const justSelectedPickup = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [])

  const q = query.trim().toLowerCase()
  const presetResults = q
    ? PRESET_DESTINATIONS.filter(
        (d) => d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q)
      )
    : null

  const { results: geoResults, loading: geoLoading } = useAddressSearch(
    justSelectedDest.current ? '' : query
  )
  const { results: pickupGeoResults, loading: pickupGeoLoading } = useAddressSearch(
    justSelectedPickup.current ? '' : pickupQuery
  )

  const handlePickup = (e) => {
    justSelectedPickup.current = false
    setPickupQuery(e.target.value)
    onPickupChange(e.target.value)
  }

  const handleSelect = (dest) => {
    triggerHaptic('light')
    justSelectedDest.current = true
    onSelectDestination(dest)
    setQuery('')
  }

  const handleSelectPickup = (place) => {
    triggerHaptic('light')
    justSelectedPickup.current = true
    setPickupFocused(false)
    setPickupQuery('')
    if (onPickupSelect) onPickupSelect(place)
    else onPickupChange(place.name)
  }

  const handleUseCurrentLocation = () => {
    triggerHaptic('light')
    justSelectedPickup.current = true
    setPickupFocused(false)
    setPickupQuery('')
    onPickupChange('Current Location')
  }

  const Row = ({ dest, sub, onClick }) => {
    const Icon = dest.icon || MapPin
    return (
      <button
        onClick={onClick || (() => handleSelect(dest))}
        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.99]"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${dest.tint || '#38BDF8'}22`, color: dest.tint || '#38BDF8' }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white">{dest.name}</p>
          <p className="truncate text-[10.5px] font-medium text-white/40">
            {sub || dest.address}
          </p>
        </div>
        {(dest.etaRange || dest.eta) && (
          <span className="shrink-0 text-[10px] font-bold text-white/50">
            {dest.etaRange || dest.eta}
          </span>
        )}
      </button>
    )
  }

  const hasDestQuery = q.length > 0
  const showPickupDropdown = pickupFocused && pickupQuery.trim().length > 0

  return (
    <div className="flex max-h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="mb-2 flex items-center gap-2.5">
        <button
          onClick={() => {
            triggerHaptic('light')
            onBack()
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]"
        >
          <ChevronLeft size={17} />
        </button>
        <p className="text-[15px] font-extrabold text-white">Where to?</p>
      </div>

      {/* Pickup / Destination rows */}
      <div className="relative rounded-2xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-md">
        {/* Pickup */}
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#38BDF8]/20">
            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
              Pickup
            </span>
            <input
              type="text"
              value={pickup === 'Current Location' ? '' : pickup}
              placeholder="Current Location — or type any address"
              onChange={handlePickup}
              onFocus={() => setPickupFocused(true)}
              onBlur={() => setTimeout(() => setPickupFocused(false), 120)}
              className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder-white/40"
            />
          </div>
          <span className="shrink-0 rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[9px] font-bold text-[#34D399]">
            GPS ±12m
          </span>
        </div>

        {/* Pickup live address dropdown */}
        {showPickupDropdown && (
          <div className="absolute inset-x-3 top-[52px] z-30 max-h-52 overflow-y-auto no-scrollbar rounded-2xl border border-white/15 bg-[#0A0D15] p-1.5 shadow-2xl shadow-black/80">
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                handleUseCurrentLocation()
              }}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#34D399]/15 text-[#34D399]">
                <Navigation size={15} />
              </span>
              <p className="text-[13px] font-bold text-white">Use current GPS location</p>
            </button>
            {pickupGeoLoading && (
              <div className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-medium text-white/40">
                <Loader2 size={12} className="animate-spin" /> Searching addresses…
              </div>
            )}
            {pickupGeoResults.map((r) => (
              <button
                key={r.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelectPickup(r)
                }}
                className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-[#38BDF8]">
                  <MapPin size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-white">{r.name}</p>
                  <p className="truncate text-[10.5px] font-medium text-white/40">{r.address}</p>
                </div>
              </button>
            ))}
            {!pickupGeoLoading && pickupQuery.trim().length >= 3 && pickupGeoResults.length === 0 && (
              <p className="px-2.5 py-2 text-[11px] font-medium text-white/35">
                No address matches yet — keep typing.
              </p>
            )}
          </div>
        )}

        <div className="my-1 border-t border-white/8" />

        {/* Destination search */}
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#818CF8]/20">
            <Navigation size={12} className="text-[#818CF8]" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
              Destination
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                justSelectedDest.current = false
                setQuery(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                if (presetResults?.length) handleSelect(presetResults[0])
                else if (geoResults.length) handleSelect(geoResults[0])
              }}
              placeholder="Search any address…"
              className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder-white/50"
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.05] p-1 text-white/50"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results / suggestions */}
      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar pb-1">
        {hasDestQuery ? (
          <div className="flex flex-col gap-2">
            {presetResults.length > 0 && (
              <div>
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  Rush destinations
                </p>
                <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-2">
                  {presetResults.map((d) => (
                    <Row key={d.id} dest={d} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-1 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                Any address
                {geoLoading && <Loader2 size={10} className="animate-spin text-white/40" />}
              </p>
              {geoResults.length > 0 ? (
                <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-2">
                  {geoResults.map((r) => (
                    <Row key={r.id} dest={r} onClick={() => handleSelect(r)} />
                  ))}
                </div>
              ) : (
                !geoLoading &&
                presetResults.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Search size={20} className="text-white/25" />
                    <p className="text-[12px] font-medium text-white/40">
                      No matches for "{query}"
                    </p>
                    <p className="text-[10.5px] text-white/30">
                      Try a full street address, or "Union Station", "Airport", "Red Rocks"
                    </p>
                  </div>
                )
              )}
            </div>

            {geoResults.length > 0 && (
              <p className="px-1 text-center text-[9px] font-medium text-white/25">
                Address search by OpenStreetMap contributors
              </p>
            )}
          </div>
        ) : (
          <>
            {savedPlaces.length > 0 && (
              <div className="mb-2">
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  Saved places
                </p>
                <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-1.5">
                  {savedPlaces.map((p) => (
                    <Row key={p.id} dest={p} />
                  ))}
                </div>
              </div>
            )}
            {recents.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  <Clock size={10} /> Recent
                </p>
                <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-1.5">
                  {recents.map((r) => (
                    <Row key={r.id} dest={r} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
