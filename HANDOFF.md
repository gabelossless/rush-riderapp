# 🤝 Agent Handoff & Project Status Report

**Repository**: [github.com/gabelossless/rush-riderapp](https://github.com/gabelossless/rush-riderapp)
**Status**: 🟢 Clean working directory, build and lint both pass.

---

## 🌐 Live Deployment
- 🟢 **Primary App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/)

---

## 📦 Recent Notable Fixes
- `fix: black-screen map bug + remote dev preview access` — the Cyber Grid
  map's colors were nearly identical to the app background (a handful of
  RGB units apart), so it rendered as a solid black rectangle; brightened
  the palette so the city grid is actually visible. Also replaced the
  unreliable iframe `onLoad`-based Real Map failure detection with a
  `fetch()` network preflight, and fixed the dev/preview server rejecting
  requests from a non-`localhost` `Host` header (breaks remote/cloud
  preview environments).
- `fix: single fare charge, functional tips + 5-star rating, root error
  boundary, remove dead CSS`
- `feat: complete rider sign-up, login & demo ride requesting flow`

See `git log` for the full history.

---

## 🧩 Key Architecture & Components Summary

### 1. Dual Operator Architecture ([App.jsx](src/App.jsx))
- **Passenger View (`PassengerViewContent`)**: Full rider requesting lifecycle, destination search, pick-up pin placement, ride tier selection, FairFare breakdown, 1-tap auto-driver match demo, and trip completion controls.
- **Driver Operator View (`DriverViewContent`)**: Online/offline listener, 88% net earnings dashboard, nearby dispatch broadcast card, 2-stage trip acceptance (`ACCEPTED` -> `IN_PROGRESS` -> `COMPLETED`).

### 2. Authentication Context ([AuthContext.jsx](src/context/AuthContext.jsx) & [AuthModal.jsx](src/components/AuthModal.jsx))
- **Quick Presets**: 1-tap login for **Alex Rivera** (Rider) or **Marcus Vance** (Driver).
- **Custom Account Auth**: Rider/Driver role selection, name, and email fields.
- **Session Controls**: Integrated **Log Out** button & state persistence via `localStorage` (`rush_user_session`).

### 3. Resilient Map Engine ([MapEngine.jsx](src/components/MapEngine.jsx))
- SVG Bezier path length fallbacks, Euclidean distance calculations (`Math.hypot`), defensive coordinate checks, a `fetch()` network preflight before mounting the OpenStreetMap iframe (so a blocked network shows a clear fallback instead of a blank pane), and a React `MapErrorBoundary`.

### 4. PWA & Mobile UX ([PWAInstallPrompt.jsx](src/components/PWAInstallPrompt.jsx) & [haptics.js](src/utils/haptics.js))
- **iOS & Android PWA Install Banner**: Detects standalone mode, prompts 1-tap Android install or iOS Safari Share guide, respects dismissal in `localStorage`.
- **Haptic Vibrations**: `triggerHaptic` helper called across tab switches, tier selections, and fund refills.
- **App Icons**: Generated procedurally from `scripts/generate-icons.ps1` (Windows/PowerShell). A Python/Pillow port of the same drawing logic was used to regenerate `public/*.png` after the checked-in files were found to be five copies of one unrelated JPEG mislabeled `.png`.

---

## 🛠️ Verification & Build Commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Lint: `npm run lint` (0 errors)
