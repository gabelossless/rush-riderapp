# 🤝 Agent Handoff & Project Status Report

**Repository**: [github.com/gabelossless/rush-riderapp](https://github.com/gabelossless/rush-riderapp)
**Status**: 🟢 `main` and `claude/review-updates-tmxcdv` are both at `7d41546`, working tree clean, build/lint/tests all pass, fixes pushed live.

---

## 🌐 Live Deployment
- 🟢 **Primary App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/) (Vercel, auto-deploys `main` via GitHub integration)

---

## 📦 This Session's Work (chronological)

Session started with a code review of the prior session's three commits
(`689e185` Real Denver map rewrite, `b2b51a3` PWA/UI polish, `0b5dfa9` test
suite), then fixed everything the review + live testing turned up.

1. **Driver's map showed nothing** — `DriverViewContent`'s `<MapShell>`
   (`src/App.jsx`) passed only `showRoute`/`radar`, never `pickupCoords`/
   `dropoffCoords`/`carProgress`. `MapEngine` defaults those to `null`/`0`,
   so every coord-gated effect (route fetch, radar pulse, car position)
   bailed out immediately — a driver going online or accepting a ride saw a
   bare map. Fixed by threading real coordinates through `TripContext`:
   `requestRide()` now accepts and stores `pickupCoords`/`dropoffCoords` on
   `currentTrip`, `PassengerViewContent` passes its local coords in when
   requesting a ride, and `DriverViewContent` reads them back off
   `currentTrip` (falling back to the app's existing default "Home → Union
   Station" landmarks — `SAVED_PLACES[0]`/`PRESET_DESTINATIONS[0]` — for
   legacy/no-trip-yet cases).
2. **Route gradient silently invalid** — the `route-line` MapLibre layer
   put a `['line-progress']` interpolation on `line-color`, but per the
   style spec that expression is only valid on `line-gradient`, which also
   requires the source to opt into `lineMetrics: true`. Fixed both.
3. **Car marker went stale after a mid-flow destination change** — the
   car-animation effect keyed off a boolean `routeReady`; re-fetching a new
   route while it was already `true` was a same-value no-op, so the effect
   didn't re-run even though the route refs had changed. Swapped for a
   monotonically incrementing `routeVersion` counter so every new route
   triggers a re-render.
4. **Map could hang forever on "Loading Denver map…"** (caught live from a
   real deployed session, screenshot showed the spinner with no way out).
   `mapState` only ever left `'loading'` via MapLibre's `load`/`error`
   events — on some networks (blocked/rate-limited `tiles.openfreemap.org`,
   flaky cellular, content blockers) the style fetch just hangs without
   firing either, even though a fully working offline fallback map
   (`CyberGridFallback`) was one state away. Added an 8s watchdog timeout
   that forces the fallback if still `'loading'` when it fires. Reproduced
   the exact hang locally (this sandbox's network policy blocks the tile
   host) and confirmed the watchdog recovers correctly.

Added 2 `TripContext.test.jsx` cases covering the new `pickupCoords`/
`dropoffCoords` params (32/32 tests passing, up from 30).

**Verification caveat for the next agent**: this sandbox's network policy
blocks `tiles.openfreemap.org` and `router.project-osrm.org`, so fixes #2
and #3 above were verified by reading the MapLibre style spec and the
effect's dependency logic, not by watching the real gradient/route render
live. Fix #1 and #4 *were* verified live (via the offline-fallback
renderer, which shares the same code paths/props). **Worth a manual check
on a real device with normal network access**: confirm the route line
actually shows a visible blue→indigo gradient, and that changing
destination mid-flow (after a route has already loaded once) snaps the car
marker to the new route instead of leaving it on the old one.

See `git log` for the full commit-by-commit history.

---

## 🧩 Current Architecture

