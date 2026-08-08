# 🤝 Agent Handoff & Project Status Report

**Repository**: [github.com/gabelossless/rush-riderapp](https://github.com/gabelossless/rush-riderapp)
**Status**: 🟢 `main` at `3f8c392`, working tree clean, build/lint/tests all pass, pushed live. 40/40 tests across 5 files.

---

## 🌐 Live Deployment
- 🟢 **Primary App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/) (Vercel, auto-deploys `main` via GitHub integration)

---

## 📦 This Session's Work (chronological)

Session started with a code review of the prior session's three commits
(`689e185` Real Denver map rewrite, `b2b51a3` PWA/UI polish, `0b5dfa9` test
suite), then fixed everything the review + live testing turned up.1. **Driver's map showed nothing** — `DriverViewContent`'s `<MapShell>`
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

### Latest session (post-merge)

5. **HeroMoment brand beat** (`f3f5241`) — a new `HeroMoment` splash
   ([src/components/HeroMoment.jsx](src/components/HeroMoment.jsx)) plays on
   entry into the app shell: a car drives up, a transparent fare card
   ($24.90, "No surge", 88%/12% split) fades in, and it auto-dismisses after
   ~5s or on tap. Includes 4 tests
   ([HeroMoment.test.jsx](src/components/HeroMoment.test.jsx)).
6. **Merged `origin/main`** (`7d41546` map fixes + `3ad3619` HANDOFF rewrite)
   into the HeroMoment work via a clean ORT merge — no conflicts. Branch
   synced and pushed; `main` now at `3f8c392`.
7. **Docs audit & sync** (`925d9c0`) — refreshed `HANDOFF.md`, `README.md`,
   `DEMO_GUIDE.md` with the current build state (40 tests / 5 files), documented the HeroMoment flow, and added the test command to
   README. Also deleted two fully-merged stale remote branches
   (`claude/review-updates-tmxcdv`, `claude/rideshare-demo-black-screen-y1bzmw`).
8. **Backlog knockouts** (this commit) — fixed `switchRole()` data loss
   ([AuthContext.jsx](src/context/AuthContext.jsx)) so custom sign-up identity
   survives role switches, made `HeroMoment` play once per session
   (`sessionStorage` flag keyed by user id, [App.jsx](src/App.jsx)), and added
   4 new `switchRole` tests.

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
active ride) all sit here. On mount it renders `HeroMoment` (the ~5s brand
beat with the fare card) once per session — a `sessionStorage` flag keyed
by user id (`rush_hero_seen_<id>`) suppresses replays on refresh until the
tab/browser closes. `RoleSwitch` in the header flips between:
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
- **`switchRole()` preserves identity** (fixed this session): it edits the
  current user in place — keeping name/email/avatar/joinedDate/wallet —
  only filling in role-specific fields (car/plate/earnings counts for
  driver, stripping driver-only fields back to passenger). Custom sign-up
  data survives; preset records are no longer clobbering the session.

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
  `resetTripState`/`completeRide`, including the `pickupCoords`/
  `dropoffCoords` coverage added for the map fixes.
- `src/context/AuthContext.test.jsx` — logout/login/register/loginWithEmail/
  `switchRole` (identity preservation covered).
- `src/components/PWAInstallPrompt.test.jsx`
- `src/components/HeroMoment.test.jsx`
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
- Test: `npm test -- --run` (40 tests, 5 files, all passing as of this
  session)
- Lint: `npm run lint` (0 errors, 2 pre-existing warnings — both
  `react(only-export-components)` in `AuthContext.jsx` / `TripContext.jsx`,
  harmless, about Fast Refresh not full lint failures)

For a full manual walkthrough (sign-up, ride lifecycle, driver side, map
engine, PWA install), see [DEMO_GUIDE.md](DEMO_GUIDE.md).

---

## 🔭 Suggested Next Steps
1. **Manual live-network verification** of the map fixes (route gradient
   rendering, car marker snapping to a newly selected route) — this sandbox
   couldn't reach the tile/OSRM hosts to confirm visually. Build + deploy to
   Vercel, then run the passenger flow: request a ride and confirm the route
   line renders a blue→indigo gradient, then change the destination mid-flow
   and confirm the car snaps to the new route.
2. ~~**`switchRole()` data loss`**~~ — **DONE** (custom identity now
   preserved on role switch; new AuthContext tests added). Nothing left.
3. **Tile host reliability** — if the loading watchdog (fix #4) fires often
   in the wild, consider a paid/self-hosted tile provider instead of
   OpenFreeMap's free tier. Deferred: observe production metrics first.
