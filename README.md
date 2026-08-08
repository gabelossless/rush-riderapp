# ⚡ Rush — Next-Generation Rideshare (Investor Demo & PWA)

> **Rideshare, Reimagined.** Built for high driver retention with the **FairFare™ Payout Model**, zero platform markups, live dual-view operator tracking, and ultra-fast mobile PWA performance.

---

## 🌐 Live Deployments

* 🟢 **Primary Demo App**: [rush-riderapp.vercel.app](https://rush-riderapp.vercel.app/)
* 🟢 **Secondary Mirror**: [rush-riderapp2.vercel.app](https://rush-riderapp2.vercel.app/)

---

## ✨ Key Features & Highlights

### 🚪 1. Auth-Gated Landing & Dual Operator View
Every visitor lands on a full-screen welcome/sign-up gate first — no app access without it. Email-first flow: a recognized email gets a one-tap "Welcome back," a new email walks through name → role (Rider/Driver) → success, and **Explore the Demo** offers one-tap preset accounts for investors who need to see the product in seconds. Once in, switch seamlessly between **Passenger** and **Driver Operator** views within a single application frame:
* **Passenger Mode**: Tap **"Where to?"**, pick a saved place or search a destination, then a single **Confirm** sheet shows a pre-selected tier with the price up front (tap *Change* to compare), a collapsible FairFare split, and one **Request** button — no multi-screen tier-compare flow.
* **Driver Mode**: Go online/offline, view live nearby ride request broadcasts with honest distance/ETA copy, accept and run trips, and receive 88% instant payouts.

### 💰 2. FairFare™ Payout Architecture
Unlike legacy platforms taking up to 45%–55% commission, Rush features an ultra-transparent revenue model:
* **88% Net Driver Payout**: Driver partners keep 88% of every fare.
* **12% Fixed Platform Fee**: Covers platform infrastructure, safety insurance, and dispatch telemetry.
* **Live FairFare Ticker**: Interactive visual fee split bar displayed on every ride tier confirmation screen.

### 🗺️ 3. Real Denver Map with Live Fleet
* **MapLibre GL + OpenFreeMap**: real vector map of **Denver & Colorado** in a dark style — free forever, no API key required.
* **GPS Boot**: flies to your actual location on entry; if GPS is denied, reveals all of Colorado with a **"Focus Denver"** pill to zoom back in.
* **Live Fleet (40+ cars)**: simulated Rush drivers roam the metro continuously; **surge zones** pulse at six anchors (DIA, Union Station, Coors Field, Red Rocks, 16th St Mall, Cherry Creek).
* **Real Driving Routes**: pickup → destination routed through the public OSRM engine with the car animating along actual roads.
* **Automatic Fallback**: if WebGL/network is unavailable, the app auto-switches to a simplified Denver grid engine — never a blank screen.

### 📱 4. Native-Grade Mobile PWA UX
* **Tactile Haptic Vibrations**: Haptic feedback (`navigator.vibrate`) on tab switches, ride option selection, preset taps, and wallet transactions.
* **Safe Area Insets (`env(safe-area-inset)`)**: Responsive layout designed for iOS notches, Dynamic Island, and Android gesture navigation bars.
* **PWA Standalone Support**: Installable Web Manifest (`manifest.webmanifest`) and Workbox Service Worker precaching (`sw.js`).
* **iOS Safari Input Lock**: Input text sizes pinned to prevent intrusive page auto-zooming.

---

## 🛠️ Technology Stack

* **Framework**: React 19 + Vite 8
* **Styling**: Vanilla CSS + TailwindCSS 3.4
* **Animations**: Framer Motion 13
* **Icons**: Lucide React Icons
* **Mapping**: MapLibre GL 6 + OpenFreeMap (tiles) + OSRM (routing)
* **PWA Engine**: `vite-plugin-pwa` + Workbox
* **Linter**: Oxlint

---

## 🚀 Quick Start (Local Development)

### Prerequisites
* Node.js v18+ 
* npm v9+

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/gabelossless/rush-riderapp.git
cd rush-riderapp

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build production bundle
npm run build

# 5. Run Oxlint code analysis
npm run lint

# 6. Run the Vitest test suite
npm test -- --run
```

---

## 📋 Investor & Tester Demo Script

1. **Sign In**:
   * Every visitor lands on the welcome screen first. Tap **Explore the Demo** for one-tap preset accounts — **Alex Rivera** (Rider) or **Marcus Vance** (Driver) — or enter an email to walk the real sign-up flow (`alex.rider@rushtest.com` / `marcus.driver@rushtest.com` are recognized "welcome back" accounts; any other email creates a fresh one).
2. **Book a Ride (Passenger View)**:
   * Tap **"Where to?"**, then pick a saved place, a recent trip, or search a Denver destination (Union Station, DIA, Red Rocks, Cherry Creek…).
   * On the **Confirm** sheet, the price for the pre-selected **Rush Standard** tier is front and center — tap **Change** to compare Rush Express / Rush XL, or the **FairFare** chip to see the 88/12 payout split.
   * Tap **Request Rush Standard**.
3. **Driver Auto-Match / Live Toggle**:
   * On the searching screen, tap **⚡ Auto-Match Demo Driver** for instant 1-person testing, OR toggle the header pill to **Driver** mode to accept the request live.
4. **Complete Trip & Check Wallet**:
   * Tap **Start Ride Demo**, then **Complete Ride**.
   * Open **Wallet** from bottom navigation to view test balances and instant deposit refills ($25, $50, $100).

See [DEMO_GUIDE.md](./DEMO_GUIDE.md) for the full walkthrough, including the driver-side flow and a test checklist.

---

## 📄 License
MIT License © 2026 Rush Mobility Inc.