### 1. Entry gate ([App.jsx](src/App.jsx) — `RootGate`)
Every visitor hits `RootGate` first. If there's no restored `user` session
(or `sessionDone` hasn't fired yet), it renders `SignUpFlow` — the app's
front door. Only once that completes does `RootGate` render `AppShell`,
the actual app. Logging out resets `sessionDone`, sending the user back to
the welcome screen.

### 2. Sign-up flow ([SignUpFlow.jsx](src/components/SignUpFlow.jsx))
Email-first adaptive auth, one entry point that branches on whether the
email is recognized:
- **New email** → name → role (Rider/Driver; driver branch adds vehicle +
  a "Human Driver Pledge") → animated success → enter the app.
- **Recognized email** (e.g. `alex.rider@rushtest.com`,
  `marcus.driver@rushtest.com`) → one-tap passwordless "Welcome back."
- **Explore the Demo** → one-tap preset accounts (Alex Rivera / Marcus
  Vance) — equal-weight with real sign-up, so investors see the product in
  seconds.

### 3. App shell ([App.jsx](src/App.jsx) — `AppShell`)
Full-viewport layout (`h-[100dvh] w-full`, no phone-frame chrome). Header,
the passenger/driver content, and the bottom tab bar (hidden during an
active ride) all sit here. `RoleSwitch` in the header flips between:
- **`PassengerViewContent`**: `home ('Where to?') → dest (search/saved
  places/recents) → confirm (RideConfirmSheet) → searching → matched →
  completed`. Tracks real `pickupCoords`/`dropoffCoords` locally (default
  "Home" → "Union Station"), now threaded into `currentTrip` on request.
- **`DriverViewContent`**: online/offline toggle, 88% earnings dashboard,
  incoming-request card with honest distance/ETA copy, 2-stage trip
  acceptance (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`). Reads its map
  coords/progress off `currentTrip` (see fix #1 above).

### 4. Trip context ([TripContext.jsx](src/context/TripContext.jsx))
`currentTrip` is the single shared source of truth for the in-progress
ride, synced to `localStorage` (cross-tab via the `storage` event) so
passenger/driver views (and separate tabs) stay consistent. `requestRide()`
now stores `pickupCoords`/`dropoffCoords` alongside the existing
`pickup`/`destination` address strings — added this session, see fix #1.

### 5. Auth context ([AuthContext.jsx](src/context/AuthContext.jsx) &
[AccountModal.jsx](src/components/AccountModal.jsx))
- `findKnownUser(email)` / `loginWithEmail(email)` / `demoLogin(role)` /
  `register(...)` back the sign-up flow above; known emails persist to
  `localStorage` (`rush_known_emails`).
- `AccountModal` is purely the signed-in profile panel — balance, rating,
  rides, role switch, logout. It does not handle sign-up; that's fully
  `SignUpFlow`'s job.
- **Known rough edge (pre-existing, not yet fixed)**: `switchRole()` fully
  replaces the signed-in user with a hardcoded preset record, so a custom
  name/vehicle registered through `SignUpFlow` is discarded on role
  switch. Low-priority — flag if it comes up.

### 6. Map engine ([MapEngine.jsx](src/components/MapEngine.jsx))
Real vector map: **MapLibre GL + OpenFreeMap** dark style (`fiord`), GPS
boot with a Colorado-wide reveal + "Focus Denver" pill if GPS is denied,
40+ simulated live fleet cars, 6 pulsing surge zones, and real driving
routes via the public **OSRM** engine (car animates along actual roads).
Tap-to-pin sets a custom pickup. Degrades gracefully:
- **`mapState`**: `'loading' → 'ready'` on MapLibre's `load` event, or
  `'error'` on a fatal `error` event *or* the 8s loading watchdog (added
  this session, fix #4) if neither fires.
- **`'error'`** renders `CyberGridFallback`, a self-contained SVG grid map
  (own route/pickup/dropoff/radar/car rendering, tap-to-pin support) — a
  fully functional offline mode, not just an error screen.
- A React `MapErrorBoundary` wraps the whole thing for WebGL/render
  crashes, with a manual "Reload View" recovery button.
- **Known open question (not yet acted on, flagged to the user)**: the
  free OpenFreeMap tile host has no SLA; if the loading-watchdog fallback
  fires often in practice, consider a more reliable tile host.

### 7. PWA & mobile UX ([PWAInstallPrompt.jsx](src/components/PWAInstallPrompt.jsx) & [haptics.js](src/utils/haptics.js))
iOS/Android install banner, gated behind auth, respecting `localStorage`
dismissal; haptic feedback via `triggerHaptic` across tab switches, tier
selection, wallet refills. App icons generated procedurally — see
`scripts/generate-icons.ps1` (Windows/PowerShell original) or the
Python/Pillow port used in an earlier session to regenerate `public/*.png`.

---

## 🧪 Test Suite
Vitest + Testing Library, colocated `*.test.jsx` files, `jsdom` environment
(`vite.config.js` → `test.setupFiles: ['./src/test-setup.js']`, only
polyfills `localStorage` + `@testing-library/jest-dom`; **no `maplibre-gl`
mock exists**, so `MapEngine.jsx` itself is not unit-tested — it requires a
real WebGL/canvas context. Verify map changes by running the app, not by
adding fake unit tests around it.

- `src/context/TripContext.test.jsx` — `requestRide`/`cancelRequest`/
  `resetTripState`/`completeRide`, including this session's new
  `pickupCoords`/`dropoffCoords` coverage.
- `src/context/AuthContext.test.jsx`
- `src/components/PWAInstallPrompt.test.jsx`
- `src/utils/useTimeout.test.js`

Pattern: render a `TestConsumer` that calls the hook and exposes its API
via a ref object, wrapped in the real Provider; assert on `data-testid`
spans and call methods through the ref.

---

## 🛠️ Verification & Build Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Test: `npm test -- --run` (32 tests, 4 files, all passing as of this
  session)
- Lint: `npm run lint` (0 errors, 2 pre-existing warnings — both
  `react(only-export-components)` in `AuthContext.jsx` / `TripContext.jsx`,
  harmless, about Fast Refresh not full lint failures)

For a full manual walkthrough (sign-up, ride lifecycle, driver side, map
engine, PWA install), see [DEMO_GUIDE.md](DEMO_GUIDE.md).

---

## 🔭 Suggested Next Steps
1. **Manual live-network verification** of fixes #2/#3 above (route
   gradient rendering, car marker snapping to a newly selected route) —
   this sandbox couldn't reach the tile/OSRM hosts to confirm visually.
2. **`switchRole()` data loss** (Auth context, rough edge above) — decide
   whether custom sign-up data should survive a role switch, or whether
   the demo-preset behavior is intentional and just needs a UI note.
3. **Tile host reliability** — if the new loading watchdog (fix #4) fires
   often in the wild, consider a paid/self-hosted tile provider instead of
   OpenFreeMap's free tier.
