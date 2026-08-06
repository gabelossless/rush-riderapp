# 🤝 Agent Handoff & Project Status Report

**Repository**: [github.com/gabelossless/rush-riderapp](https://github.com/gabelossless/rush-riderapp)
**Status**: 🟢 Clean working directory on `main`, build and lint both pass, live deployment verified error-free.

---

## 🌐 Live Deployment
- 🟢 **Primary App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/) (Vercel, auto-deploys `main` via GitHub integration)

---

## 📦 This Session's Work (chronological)

1. **Black screen bug** — the Cyber Grid map's SVG colors were only a few RGB
   units from the app background, so the map (the dominant visual element)
   rendered as solid black. Brightened the palette. Also replaced the
   unreliable iframe `onLoad`-based Real Map failure detection with a
   `fetch()` network preflight (a blocked/reset connection still fires
   `onLoad` for the browser's own error page), and fixed the dev/preview
   server rejecting requests from a non-`localhost` `Host` header, which
   breaks remote/cloud preview environments.
2. **Project cleanup** — regenerated the PWA icons (all five were
   byte-identical JPEGs mislabeled `.png`, ignoring their declared sizes);
   removed dead assets (`vite.svg`, `hero.png`, an unrelated social-icon
   sprite sheet); wired up the unused `favicon.svg`.
3. **UX pass toward Uber/Lyft conventions** — decluttered the header (was:
   logo + pulsing badge + wallet pill + a half-width Passenger/Driver
   segmented pill + duplicate nav icons), simplified the map-mode picker
   to a single icon button, moved ride preferences into progressive
   disclosure, and hid the bottom tab bar during an active
   search/trip/completion (map + sheet only, like a real trip-tracking
   screen).
4. **Toned down the neon/cyberpunk look** — pure neon cyan (`#00F0FF`) and
   violet (`#7000FF`) softened to sky blue (`#38BDF8`) and indigo
   (`#6366F1`); removed ~40 colored glow shadows and rainbow gradients
   stacked on nearly every button/badge/card, replacing them with solid
   fills and neutral elevation shadows.
5. **Dropped the fake phone-frame mockup** — the app was boxed into a
   fixed 410×820 bezel centered in the browser with a marketing sidebar
   beside it. Now a real full-viewport web app: the map goes edge-to-edge
   on any screen size, and the interactive panels (header, ride-request
   sheet, tab bar) cap themselves to a comfortable width and center over
   it, the same pattern Uber's own web app uses.
6. **Two large feature commits landed directly on `main`** (not from this
   session): a rewritten email-first sign-up/landing flow
   (`SignUpFlow.jsx`) and a single-screen ride-confirm sheet
   (`RideConfirmSheet.jsx`) replacing the old multi-screen tier-compare
   flow. **This introduced a critical bug**: `StepLanding` in
   `SignUpFlow.jsx` referenced `emailRef`, a variable that only existed in
   the *parent* component's scope and was never passed down — since the
   landing step renders first for anyone not logged in, this threw a
   `ReferenceError` on first paint for **every signed-out visitor**. Fixed
   by removing the stray `ref` (the input already had `autoFocus`, which
   is all it needed). Also fixed while in there: deduped a fare-calculation
   formula that existed independently in both `App.jsx` and
   `RideConfirmSheet.jsx` (agreed only by coincidence of copy-paste — now
   `basePrice` is computed once and passed down), renamed
   `AuthModal.jsx` → `AccountModal.jsx` to match what the component was
   already renamed to internally, and brought `README.md`/`DEMO_GUIDE.md`
   back in sync with the actual current flow.

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
  completed`.
- **`DriverViewContent`**: online/offline toggle, 88% earnings dashboard,
  incoming-request card with honest distance/ETA copy, 2-stage trip
  acceptance (`ACCEPTED` → `IN_PROGRESS` → `COMPLETED`).

### 4. Auth context ([AuthContext.jsx](src/context/AuthContext.jsx) &
[AccountModal.jsx](src/components/AccountModal.jsx))
- `findKnownUser(email)` / `loginWithEmail(email)` / `demoLogin(role)` /
  `register(...)` back the sign-up flow above; known emails persist to
  `localStorage` (`rush_known_emails`).
- `AccountModal` (post-rename) is purely the signed-in profile panel now —
  balance, rating, rides, role switch, logout. It no longer handles
  sign-up; that's fully `SignUpFlow`'s job.
- **Known rough edge (pre-existing, not yet fixed)**: `switchRole()` fully
  replaces the signed-in user with a hardcoded preset record, so a custom
  name/vehicle registered through `SignUpFlow` is discarded on role
  switch. Low-priority — flag if it comes up.

### 5. Resilient map engine ([MapEngine.jsx](src/components/MapEngine.jsx))
SVG Bezier path length fallbacks, Euclidean distance calculations
(`Math.hypot`), defensive coordinate checks, a `fetch()` network preflight
before mounting the OpenStreetMap iframe (so a blocked network shows a
clear fallback instead of a blank pane), and a React `MapErrorBoundary`.
Cyber Grid is the default; Real Map is opt-in via a small icon toggle.

### 6. PWA & mobile UX ([PWAInstallPrompt.jsx](src/components/PWAInstallPrompt.jsx) & [haptics.js](src/utils/haptics.js))
iOS/Android install banner respecting `localStorage` dismissal; haptic
feedback via `triggerHaptic` across tab switches, tier selection, wallet
refills. App icons are generated procedurally — see
`scripts/generate-icons.ps1` (Windows/PowerShell original) or the
Python/Pillow port used this session to regenerate `public/*.png`.

---

## 🛠️ Verification & Build Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Lint: `npm run lint` (0 errors, 2 pre-existing warnings — both
  `react(only-export-components)` in `AuthContext.jsx` / `TripContext.jsx`,
  harmless, about Fast Refresh not full lint failures)

For a full manual walkthrough (sign-up, ride lifecycle, driver side, PWA
install), see [DEMO_GUIDE.md](DEMO_GUIDE.md).
