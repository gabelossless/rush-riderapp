import { useState } from 'react'
import { Navigation, Sparkles } from 'lucide-react'
import { PRESET_DESTINATIONS } from '../data/mockData'
import { triggerHaptic } from '../utils/haptics'

export default function LocationSearch({
  pickup,
  destination,
  onSelectPickup,
  onSelectDestination,
}) {
  const [activeInput, setActiveInput] = useState('destination') // 'pickup' | 'destination'
  const [query, setQuery] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const filteredPresets = PRESET_DESTINATIONS.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.address.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (dest) => {
    triggerHaptic('light')
    if (activeInput === 'pickup') {
      onSelectPickup(dest.name)
    } else {
      onSelectDestination(dest)
    }
    setShowPresets(false)
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Pickup & Destination Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-3 backdrop-blur-md">
        {/* Connector line */}
        <div className="absolute left-[27px] top-[26px] bottom-[26px] w-[2px] bg-gradient-to-b from-[#38BDF8] to-[#818CF8]" />

        {/* Pickup Input Row */}
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#38BDF8]/20 text-[#38BDF8]">
            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
          </span>
          <div className="flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">Pickup</span>
            <input
              type="text"
              value={pickup || 'Current Location (Neon District)'}
              onClick={() => {
                setActiveInput('pickup')
                setShowPresets(true)
              }}
              onChange={(e) => {
                onSelectPickup(e.target.value)
                setActiveInput('pickup')
                setShowPresets(true)
              }}
              className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder-white/40"
              placeholder="Set pickup spot..."
            />
          </div>
        </div>

        <div className="my-1 border-t border-white/8" />

        {/* Destination Input Row */}
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#818CF8]/20 text-[#818CF8]">
            <Navigation size={12} className="text-[#818CF8]" />
          </span>
          <div className="flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">Destination</span>
            <input
              type="text"
              value={destination ? destination.name : ''}
              onClick={() => {
                setActiveInput('destination')
                setShowPresets(true)
              }}
              onChange={(e) => {
                setQuery(e.target.value)
                setActiveInput('destination')
                setShowPresets(true)
              }}
              className="w-full bg-transparent text-[13px] font-bold text-white outline-none placeholder-white/50"
              placeholder="Where to next?"
            />
          </div>
        </div>
      </div>

      {/* Preset Destinations Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40 whitespace-nowrap">
          <Sparkles size={11} className="text-[#38BDF8]" /> Quick Destinations:
        </span>
        {PRESET_DESTINATIONS.map((dest) => {
          const Icon = dest.icon
          const isSelected = destination?.id === dest.id
          return (
            <button
              key={dest.id}
              onClick={() => handleSelect(dest)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                  : 'border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
              }`}
            >
              <Icon size={12} style={{ color: dest.tint }} />
              <span>{dest.name}</span>
              <span className="text-[9.5px] font-medium text-white/40">({dest.eta})</span>
            </button>
          )
        })}
      </div>

      {/* Dropdown Suggestions List when actively typing */}
      {showPresets && query.length > 0 && (
        <div className="rounded-2xl border border-white/15 bg-[#0F1420] p-2 shadow-2xl">
          {filteredPresets.map((dest) => {
            const Icon = dest.icon
            return (
              <button
                key={dest.id}
                onClick={() => handleSelect(dest)}
                className="flex w-full items-center justify-between rounded-xl p-2.5 text-left hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${dest.tint}20`, color: dest.tint }}
                  >
                    <Icon size={15} />
                  </span>
                  <div>
                    <p className="text-[12.5px] font-bold text-white">{dest.name}</p>
                    <p className="text-[10px] text-white/40">{dest.address}</p>
                  </div>
                </div>
                <div className="text-right text-[11px] font-bold text-[#38BDF8]">
                  {dest.eta}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
