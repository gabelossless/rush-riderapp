# 🚦 Rush — From Investor Demo to a Real MVP

**Status of this plan**: Phase 0 (backend foundation) is **backlogged —
intentionally not started**, per an explicit product decision. Nothing
currently in this repo depends on it existing. This document exists so
whoever picks Phase 0 up later — human or agent — doesn't have to
re-derive the assessment below from scratch.

**The headline finding**: Rush's ride-experience UI is closer to
MVP-ready than the infrastructure underneath it. The gap is almost
entirely on the backend/data side (auth, database, real-time sync, real
GPS, payments, dispatch) — not the rider-facing product itself, which is
genuinely polished after several sessions of design work (two-leg trip
animation, live address search, driver nav handoff, FairFare
transparency, trip history, wallet, a real safety affordance).

---

## The honest read

Every "user," every "trip," every dollar in a wallet is a JSON blob in
`localStorage`. There is no server. A rider and a driver in the same demo
only "see" each other because they're the same browser tab switching
views (`window.addEventListener('storage', ...)` in
[`TripContext.jsx`](src/context/TripContext.jsx)) — two real phones could
not talk to each other today.

That sounds worse than it is. The parts that took the most design and
engineering judgment — the fare model, the trip state machine, the
map/routing stack, the rider-facing UI — are legitimate production
groundwork, not throwaway demo code. They need to be *connected* to real
infrastructure, not reinvented.

---

## What already transfers to a real MVP

