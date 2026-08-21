# 📱 Rush Rideshare — Interactive Demo Guide

Welcome to the **Rush Investor & Technical Demo Guide**. This document walks through the live app, the sign-up experience, and every ride state for reviewing Rush — a human-driven rideshare with fair fares.

---

## 🔗 Live Application URLs
* **Main Web App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/)
* **Backup Mirror**: [https://rush-riderapp2.vercel.app/](https://rush-riderapp2.vercel.app/)

---

## 🚪 1. Welcome / Sign-Up (The Front Door)

Every visitor lands on the **welcome page** first — no app access without it. This is the "Apple-level" auth gate:

1. See the full-screen brand moment: RUSH logo lockup, "100% Human. 0% Autopilot." pill, and the premium black-car background.
2. **Two equal paths:**
   * **Enter an email → Get Started.** New email → name → role (Rider/Driver) → driver branch adds vehicle + **Human Driver Pledge** → animated success → Enter Rush.
   * **Recognized email** (try `alex.rider@rushtest.com`) → "Welcome back, Alex" → one-tap continue (passwordless, trust-device).
   * **Explore the Demo** → one-tap preset accounts (*Alex Rivera — Rider*, *Marcus Vance — Driver*).
3. Logging out (avatar → Account → Log Out) returns to this screen.

**Demo emails to try:** `alex.rider@rushtest.com` (rider), `marcus.driver@rushtest.com` (driver). Any other email creates a fresh account.

---

## 🚗 2. Passenger Ride Lifecycle Test

1. After signing in (or **Explore the Demo → Alex Rivera**), a short **RUSH brand beat** plays (~5s): a car pulls up, a transparent fare card shows "$24.90 — No surge, 88% to the driver," then fades out. Tap anywhere to skip. You then land on the map with a single **"Where to?"** bar — the primary action.
2. Pick a saved place (**Home / Work**), a **Recent** destination, tap **"Where to?"** to search Denver destinations (Union Station, DIA, Red Rocks, Cherry Creek, Ball Arena…), or type any real address (live geocoded).
3. On the **Confirm** sheet, everything is one screen:
   * Route summary with walking note ("~2 min walk to pickup")
   * **Pre-selected Rush Standard** with the price most prominent; tap **Change** to compare Express/XL
   * **FairFare chip**: "88% of your fare goes to your driver" — tap for the visual split gauge + full breakdown
   * **"No surge games — the price you see is the price you pay."**
4. Tap **Request Rush Standard**.
5. **Honest searching state**: "Matching you with a human driver… usually 2–4 min in your area." A "pinging nearby drivers" pulse animation plays; after ~6s the copy honestly expands: "Still searching — expanding to nearby neighborhoods." The whole lifecycle from here auto-advances — no buttons needed to watch it happen — or switch to Driver view at any point to accept and run it live from the other side.
6. Matched screen shows driver + **"Verified Human"** badge, car, rating, plate. Watch the **map**: the car genuinely animates from a simulated driver position to your pickup pin, "arrives," then animates from pickup to your destination — not a single straight-line hop. A shield icon next to the fare opens **real** safety actions (Call 911, share trip status).
7. Trip auto-completes once the car reaches the destination. Completed screen: driver avatar, a **Driver Payout | Total Paid** split box (tap to expand the full breakdown), a tip selector with a **custom amount** option, and a 5-star rating with confetti on success.

---

## 👨‍✈️ 3. Driver Operator Test

1. Tap the **Rider/Driver** pill in the header (or sign up as a driver).
2. Toggle **Online & Listening**.
3. Dashboard: Today's Earnings, Trips, 88% Keep Rate.
4. Incoming request card shows honest details: **"Pickup is 1.6 mi away — about 4 min drive"** (a real distance computed from a simulated driver position, not the trip's total distance) and the payout up front.
5. **Accept Rush Ride** → the map animates you toward the pickup pin (a shield icon next to the destination opens real safety actions) → **Start Ride** → drive to dropoff → **Complete Ride & Claim Payout** (88% credited to wallet). One-tap **Google Maps** / **Waze** buttons hand off real navigation for whichever leg is active.

---

## 💳 4. Wallet & Financial Test

1. Tap **Wallet** in the bottom nav.
2. Review balance; tap **+$25 / +$50 / +$100** refill chips (haptic feedback included).
3. Inspect the transaction ledger.

---

## 🗺️ 5. Map Engine — Real Denver, Live Fleet

* **Real vector map**: MapLibre GL + OpenFreeMap dark style — a real map of **Denver & Colorado**, free forever, no API key.
* **GPS boot**: on app entry the map flies to your actual location. If GPS is denied, it reveals **all of Colorado** with a **"Focus Denver"** pill to zoom back in.
* **Live fleet (40+ cars)**: simulated Rush drivers roam the metro continuously, rendered as directional arrows rotated to their real heading — the map feels alive.
* **Surge zones**: six pulsing warm anchors (DIA, Union Station, Coors Field, Red Rocks, 16th St Mall, Cherry Creek).
* **Real driving routes**: pickup → destination is routed through the public OSRM engine (Union Station → DIA is a real ~42 km drive), with the car animating along actual roads, rotating to face its direction of travel, and a live ETA/distance-remaining HUD ticking down as the trip progresses.
* **Two-leg trip animation**: the car doesn't just animate pickup → dropoff — it animates driver → pickup first (a simulated starting position, honest distance/ETA shown to the driver), "arrives" once it actually reaches the pin, then animates pickup → dropoff. The ETA HUD labels which leg is active ("To pickup" / "To destination").
* **Cinematic tilt + 3D buildings**: the map eases into a driving-perspective tilt once a trip is in progress, and renders real building extrusions where the vendor tiles include them (try zooming into a short trip, e.g. Home → Work).
* **Type any address**: pickup and destination search live-geocode free-text addresses via OpenStreetMap Nominatim — not limited to the Denver preset list.
* **Tap to pin**: tap anywhere on the map to set a custom pickup ("Pinned location").
* **Offline fallback, redesigned**: if WebGL/network is unavailable (or the free tile host is unreachable), the app switches to a stylized simplified map — soft ambient glows, implied city blocks, a directional car marker — designed to read as a deliberate style choice, not a broken state.

## 🧭 5b. Driver Navigation Handoff

* Once a driver accepts a ride, the active-trip card shows **"Google Maps"** and **"Waze"** buttons that deep-link into the driver's own installed app with the real pickup coordinates — then automatically switch to the dropoff coordinates once the ride starts. Rush shows the address; the driver's own phone does the actual turn-by-turn.

---

## 🛡️ 6. Safety Access

A shield icon sits next to the fare on every active-trip screen, rider and driver alike. It opens two real actions, not a menu: **Call 911** (opens the actual phone dialer) and **Share trip status** (hands the driver's name, plate, and route to someone you trust via the native share sheet, with a clipboard fallback).

---

## 📲 7. PWA Installation

* **iOS Safari**: Share → *Add to Home Screen*.
* **Android Chrome**: *Install App* / *Add to Home Screen*.
* Launches standalone with no browser chrome; background image and app shell precached (~566 KB total; map loads on demand).

---

## 🧪 8. Test Checklist

| Scenario | How |
|---|---|
| New rider sign-up | Email → name → Rider → success |
| New driver sign-up | Email → name → Driver → vehicle + pledge → success |
| Returning user | `alex.rider@rushtest.com` → Welcome back, one tap |
| Demo presets | Explore the Demo → Alex Rivera / Marcus Vance |
| Ride request | Where to? → destination → confirm → request |
| Two-leg animation | Request a ride → watch the car animate driver → pickup → dropoff, not a single hop |
| Safety access | Matched/active-trip screen → shield icon → Call 911 / Share trip status |
| Cross-role demo | Rider requests → header pill → Driver → accept |
| Logout | Avatar → Account → Log Out → back to welcome |

---

See [`ROADMAP.md`](./ROADMAP.md) for the plan taking this from demo to a
real MVP — what already transfers to production versus what has to be
rebuilt, and why the ride/customer experience comes first.
