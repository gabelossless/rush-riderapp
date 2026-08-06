import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Navigation,
  ShieldCheck,
  Users,
  Wallet,
  Footprints,
} from 'lucide-react'
import { triggerHaptic } from '../utils/haptics'

const usd = (n) => `$${(n || 0).toFixed(2)}`

/* ------------------------------------------------------------------ */
/*  RideConfirmSheet — one decision per screen. Pre-selected tier,     */
/*  price most prominent, FairFare collapsed to a chip, no-surge line. */
/* ------------------------------------------------------------------ */

export default function RideConfirmSheet({
  pickup,
  destination,
  basePrice,
  tiers,
  selectedTierId,
  onTierChange,
  onBack,
  onRequest,
  user,
  walkingNote,
  onOpenWallet,
}) {
  const [showTiers, setShowTiers] = useState(false)
  const [showFairFare, setShowFairFare] = useState(false)

  const tier = tiers.find((t) => t.id === selectedTierId) || tiers[0]
  // basePrice is computed once by the parent (from destination distance) and
  // passed down, so the fare shown here can never drift from what's actually
  // charged when the ride is requested.
  const totalFare = Math.round(basePrice * tier.multiplier * 100) / 100
  const DRIVER_PCT = 0.88

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
        <p className="text-[15px] font-extrabold text-white">Confirm your ride</p>
      </div>

      {/* Route summary */}
      <div className="relative overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04] p-3.5 backdrop-blur-md">
        <div className="absolute left-[27px] top-[30px] bottom-[30px] w-[2px] bg-gradient-to-b from-[#38BDF8] to-[#818CF8]" />
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#38BDF8]/20">
            <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
              Pickup
            </span>
            <p className="truncate text-[13px] font-bold text-white">{pickup}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[9.5px] font-semibold text-white/55">
            <Footprints size={11} /> {walkingNote}
          </span>
        </div>
        <div className="flex items-center gap-3 py-1">
          <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#818CF8]/20">
            <Navigation size={12} className="text-[#818CF8]" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/40">
              Destination
            </span>
            <p className="truncate text-[13px] font-bold text-white">{destination?.name}</p>
            <p className="truncate text-[10px] font-medium text-white/40">{destination?.address}</p>
          </div>
          <span className="shrink-0 text-[10.5px] font-bold text-white/55">
            {destination?.distance || '2.1 mi'}
          </span>
        </div>
      </div>

      {/* Tier card */}
      <div className="mt-2">
        <button
          onClick={() => {
            triggerHaptic('light')
            setShowTiers(!showTiers)
          }}
          className="relative flex w-full items-center gap-3 rounded-2xl border border-[#38BDF8]/50 bg-[#38BDF8]/[0.07] p-3.5 text-left transition-all active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#38BDF8]/15 text-[#38BDF8]">
            <tier.icon size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-extrabold text-white">{tier.name}</p>
              {tier.featured && (
                <span className="rounded-full bg-[#38BDF8] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#061018]">
                  Fastest
                </span>
              )}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] font-medium text-white/50">
              <Users size={11} /> {tier.seats} seats • pickup {tier.etaRange}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[19px] font-black text-white">{usd(totalFare)}</p>
            <p className="flex items-center justify-end gap-0.5 text-[9.5px] font-semibold text-[#38BDF8]">
              Change {showTiers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </p>
          </div>
        </button>

        <AnimatePresence>
          {showTiers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex flex-col gap-2">
                {tiers
                  .filter((t) => t.id !== selectedTierId)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        triggerHaptic('light')
                        onTierChange(t.id)
                        setShowTiers(false)
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:border-white/25 active:scale-[0.99]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
                        <t.icon size={19} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-white">{t.name}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-white/45">
                          {t.etaRange} pickup • {t.desc}
                        </p>
                      </div>
                      <span className="shrink-0 text-[14px] font-extrabold text-white">
                        {usd(Math.round(basePrice * t.multiplier * 100) / 100)}
                      </span>
                    </button>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FairFare chip + no-surge line */}
      <div className="mt-2 rounded-2xl border border-[#34D399]/25 bg-[#34D399]/[0.05]">
        <button
          onClick={() => {
            triggerHaptic('light')
            setShowFairFare(!showFairFare)
          }}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left"
        >
          <span className="flex items-center gap-2 text-[11.5px] font-bold text-[#34D399]">
            <ShieldCheck size={14} /> 88% of your fare goes to your driver
          </span>
          <span className="text-[#34D399]/70">
            {showFairFare ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>
        <AnimatePresence>
          {showFairFare && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-3.5 pb-3">
                <div className="rounded-xl border border-white/8 bg-white/[0.04] p-3 text-[10.5px] font-semibold">
                  <div className="flex justify-between">
                    <span className="text-white/55">Driver payout (88%)</span>
                    <span className="text-[#34D399]">{usd(totalFare * DRIVER_PCT)}</span>
                  </div>
                  <div className="mt-1.5 flex justify-between">
                    <span className="text-white/55">Platform fee (12%)</span>
                    <span className="text-white/80">{usd(totalFare * (1 - DRIVER_PCT))}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-white/10 pt-1.5 text-[12px]">
                    <span className="text-white/70">Total</span>
                    <span className="font-black text-white">{usd(totalFare)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-[10.5px] font-medium text-white/40">
        <ShieldCheck size={12} className="text-[#38BDF8]" />
        No surge games — the price you see is the price you pay.
      </p>

      {/* Payment + CTA */}
      <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-[11px]">
        <span className="text-white/50">Payment</span>
        <button
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 font-bold text-[#38BDF8] hover:underline"
        >
          <Wallet size={13} /> Rush Wallet ({usd(user?.walletBalance || 100)})
        </button>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onRequest}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#38BDF8] py-4 text-[15px] font-extrabold text-[#061018]"
      >
        Request {tier.name} ({usd(totalFare)})
      </motion.button>
    </div>
  )
}