| What | Why it survives |
|---|---|
| **FairFare payout logic** (88/12 split, tier multipliers, fare calc) | Real business logic today, just running client-side. Moving the calculation server-side (so a rider can't tamper with their own fare) is a port, not a redesign. |
| **Trip state machine** (`SEARCHING → ACCEPTED → IN_PROGRESS → COMPLETED`, two distinct legs: driver→pickup, pickup→dropoff) | This is the actual shape a real dispatch service needs. Today it's driven by client-side timers (see [`TripContext.jsx`](src/context/TripContext.jsx)'s action functions and the ticker effects in [`App.jsx`](src/App.jsx)); in production, the same states are driven by real events (a driver's GPS update, a driver tapping "arrived," a payment webhook). |
| **Map & routing stack** (MapLibre GL + vector tiles, OSRM-shaped routing calls, Nominatim-shaped geocoding calls) | A legitimate production choice, not a demo shortcut. The *free public hosts* (`tiles.openfreemap.org`, `router.project-osrm.org`, `nominatim.openstreetmap.org`) are the only pieces that don't survive real traffic — swapping them for paid or self-hosted equivalents behind the same client interfaces (`src/utils/geocode.js`, the OSRM fetch in `MapEngine.jsx`) is a config change, not a rewrite. |
| **Rider-facing UI** (confirm sheet, live trip tracking, trip history, wallet, driver nav handoff, safety sheet) | Needs real data flowing through it, not a redesign. |

---

## What's demo-only and has to be rebuilt

| Area | Today | MVP needs |
|---|---|---|
| **Accounts** | `localStorage` "known emails" list, two hardcoded demo logins, no passwords/verification (`AuthContext.jsx`) | Real auth — magic link or OTP is the natural fit (Supabase Auth, Clerk, Firebase Auth all work) |
| **Backend / database** | Doesn't exist. Everything is a `localStorage` blob. | Postgres: `users`, `driver_profiles`, `vehicles`, `trips`, `trip_events`, `ledger_entries` |
| **Rider ↔ driver sync** | Cross-tab `storage` events — only works within one browser, not between two real phones | A real-time channel per trip (Supabase Realtime / WebSockets) |
| **Driver location** | Simulated: a random point 0.6–2.8mi from pickup, generated per-trip (`simulateDriverApproach` in `TripContext.jsx`) — honest and correctly staged as of this session's work, but still invented | `navigator.geolocation.watchPosition` in a real driver app, posting live GPS every few seconds. The two-leg animation logic doesn't change shape, only its data source does. |
| **Dispatch / matching** | Always matches the same hardcoded demo driver after a fixed 2.5s wait (`DEMO_DRIVER` in `App.jsx`) | Broadcast new requests to nearby online drivers within a radius; first accept wins (simple v1, tunable later) |
| **Payments** | "Wallet balance" is a number in `localStorage`, topped up by a demo button (`addFunds` in `AuthContext.jsx`) | Stripe Connect — maps directly onto the 88/12 FairFare model (a charge on the rider, an automatic transfer to the driver) |
| **Trust & safety** | "Verified Human" badges with nothing behind them | Real background checks (Checkr is the US standard), document upload, an actual verification flow |
| **Notifications** | In-app banners only, don't work if the tab isn't focused | Push notifications — the PWA groundwork (`vite-plugin-pwa`, service worker, manifest) already installed is most of the lift |

---

## A phased plan — ride experience first

Phase 1 is deliberately "the ride experience becomes real," not payments,
not trust & safety, not scale. A rider requesting an actual ride from an
actual nearby driver is the thing worth proving first.

### Phase 0 — Foundation *(backlogged, not started)*
Invisible to users; everything else depends on it.
- Provision Postgres + Auth + Realtime. **Supabase is the fastest path**
  — Postgres + Auth + Realtime + Storage in one, and it's available as
  tooling in this environment already (see `mcp__Supabase__*` tools if
  you're an agent picking this up).
- Schema: `users`, `driver_profiles`, `vehicles`, `trips`, `trip_events`,
  `ledger_entries`.
- Move fare/FairFare calculation into a server-side function — never
  trust the client with money math.

### Phase 1 — Ride & customer experience *(MVP core — do this first)*
- Real rider signup/login, replacing the fake known-emails system.
- Trip requests become rows in `trips` — the existing status names
  (`SEARCHING`/`ACCEPTED`/`IN_PROGRESS`/`COMPLETED`) carry over directly,
  no renaming needed.
- Swap the free geocoding/routing hosts for production ones (Mapbox or
  Google) behind the same client interfaces already in place
  (`src/utils/geocode.js`'s `searchAddress`/`useAddressSearch`, the OSRM
  fetch in `MapEngine.jsx`).
- Subscribe the rider's screen to a real-time trip channel — replaces the
  client-side `setTimeout` choreography in `App.jsx`'s auto-advance
  effect with actual pushed state changes.
- **Carries over almost untouched**: confirm sheet, live map tracking,
  trip history, wallet UI, the driver-nav handoff, the two-leg car
  animation, the safety sheet.

### Phase 2 — Driver experience & dispatch
- Driver onboarding: document upload, background check (Checkr).
- Driver app streams live GPS while online — the piece that finally
  replaces `simulateDriverApproach()`.
- Real dispatch: broadcast to nearby online drivers, first accept wins.

### Phase 3 — Payments & trust
- Stripe Connect: charge the rider, transfer 88% to the driver
  automatically.
- Wallet backed by real transactions instead of a `localStorage` number.
- Ratings persisted server-side, actually feeding into driver visibility.

### Phase 4 — Polish & scale
- Push notifications (PWA groundwork already in place).
- Ops/admin dashboard — fraud review, support, driver approval queue.
- Move off the free-tier map/routing/geocoding hosts before real load
  hits their usage caps (see the tile-host reliability flag in
  `HANDOFF.md` — there's already evidence this matters).

---

## Where to actually start, when this is picked back up

The single highest-leverage next step is Phase 0: stand up a real
backend and re-plumb the two React contexts that currently fake one
(`AuthContext`, `TripContext`) to talk to it instead of `localStorage`.
That's a scoped, concrete piece of work — and roughly 90% of the UI layer
built across these sessions doesn't need to change shape to sit on top of
it.
