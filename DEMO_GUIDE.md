# 📱 Rush Rideshare — Interactive Demo Guide

Welcome to the **Rush Investor & Technical Demo Guide**. This document walks through all live features, state transitions, and test scenarios for reviewing the Rush Rideshare application.

---

## 🔗 Live Application URLs
* **Main Web App**: [https://rush-riderapp.vercel.app/](https://rush-riderapp.vercel.app/)
* **Backup Mirror**: [https://rush-riderapp2.vercel.app/](https://rush-riderapp2.vercel.app/)

---

## 🎯 Key Test Scenarios & Feature Walkthroughs

### 1. Passenger Ride Lifecycle Test
1. Open the app on mobile or desktop.
2. In the **Passenger** view (default):
   * Select a quick destination chip (e.g. `Downtown Tech Hub`, `Cyber Tower`, or `Skyport West`).
   * Or tap anywhere on the **Cyber Grid map** to drop custom pickup coordinates (`Grid (x, y)`).
3. Tap **Choose Tier for [Destination]**.
4. Observe the 4 ride tiers (*Rush Mini*, *Rush Express*, *Rush Black*, *Rush XL*).
5. Inspect the **FairFare™ Payout Breakdown Ticker** showing the 88% driver retention vs 12% platform fee.
6. Tap **Confirm Rush Express**.
7. On the searching screen:
   * Tap **⚡ Auto-Match Demo Driver** to simulate instant driver dispatch (*Marcus Vance* in Tesla Model Y).
8. Observe live route progress on the map.
9. Tap **Start Ride Demo**, then **Complete Ride**. Notice the fare deduction and completion toast.

---

### 2. Driver Operator Test
1. In top header bar, switch the toggle pill from **Passenger** to **Driver**.
2. Toggle the driver status switch to **Online & Listening**.
3. View the driver dashboard summary:
   * Today's Earnings
   * Completed Trips Count
   * 88% Keep Rate Confirmation
4. When a passenger requests a ride (or test request is active), view the live **Nearby Dispatch Request** card.
5. Tap **Accept Ride ($21.91 Payout)**.
6. Progress through **Navigate to Pickup** -> **Arrived & Start Ride** -> **Complete Trip & Payout**.

---

### 3. Wallet & Financial Refill Test
1. Tap **Wallet** in the bottom navigation bar.
2. Review active rider/driver balance.
3. Tap test deposit refill chips (**+$25**, **+$50**, **+$100**).
4. Observe tactile haptic vibration and instant balance updating.
5. Inspect recent activity transaction ledger.

---

### 4. Map Engine & Mode Switching Test
1. On the top left of the map container, switch between:
   * **Cyber Grid**: 60 FPS vector map with custom Bezier route calculations, pulse radar scans, and interactive tap-to-pin features.
   * **Real Map**: Dark-mode inverted OpenStreetMap iframe layer for geographic context.
2. Notice the **"Map Active"** telemetry indicator badge in top right.

---

### 5. PWA Installation (Mobile Safari / Chrome)
* **iOS Safari**: Tap *Share* -> *Add to Home Screen*.
* **Android Chrome**: Tap *Install App* or *Add to Home Screen*.
* Launch in standalone mode to experience zero status-bar browser chrome and native-feel performance.
