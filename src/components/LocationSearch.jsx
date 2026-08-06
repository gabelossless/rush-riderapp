import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Clock, Navigation, Search, X } from 'lucide-react'
import { PRESET_DESTINATIONS } from '../data/mockData'
import { triggerHaptic } from '../utils/haptics'

/* ------------------------------------------------------------------ */
/*  LocationSearch — the "Where to?" destination sheet.                */
/*  Pickup row + autocomplete search over Denver destinations, saved   */
/*  places, and recent rides. Selecting a result goes straight to      */
/*  confirmation (fewer taps = more seamless).                         */
/* ------------------------------------------------------------------ */

export default function LocationSearch({
  pickup,
  onPickupChange,
  onSelectDestination,
  onBack,
  savedPlaces = [],
  recents = [],
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [])

  const q = query.trim().toLowerCase()
  const results = q
    ? PRESET_DESTINATIONS.filter(
        (d) => d.name.toLowerCase().includes(q) || d.address.toLowerCase().includes(q)
      )
    : null

  const handlePickup = (e) => {
    onPickupChange(e.target.value)
  }

  const handleSelect = (dest) => {
    triggerHaptic('light')
    onSelectDestination(dest)
    setQuery('')
  }

  const Row = ({ dest, sub }) => {
    const Icon = dest.icon
    return (
      <button
        onClick={() => handleSelect(dest)}
        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-white/[0.06] active:scale-[0.99]"
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${dest.tint}22`, color: dest.tint }}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white">{dest.name}</p>
          <p className="truncate text-[10.5px] font-medium text-white/40">
            {sub || dest.address}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-bold text-white/50">
          {dest.etaRange || dest.eta}
        </span>
      </button>
    )
  }

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
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-md">
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
              placeholder="Current Location"
              onChange={handlePickup}
              className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder-white/40"
            />
          </div>
          <span className="shrink-0 rounded-full bg-[#34D399]/15 px-2 py-0.5 text-[9px] font-bold text-[#34D399]">
            GPS ±12m
          </span>
        </div>

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
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results?.length) handleSelect(results[0])
              }}
              placeholder="Search Denver destinations…"
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
        {results ? (
          results.length > 0 ? (
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-2">
              {results.map((d) => (
                <Row key={d.id} dest={d} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Search size={20} className="text-white/25" />
              <p className="text-[12px] font-medium text-white/40">
                No matches for "{query}"
              </p>
              <p className="text-[10.5px] text-white/30">
                Try "Union Station", "Airport", or "Red Rocks"
              </p>
            </div>
          )
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
