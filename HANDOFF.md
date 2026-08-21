# 🤝 Agent Handoff & Project Status Report

**Repository**: [github.com/gabelossless/rush-riderapp](https://github.com/gabelossless/rush-riderapp)
**Status**: 🟢 `main` at `d6016db` (PRs [#7](https://github.com/gabelossless/rush-riderapp/pull/7),
[#8](https://github.com/gabelossless/rush-riderapp/pull/8), and
[#9](https://github.com/gabelossless/rush-riderapp/pull/9) merged — two-leg
trip animation, nav/map/safety redesign, MVP roadmap). Branch
`claude/ride-demo-maps-visuals-6wgly0` carries one more commit on top, not
yet in a PR: a post-merge polish pass (fallback-map pin clipping, tip
charging, accessibility labels — see entry 21 at the bottom of this file).
Lint clean, 47/47 tests across 5 files, build succeeds.
**Also see**: [`ROADMAP.md`](ROADMAP.md) — the demo→MVP transition plan
(what already transfers to production, what's demo-only and has to be
rebuilt, and a phased plan starting with the ride/customer experience).

---

## 🌐 Live Deployment
- 🟢 **Primary App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/) (Vercel, auto-deploys `main` via GitHub integration)
- ⚠️ **Known issue, unconfirmed root cause**: live screenshots from a real
  phone on LTE (not just this sandbox, which blocks the tile host by
  policy) showed the app stuck in the offline-fallback map / "Loading
  Denver map…" state. The free `tiles.openfreemap.org` host may be
  flaky or rate-limiting real traffic. Worth investigating before it
  affects a real demo — see "Suggested Next Steps" below.

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

### Latest session — map visuals, real addresses, driver nav handoff

9. **Map visuals** ([MapEngine.jsx](src/components/MapEngine.jsx)):
   the live fleet switched from plain circle dots to a symbol layer using a
   canvas-drawn arrow icon rotated to each car's real heading
   (`icon-rotate`); the trip car marker now uses MapLibre's built-in
   `Marker.setRotation()` (via `rotationAlignment: 'map'`) to face the
   direction of travel along the OSRM route; a 3D building `fill-extrusion`
   layer is added dynamically (only if the loaded style actually ships a
   `building` source-layer, so it degrades safely on any tile host); the
   map eases into a ~52° driving-perspective tilt once a trip is in
   progress (flat top-down otherwise); and a live ETA/distance-remaining
   HUD renders from the OSRM response's `duration`/`distance`, counting
   down as `carProgress` advances. Along the way, found and fixed a
   pre-existing bug in the route-fit code: `geometry.coordinates.forEach(...)
   .zoom(...).fitBounds(...)` was invalid chaining (`forEach` returns
   `undefined`) that threw on every successful route fetch and was silently
   swallowed by the `.catch()` — meaning `fitBounds` never actually ran and,
   more importantly, `setRouteVersion()` (right after it) never fired, so
   the car-animation effect's re-run trigger from the HANDOFF #3 fix was
   itself dead code. Fixed by splitting into separate statements.
10. **Real address geocoding** ([geocode.js](src/utils/geocode.js),
    [LocationSearch.jsx](src/components/LocationSearch.jsx)): pickup and
    destination both now support live free-text address search via
    OpenStreetMap Nominatim (free, no API key — same philosophy as the
    OpenFreeMap tiles / OSRM routing already in use), debounced 450ms with
    in-flight request cancellation (`useAddressSearch` hook). Destination
    search shows matching Rush presets plus live "any address" geocode
    results; selecting a geocoded destination with no preset `distance`
    field gets one estimated via straight-line `haversineMiles()` from
    pickup so the existing fare calc still has something to work with.
    Pickup gets its own autocomplete dropdown (plus a "Use current GPS
    location" quick action) that updates real `pickupCoords`, not just the
    display string — previously typing a custom pickup address left
    `pickupCoords` stale at the hardcoded default.
11. **Driver navigation handoff** ([navLinks.js](src/utils/navLinks.js),
    `DriverViewContent` in [App.jsx](src/App.jsx)): the driver's active-trip
    card now has "Google Maps" / "Waze" deep-link buttons targeting the
    current leg's real coordinates (pickup while `ACCEPTED`, dropoff while
    `IN_PROGRESS`) — Rush shows the address, the driver's own phone app does
    the actual turn-by-turn.
12. **Ride-flow visual polish**: `RideConfirmSheet` now renders an always-
    visible animated 88/12 FairFare split gauge (previously only numbers in
    a collapsed panel, despite the README claiming a "live visual fee split
    bar"); the searching screen shows a "pinging nearby drivers" pulse
    animation; the completed screen bursts a small confetti animation from
    the success checkmark on mount.

**Verification caveat for the next agent**: same as the prior session — this
sandbox's network policy blocks `tiles.openfreemap.org`,
`router.project-osrm.org`, *and* `nominatim.openstreetmap.org`, so the new
geocoding, 3D buildings, car rotation, and ETA HUD were verified by reading
MapLibre's API/style spec and Nominatim's response shape, not by watching
them render live. Worth a manual check on a real device/network: type a
non-preset street address into pickup and destination and confirm results
appear and the fare/route use the real coordinates; confirm the fleet arrows
visibly rotate as they roam; confirm the map tilts when a trip goes
`IN_PROGRESS`; and confirm the Google Maps/Waze buttons open with the
correct coordinates on a phone.

### Latest session — Trip History redesign + investor-demo UI polish

13. **`HistoryModal.jsx` rewritten.** The `date` field on every trip record
    was already there and was never rendered anywhere — a "history" screen
    with no dates on it. Now: trips are grouped under day headers
    (Today/Yesterday/`Aug 4`), each row shows its time, the header subtitle
    computes a real summary (`N rides · $X spent/earned`, role-aware via
    `useAuth`), and tapping a row expands the same driver/platform FairFare
    receipt breakdown used on the completed-ride screen — reusing that
    visual language instead of inventing a new one. Dropped the per-row
    "Completed ✓" badge: every trip in this data model is terminally
    `Completed` (`cancelRequest()` never appends to `tripHistory`), so it
    was 100% noise repeated on every card; the freed space went to the time,
    which is actually informative. Empty state now has a working "Book your
    first ride" button (`onClose()`) instead of being a dead end. Scroll
    container switched from a hardcoded `max-h-[400px]` + native scrollbar
    to viewport-relative (`85dvh`) + `no-scrollbar`, matching every other
    sheet in the app.
14. **`WalletModal.jsx` — fixed fake "Recent Activity."** It was two
    hardcoded rows ("+$50.00 Test Fund Deposit", "-$24.90 Rush Express
    Ride") that never changed no matter what the person testing the demo
    actually did — click "+$50" twice in front of an investor and the
    ledger visibly doesn't move. Replaced with a real feed merging actual
    `tripHistory` (fare debit for riders / 88% payout credit for drivers)
    with an in-session list of demo deposits, sorted by timestamp, capped
    at 5, with a proper empty state.
15. **`AccountModal.jsx` header** brought in line with the other three
    modals (Wallet/History/Feedback all use an icon badge + title +
    subtitle header; Account was plain text with no icon) — consistency
    across the four sheets instead of one being visibly different.
16. **`FeedbackModal.jsx`** — unselected category buttons were
    `text-white/40` on `bg-white/[0.03]`, low enough contrast to hurt
    readability; bumped to `/55`.

### Latest session — two-leg trip animation (driver → pickup → dropoff)

17. **The car never actually approached pickup.** User asked to verify:
    select a destination (Ball Arena), request a ride — does the car/driver
    visibly move from the driver's own location to pickup, then to dropoff?
    It didn't. `carProgress` only ever animated a single OSRM route
    (pickup → dropoff), and the progress ticker (`src/App.jsx`) only ran
    during `IN_PROGRESS` — during `ACCEPTED` ("Driver En Route", ~5s in the
    auto-lifecycle) the car sat completely still despite the UI claiming
    the driver was approaching. Also found a related honesty bug: the
    driver's incoming-request card ("Rider is X mi away") used the trip's
    *total* pickup→dropoff distance, not the actual driver-to-pickup
    distance.
    - **`src/utils/geocode.js`**: added `offsetLatLng(center, miles,
      bearingDeg)` — the great-circle inverse of the existing
      `haversineMiles`.
    - **`src/context/TripContext.jsx`**: `requestRide` now calls
      `simulateDriverApproach(pickupCoords)` — stands in for "dispatch
      already knows nearby driver positions when broadcasting an offer" (no
      second device to read real GPS from in a demo) — picking a random
      point 0.6–2.8mi from pickup and storing `driverStartCoords` +
      honest `pickupDistance`/`pickupEta` labels on the trip, computed from
      that same simulated point so the numbers can never contradict each
      other. `acceptRide` keeps a defensive fallback only for a trip
      persisted before this field existed.
    - **`src/App.jsx`**: the progress ticker now runs during `ACCEPTED` too
      (not just `IN_PROGRESS`) — same `currentTrip.progress` field, same
      ticker, drives both legs; `acceptRide`/`startRide` each reset it to 0
      for their leg. The auto-advance effect's `ACCEPTED` branch changed
      from a fixed 3500ms timer to `tripStatus === 'ACCEPTED' &&
      tripProgress >= 1` — progress-gated exactly like completion already
      was, so "driver arrived" now means the car actually reached the pin,
      not an arbitrary duration. Computed `mapRouteOrigin`/
      `mapRouteDestination` per view (driver's own `driverStartCoords` →
      pickup while `ACCEPTED`, pickup → dropoff otherwise) and threaded
      them into both `<MapShell>` call sites (rider's and driver's own map
      read the same simulated position). Fixed the "Rider is X away" card
      to use the new `pickupDistance`/`pickupEta` fields.
    - **`src/components/MapEngine.jsx`**: added `routeOrigin`/
      `routeDestination` props (default to `pickupCoords`/`dropoffCoords`,
      so any caller not passing them keeps the old single-route behavior)
      — the OSRM fetch, car animation, and ETA HUD all key off these now,
      while `pickupCoords`/`dropoffCoords` continue to place the pickup/
      dropoff pins regardless of which leg is animating. Same split
      applied to the offline SVG fallback (`routeFrom`/`routeTo` vs
      `pickup`/`dropoff`), since that's what actually renders on networks
      that can't reach the tile/OSRM hosts (including this sandbox). ETA
      HUD gained a "To pickup" / "To destination" label so it's clear
      which leg it's tracking.
    - Added **Ball Arena** as a real preset destination
      (`src/data/mockData.js`) — the user's own example, and genuinely
      useful Denver venue coverage.
    - **Verified live**, not just reasoned through: a scripted Playwright
      run against the offline fallback (this sandbox blocks the tile/OSRM
      hosts) read the actual `<g data-testid="fallback-car">` SVG
      transform and `localStorage`'s trip state directly (not scraped UI
      text — first pass used text matching and got a false-positive on an
      always-rendered checklist label, corrected to ground-truth state).
      Confirmed: `driverStartCoords` generated ~1.6mi from pickup; car
      genuinely moves during the approach leg (progress 0→0.33 over 2s,
      position delta ~4.6px); car visibly resets/snaps to the pickup point
      when leg 2 begins (9.7px jump); `dropoffCoords` correctly resolved
      to Ball Arena's real coordinates; leg 2 animates correctly; full
      trip still completes end-to-end (no regression of the earlier
      livelock fix). Added `data-testid="fallback-car"` to the fallback's
      car `<g>` purely as a test hook — no visual/behavioral change.

### Latest session — nav bar redesign, map polish, real safety access, research

User flagged the bottom nav as "poorly designed and old fashioned" from a
live screenshot of the deployed app, asked for the offline fallback map
("cyber grid") to be modernized, and asked for research into real
Uber/Lyft rider complaints plus an Apple/Jobs design lens applied to the
result.

**Research** (web search): the most consistently cited rideshare complaints are
surge-price opacity, driver-arrival uncertainty, and — cited by 45%+ of
riders, the single most common concern — poor safety access during a
ride. Sources: [sokolovelaw.com](https://www.sokolovelaw.com/blog/8-uber-rideshare-safety-tips/),
[estradalawgroup.com](https://www.estradalawgroup.com/blog/uber-safety-concerns-in-2026-why-riders-are-rethinking-the-app-and-what-you-should-know),
[unstar.app](https://unstar.app/blog/ride-sharing-app-reviews-uber-lyft-bolt-grab-2026).
Rush already differentiates on the first two by design (no surge, ever;
this session's two-leg animation + honest ETA work directly addresses
arrival uncertainty). Safety access had **zero** affordance anywhere in
the active-trip UI — closed that gap directly rather than only restyling.

18. **Bottom nav** ([App.jsx](src/App.jsx) — `BottomNav`, `NavItem`):
    - Removed the hand-drawn "home indicator" pill under the tabs
      (`<div className="mx-auto mt-2 h-1 w-24...">`). Every real device
      already draws its own; faking one was a common ~2018-era pattern
      that now just reads as dated, since virtually every user has the
      real thing.
    - Active state is a soft rounded highlight capsule behind the icon,
      not just a color change — but **only** the "Ride" tab ever carries
      it. Wallet/History/Feedback open modals, they don't become "the
      current screen," so giving them a persistent "selected" indicator
      would misrepresent a navigation structure the app doesn't have.
      New `NavItem` sub-component documents this reasoning inline.
    - Fixed a semantic mismatch: the "Ride" tab used a house (`Home`)
      icon; swapped to `Car`. `Home` import removed (no longer used
      anywhere in the file).
    - Floating glass treatment (backdrop blur + a soft lifted shadow)
      replacing a flat `border-t` — reads as a raised bar, not a divided
      section of the same flat surface.
19. **Offline fallback map** ([MapEngine.jsx](src/components/MapEngine.jsx)
    — `CyberGridFallback`, still the same function name internally, its
    old external persona): this is what actually renders on any network
    that can't reach `tiles.openfreemap.org` — including, per the live
    screenshots, possibly real production traffic, not just this sandbox.
    - Replaced the flat `#0A0D15` fill + uniform 0.6-opacity crosshatch
      grid ("graph paper") with a graduated radial-gradient ground plane,
      two low ambient glow ellipses (same blue/indigo pairing used
      throughout the app — `HeroMoment`'s ambient glows, the
      `text-gradient` utility), a handful of soft rounded "block" fills
      implying land use the way Apple Maps washes parks/blocks in a
      faint tint rather than leaving pure void, and two diagonal roads
      instead of a perfectly uniform lattice (Denver's actual downtown
      grid runs at an angle to the metro grid — a detail specific to
      this city, not generic).
    - Reframed `"OFFLINE MAP MODE"` — a large center-bottom admission of
      failure — into a small, quiet corner mark ("Rush Map · Simplified
      View") in the same screen position the real map's own "Live Denver
      Map" badge occupies, so switching between the two states reads as
      consistent product chrome, not a downgrade notice.
    - Car marker is now a rotating directional arrow/polygon (bearing
      derived from the active route's origin→destination, since the
      fallback route is one smooth bezier rather than per-segment OSRM
      geometry, so an overall bearing is a fair approximation) instead of
      a static rounded rect — parity with the real MapLibre map's arrow
      markers from an earlier session, instead of a visibly second-class
      fallback. Pickup ring now pulses (`<animate>`), matching the real
      map's `.rush-marker-ring` CSS animation, which the fallback
      previously didn't have.
20. **New**: [`SafetySheet.jsx`](src/components/SafetySheet.jsx) — two
    real actions, deliberately not a menu of icons: a `tel:911` link
    (opens the actual phone dialer) and a "Share trip status" button
    (Web Share API — `navigator.share()` — with a `navigator.clipboard`
    fallback when unsupported; message includes driver name/plate/route).
    Wired into both `PassengerViewContent`'s and `DriverViewContent`'s
    active-trip screens via a small shield-icon button next to the
    status badge; both get their own `showSafety` state, same component.
    - **Verified live** via Playwright screenshots (nav bar, fallback map,
      and the safety sheet opening/closing) — no console errors.

**Verification caveat, as always in this sandbox**: the fallback map is
what actually renders here (network policy blocks the tile host), so the
fallback redesign was screenshot-verified directly; the real MapLibre
map's equivalent visual quality was not (nothing about this session's
changes touched the real map's rendering path, only the fallback's — so
risk here is low, but a live-network check on the deployed preview is
still the more complete verification).

Lint clean, 47/47 tests, build succeeds.

---

21. **Post-merge polish pass** — after PR #9 merged, took a fresh round of
    Playwright screenshots across the full rider flow (edge-case address
    search, rapid taps, small/tall viewports, every modal) specifically
    hunting for bugs rather than confirming known-good states. Found and
    fixed three real ones:
    - **Fallback map: two of six preset destination pins were rendering
      off-screen.** The `CyberGridFallback` SVG uses
      `preserveAspectRatio="xMidYMid slice"` (cover behavior) so it fills
      any viewport without letterboxing — but on a typical tall/narrow
      phone screen that crops roughly the outer 20% off each horizontal
      edge, and `projectToGrid()` was mapping the full Denver bounding box
      edge-to-edge across the SVG's entire width with only a 20px margin.
      Measured live: **Denver International Airport**'s dropoff pin
      rendered at x=389–418 on a 390px-wide viewport — 97% of it past the
      right edge. Red Rocks Amphitheatre sat right at the opposite
      boundary. Fixed by widening `projectToGrid`/`projectToGridInverse`'s
      margin/scale (`GRID_X_MARGIN`/`GRID_X_SCALE` in
      [`MapEngine.jsx`](src/components/MapEngine.jsx)) so every preset
      destination lands with real headroom inside the band that survives
      the crop, in-town points barely moving. Verified live: DIA's pin now
      renders fully at x=347–376.
    - **The fallback map's own corner badge had the identical bug** — "Rush
      Map · Simplified View" was drawn inside the same cropped SVG
      coordinate space, so roughly the first third of the string ("Rush
      Map") was invisible, leaving a stray "· Simplified View" with no
      antecedent. Moved it out of the SVG entirely into a normal
      `absolute bottom-4 left-4` HTML overlay — the same technique the
      real map's own "Live Denver Map" badge already used — so it's flush
      to the actual screen edge regardless of the SVG's internal crop.
    - **Tipping was entirely cosmetic — no money ever moved.** The
      completed-trip screen's tip selector (including the $2/$5/$10
      presets, not just the custom-amount field) only ever changed the
      displayed "Total Paid" number; `tip` state was never passed to
      `deductRiderFare`, never credited to the driver, and never attached
      to the trip's history record. A rider could select a $10 tip, submit,
      and their wallet balance — checkable one tap away in the same
      session — would be unchanged. Fixed in three places: `finishCompleted`
      in [`App.jsx`](src/App.jsx) now calls `deductRiderFare(tip, {
      countsAsRide: false })` when the rider submits (the `countsAsRide`
      flag is new on `deductRiderFare` in
      [`AuthContext.jsx`](src/context/AuthContext.jsx) — it also increments
      `totalRides`, which the base fare already does once per trip, so a
      second call for the tip needed to opt out or every trip would count
      twice); a new `recordTip(tripId, amount)` action in
      [`TripContext.jsx`](src/context/TripContext.jsx) patches the tip onto
      the trip's already-written history entry, since the tip is chosen
      *after* `completeRide()` runs; and both
      [`WalletModal.jsx`](src/components/WalletModal.jsx)'s activity feed
      and [`HistoryModal.jsx`](src/components/HistoryModal.jsx)'s per-trip
      receipt now fold the tip in — 100% to the driver, no platform cut,
      unlike the base fare's 88/12 split (`HistoryModal`'s summary total
      keeps fare and tip sums separate internally for exactly this reason;
      combining them before applying `DRIVER_PCT` would have taxed the
      tip too). Verified live end-to-end: submitted a $10 tip, wallet
      balance dropped by exactly $10, `totalRides` didn't double-count,
      and the trip shows up in both History ("$23.74", tip line itemized)
      and Wallet ("-$23.74 · incl. $10.00 tip") correctly reconciled.
    - **Accessibility: every icon-only dismiss/back button in the app had
      zero accessible name** — not a regression from this session, a
      pre-existing gap across the whole codebase, discovered because a
      Playwright `getByLabel('Close...')` call couldn't find the Safety
      Sheet's close button. Added `aria-label` to all nine: the close (✕)
      buttons on `AccountModal`, `FeedbackModal`, `HistoryModal`,
      `WalletModal`, `SafetySheet`, and `PWAInstallPrompt`'s dismiss; the
      back (‹) buttons on `LocationSearch`, `RideConfirmSheet`, and
      `SignUpFlow`; and `LocationSearch`'s destination-clear button. A
      screen-reader user previously had no way to know what any of these
      nine buttons did.

    All three fixes verified with fresh Playwright runs reading
    `localStorage` ground truth (trip status, `tripHistory`, wallet
    balance) alongside screenshots — not scraped UI text, per the standing
    lesson from earlier in this project. Lint clean, 47/47 tests, build
    succeeds. **Not yet in a PR** — sitting on
    `claude/ride-demo-maps-visuals-6wgly0` as of this writing.

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
- Test: `npm test -- --run` (47 tests, 5 files, all passing as of this
  session — `geocode.js`/`navLinks.js` are network-dependent utilities in
  the same category as `MapEngine.jsx`, not unit-tested; see the map
  engine note above)
- Lint: `npm run lint` (0 errors, 2 pre-existing warnings — both
  `react(only-export-components)` in `AuthContext.jsx` / `TripContext.jsx`,
  harmless, about Fast Refresh not full lint failures)

For a full manual walkthrough (sign-up, ride lifecycle, driver side, map
engine, PWA install), see [DEMO_GUIDE.md](DEMO_GUIDE.md).

---

## 🔭 Suggested Next Steps

Roughly in priority order. Everything under "Demo polish" is scoped for
whoever's next on this branch/PR; everything under "MVP" is intentionally
**not started** — see [`ROADMAP.md`](ROADMAP.md) for the full plan and
why the ride/customer experience comes before it.

### Demo polish (small, scoped)
1. **Tile host reliability — now with real-world evidence, not just a
   sandbox limitation.** Live screenshots from a real phone on LTE showed
   the app stuck in offline-fallback / "Loading Denver map…" — this
   wasn't just this sandbox's network policy blocking
   `tiles.openfreemap.org`. Worth a real investigation: check whether the
   free tile host is rate-limiting, check the watchdog's 8s timeout isn't
   too aggressive for slower connections, and seriously consider a
   paid/self-hosted tile provider before this shows up in front of an
   investor. This item was previously "deferred, observe production
   metrics first" — the metrics have now been observed.
2. **Manual live-network verification** of the real MapLibre map's visual
   quality (3D buildings, cinematic tilt, live fleet arrows, the ETA HUD,
   the two-leg route animation) — every one of those was built and
   verified against the *offline fallback* in this sandbox, never the
   real tile-based map, because the sandbox can't reach the tile/OSRM/
   Nominatim hosts. The fallback and the real map share the same
   underlying state (`routeOrigin`/`routeDestination`/`carProgress`
   props), so risk is low, but nobody has actually watched the real map
   do any of this live. Deploy, then request a ride on a normal network
   and just watch the whole lifecycle play out.
3. **Nav bar / new-screen sweep** — the bottom nav and offline map got a
   full pass this session; the header (wallet/role/avatar pills) and a
   few other screens haven't had the same "would Steve Jobs approve"
   scrutiny applied. Worth a dedicated pass if there's appetite for more
   polish before moving to backend work.

### MVP — backlogged, not started
4. **Phase 0 (backend foundation)** — explicitly deferred per the user's
   own instruction ("backlog phase zero backend work for now"). See
   `ROADMAP.md` for the concrete starting point (Supabase: Postgres +
   Auth + Realtime, re-plumbing `AuthContext`/`TripContext` to talk to it
   instead of `localStorage`) whenever this is picked back up. Nothing
   in this repo currently depends on it existing — the whole point of
   the roadmap's sequencing is that the rider-facing UI keeps working
   and keeps improving independent of when backend work starts.

### Resolved, keeping for history
- ~~**`switchRole()` data loss`**~~ — **DONE** (custom identity now
  preserved on role switch; AuthContext tests added).
