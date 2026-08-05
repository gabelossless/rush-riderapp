# ⚡ Rush — Next-Generation Rideshare (Investor Demo & PWA)

> **Rideshare, Reimagined.** Built for high driver retention with the **FairFare™ Payout Model**, zero platform markups, live dual-view operator tracking, and ultra-fast mobile PWA performance.

---

## 🌐 Live Deployments

* 🟢 **Primary Demo App**: [rush-riderapp.vercel.app](https://rush-riderapp.vercel.app/)
* 🟢 **Secondary Mirror**: [rush-riderapp2.vercel.app](https://rush-riderapp2.vercel.app/)

---

## ✨ Key Features & Highlights

### 🚗 1. Dual Operator View System
Switch seamlessly between **Passenger** and **Driver Operator** views in real-time within a single application frame:
* **Passenger Mode**: Request rides, compare tier pricing, set pickup/destination coordinates, toggle ride preferences (*Quiet Ride*, *AC Control*, *Express Lane*), and track en-route drivers.
* **Driver Mode**: Go online/offline, view live nearby ride request broadcasts, place driver bids, start trips, and receive 88% instant payouts.

### 💰 2. FairFare™ Payout Architecture
Unlike legacy platforms taking up to 45%–55% commission, Rush features an ultra-transparent revenue model:
* **88% Net Driver Payout**: Driver partners keep 88% of every fare.
* **12% Fixed Platform Fee**: Covers platform infrastructure, safety insurance, and dispatch telemetry.
* **Live FairFare Ticker**: Interactive visual fee split bar displayed on every ride tier confirmation screen.

### 🗺️ 3. Resilient Multi-Mode Map Engine
* **Cyber Grid Vector Engine**: Lightweight, offline-capable 60 FPS SVG map with dynamic Bezier route paths, pulse radar scans, animated vehicle telemetry, and tap-to-pin coordinate placement.
* **Real Map (OpenStreetMap)**: Dark-mode inverted OpenStreetMap iframe layer for live geographic context.
* **Automatic Load Protection**: Integrated React Error Boundary and a network reachability preflight check (rather than trusting the iframe's own load events, which fire even on a blocked connection) to ensure the map view never crashes or displays a blank screen.

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
```

---

## 📋 Investor & Tester Demo Script

1. **Authenticate / Switch Profile**:
   * Tap **Log In** (or profile avatar in top right header).
   * Tap **Quick Presets** to log in as **Alex Rivera** (Rider) or **Marcus Vance** (Driver), or create a custom profile.
2. **Book a Ride (Passenger View)**:
   * Select a Quick Destination chip (e.g. *Downtown Tech Hub* or *Cyber Tower*).
   * Tap **Choose Tier for Downtown Tech Hub**.
   * Compare tiers (*Rush Mini*, *Rush Express*, *Rush Black*, *Rush XL*) and inspect the **FairFare Payout split**.
   * Tap **Confirm Rush Express**.
3. **Driver Auto-Match / Live Toggle**:
   * On the searching screen, tap **⚡ Auto-Match Demo Driver** for instant 1-person testing, OR toggle the header pill to **Driver** mode to accept the request live.
4. **Complete Trip & Check Wallet**:
   * Tap **Start Ride Demo**, then **Complete Ride**.
   * Open **Wallet** from bottom navigation to view test balances and instant deposit refills ($25, $50, $100).

---

## 📄 License
MIT License © 2026 Rush Mobility Inc.
