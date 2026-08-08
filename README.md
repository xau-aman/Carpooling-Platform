# GoTogether — Enterprise Employee Carpooling Platform

<div align="center">

![GoTogether](client/public/Logo_with_text.png)

**A full-stack enterprise carpooling platform built for the Odoo Hackathon 2025**

[![Live Demo](https://img.shields.io/badge/🌐_Web_App-Live_on_Vercel-black?style=for-the-badge)]([https://gotogether-carpool.vercel.app](https://carpooling-platform-client.vercel.app))
[![API Server](https://img.shields.io/badge/⚡_API-Live_on_Render-orange?style=for-the-badge)](https://carpooling-platform.onrender.com/api/v1/health)
[![Mobile APK](https://img.shields.io/badge/📱_Android_APK-Download-green?style=for-the-badge)](#mobile-apk)

</div>

---

## 🚀 Live URLs

| Service | URL |
|---------|-----|
| **Web App (Vercel)** | https://gotogether-carpool.vercel.app |
| **API Server (Render)** | https://carpooling-platform.onrender.com |
| **API Health Check** | https://carpooling-platform.onrender.com/api/v1/health |

> ⚠️ **Note:** The API server is on Render's free tier — it may take **30–60 seconds to wake up** on first request. Please wait for the health check to return `{"status":"ok"}` before testing.

---

## 🔑 Demo Accounts

All accounts use password: **`Demo@1234`**

| Role | Email | What to test |
|------|-------|-------------|
| **Admin** | `admin@gotogether.com` | Dashboard analytics, manage employees & vehicles, org settings |
| **Driver** | `driver@gotogether.com` | Offer rides, start trip, OTP verification, GPS simulation, earn money |
| **Employee** | `user@gotogether.com` | Find & book rides, live tracking, chat, pay via wallet |

> 💡 Each demo account has **100+ past completed trips** pre-loaded for rich history and analytics.

---

## ✨ Features

### For Employees (Passengers)
- 🔍 **Smart Ride Search** — Search rides by pickup/destination with map-based location picker
- 🗺️ **Route Preview** — Full interactive map with OSRM route calculation before booking
- 📊 **Match Score** — AI-style scoring based on route proximity (shown as % match)
- 📱 **Real-time Tracking** — Live driver location on map during trip
- 💬 **In-trip Chat** — Real-time messaging with driver via Socket.IO
- 💳 **Multiple Payment Methods** — Wallet, Cash, UPI, Card (Razorpay test mode)
- 📜 **Ride History** — Complete past trips with payment status
- 💰 **Wallet** — Add money via Razorpay or demo mode, view transaction history
- 🔔 **Push Notifications** — Real-time alerts for booking confirmations, trip updates

### For Drivers
- 🚗 **Offer Rides** — Publish rides with route map, fare, seats, schedule
- 🔐 **OTP Verification** — Secure passenger verification before trip starts
- 📍 **GPS Tracking** — Real-time location broadcast to passengers
- 🎮 **Simulate Movement** — Demo mode to simulate trip without actual GPS
- ✅ **Geofence Complete** — Trip can only be completed within 300m of destination
- ⭐ **Rate Passengers** — Post-trip rating system
- 💸 **Instant Earnings** — Wallet credited automatically on payment

### For Admins
- 📈 **Dashboard Analytics** — Total employees, vehicles, rides this month, completed trips
- 👥 **Employee Management** — Add employees, grant/revoke access
- 🚙 **Vehicle Registry** — View all registered vehicles across org
- 📊 **Reports** — Vehicle utilization charts, financial summary, distance stats
- ⚙️ **Org Settings** — Configure fuel cost/km, carpool policies

### Mobile App (Android)
- 📲 **Native Android APK** — Built with Capacitor + React
- 🗺️ **Full-screen Map Picker** — Uber/Rapido style location selection
- 🔔 **Native Push Notifications** — Local notifications via Capacitor
- 💳 **Razorpay Native** — Payment via same-origin iframe

---

## 🎬 Demo Flow (Step-by-Step for Evaluators)

### Flow 1: Book a Ride (as Employee)

1. Open https://gotogether-carpool.vercel.app
2. Click **"Employee"** quick login → auto-fills `user@gotogether.com` / `Demo@1234`
3. Click **Sign In** → lands on Dashboard
4. See **100 past trips** in Ride History, wallet balance, stats
5. Click **"Find a Ride"**
6. Enter Pickup: `Bopal, Ahmedabad` → Enter Destination: `Infocity, Gandhinagar`
7. Click **"Confirm Route"** → See interactive map with route, distance, duration
8. Click **"Find Matching Rides"** → See available rides with match scores
9. Click **"Book Now"** on any ride → Redirected to Trip Details

### Flow 2: Start & Complete a Trip (as Driver)

1. Open new tab → Login as `driver@gotogether.com`
2. Go to **My Trips** → See upcoming trip
3. Click **"Start Trip"** → OTP generated and sent to passenger
4. Switch to employee tab → See OTP displayed
5. Enter OTP in driver tab → Trip status changes to **IN PROGRESS**
6. Click **"Simulate"** → Watch driver marker move on passenger's map in real-time
7. Both users can **Chat** during the trip
8. After simulation, click **"Complete Trip"**
9. Passenger sees **"Payment Pending"** → Click **"Pay Now"**
10. Select **Wallet** → Payment processed → Driver wallet credited instantly

### Flow 3: Admin Analytics

1. Login as `admin@gotogether.com`
2. Dashboard shows org-wide stats (250+ trips, employees, vehicles)
3. Go to **Reports** → Vehicle utilization chart, financial summary
4. Go to **Employees** → Add/manage employees, grant/revoke access
5. Go to **Settings** → Configure fuel cost, carpool policies

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite + TypeScript | Web application |
| **Styling** | Tailwind CSS v4 | Neobrutalism design system |
| **Animations** | GSAP | Page transitions, card animations |
| **Charts** | Recharts | Admin analytics charts |
| **Maps** | Leaflet + OpenStreetMap + OSRM | Route display, live tracking |
| **Backend** | Node.js + Express + TypeScript | REST API server |
| **Realtime** | Socket.IO | Live tracking, chat, notifications |
| **Database** | Neon PostgreSQL (serverless) | Primary data store |
| **ORM** | Prisma | Type-safe DB queries |
| **Auth** | JWT (access) + HTTP-only cookies (refresh) | Secure authentication |
| **Payments** | Razorpay Test Mode | UPI, Card, Wallet payments |
| **Mobile** | Capacitor + React | Android native app |
| **Hosting** | Vercel (frontend) + Render (backend) | Production deployment |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  Vercel (React + Vite)          Mobile (Capacitor Android)  │
│  gotogether-carpool.vercel.app  GoTogether-v6.0-debug.apk   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS + WSS
┌──────────────────────▼──────────────────────────────────────┐
│                       SERVER LAYER                           │
│         Render (Node.js + Express + Socket.IO)               │
│         carpooling-platform.onrender.com                     │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  REST API   │  │  Socket.IO   │  │   Razorpay API    │  │
│  │  /api/v1/*  │  │  Real-time   │  │   Payment Gateway │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────▼──────────────────────────────────────┐
│                      DATABASE LAYER                          │
│              Neon PostgreSQL (Serverless)                    │
│         17 tables · 250+ trips · 23 users seeded            │
└─────────────────────────────────────────────────────────────┘
```

### Server Architecture Pattern
```
routes/ → controllers/ → services/ → repositories/ → Prisma → DB
                ↓
           sockets/ (Socket.IO real-time events)
```

---

## 📁 Project Structure

```
Carpool-Management-System/
│
├── client/                      # React Web App (deployed on Vercel)
│   ├── public/
│   │   └── only_logo.png        # App logo
│   ├── src/
│   │   ├── components/          # Reusable UI — Button, LocationSearch, RouteMap
│   │   ├── context/             # AuthContext, AuthProvider, ToastContext
│   │   ├── features/
│   │   │   ├── admin/           # AdminDashboard, Employees, Vehicles, Reports, Settings
│   │   │   └── tracking/        # LiveMap, ChatPanel
│   │   ├── layouts/
│   │   │   └── AppShell.tsx     # Sidebar nav + mobile drawer + notification badge
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance with JWT interceptor + auto-refresh
│   │   │   ├── socket.ts        # Socket.IO client singleton
│   │   │   └── tokenStore.ts    # Token persistence (memory + localStorage)
│   │   ├── pages/               # Dashboard, FindRide, OfferRide, TripDetail, Wallet, etc.
│   │   └── types/               # Full TypeScript type definitions
│   └── vercel.json              # SPA routing rewrite for Vercel
│
├── mobile/                      # Android App (Capacitor)
│   ├── src/
│   │   ├── components/          # MapPicker, LiveMap, OtpCard, RazorpayCheckout
│   │   ├── pages/               # All mobile pages
│   │   └── lib/
│   │       └── notifications.ts # Capacitor local notifications
│   ├── public/
│   │   └── razorpay.html        # Same-origin Razorpay iframe
│   └── android/                 # Native Android project
│
├── server/                      # Node.js API (deployed on Render)
│   ├── prisma/
│   │   ├── schema.prisma        # 17-model DB schema
│   │   └── seed.ts              # 250+ records seed script
│   └── src/
│       ├── config/              # env.ts, prisma.ts (with retry logic)
│       ├── controllers/         # Thin HTTP handlers
│       ├── middleware/
│       │   └── auth.ts          # JWT authentication middleware
│       ├── repositories/        # All DB queries (no $transaction — Neon compatible)
│       ├── routes/              # Express routers
│       ├── services/            # Business logic layer
│       ├── sockets/             # Socket.IO event handlers
│       └── utils/               # jwt.ts, response.ts
│
└── render.yaml                  # Render deployment config
```

---

## 🔌 API Reference

**Base URL:** `https://carpooling-platform.onrender.com/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login → returns JWT access token + sets refresh cookie |
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/refresh` | Refresh access token via HTTP-only cookie |
| `POST` | `/auth/logout` | Clear refresh cookie |
| `GET` | `/auth/me` | Get current user (requires Bearer token) |
| `GET` | `/auth/organizations` | List all organizations (for signup) |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/rides/search?pickupLat&pickupLng&destLat&destLng&departureTime&seats` | Search matching rides with score |
| `POST` | `/rides` | Offer a new ride |
| `GET` | `/rides` | My offered rides |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/bookings` | Book a ride `{ rideId, seats }` |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/trips` | My trips (as driver or passenger) |
| `GET` | `/trips/:id` | Trip details with participants, messages |
| `POST` | `/trips/:id/start` | Driver starts trip → generates OTP |
| `POST` | `/trips/:id/verify-otp` | Driver verifies passenger OTP |
| `POST` | `/trips/:id/complete` | Driver completes trip |
| `POST` | `/trips/:id/cancel-ride` | Driver cancels entire ride |
| `POST` | `/trips/:id/cancel-booking` | Passenger cancels their booking |

### Payments & Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payments/pay` | Pay for a trip `{ bookingId, tripId, amount, method }` |
| `POST` | `/payments/order` | Create Razorpay order |
| `GET` | `/wallet` | Wallet balance + transaction history |
| `POST` | `/wallet/recharge` | Add money to wallet |

### Admin (requires ADMIN role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Org stats — employees, vehicles, rides, trips |
| `GET` | `/admin/employees` | List all employees |
| `POST` | `/admin/employees` | Add employee |
| `PATCH` | `/admin/employees/:id/access` | Grant/revoke access |
| `GET` | `/admin/vehicles` | All org vehicles |
| `GET` | `/admin/reports` | Trip stats, vehicle utilization, financials |
| `GET` | `/admin/settings` | Org + carpool settings |
| `PUT` | `/admin/settings` | Update settings |

### Misc
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/vehicles` | My vehicles |
| `POST` | `/vehicles` | Add vehicle |
| `GET` | `/saved-places` | My saved places |
| `POST` | `/ratings` | Submit rating |
| `GET` | `/notifications` | My notifications |

---

## ⚡ Socket.IO Events

**Connection:** `wss://carpooling-platform.onrender.com`
Auth: `{ token: "<JWT>" }` passed in socket handshake

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `user:join` | Client → Server | `userId` | Join personal notification room |
| `trip:join` | Client → Server | `tripId` | Join trip room for updates |
| `trip:leave` | Client → Server | `tripId` | Leave trip room |
| `trip:location` | Client → Server | `{ tripId, lat, lng, heading, speed }` | Driver broadcasts GPS location |
| `trip:location` | Server → Client | `{ lat, lng, heading, speed }` | Passenger receives driver location |
| `trip:simulate` | Client → Server | `{ tripId, waypoints[] }` | Simulate movement along waypoints |
| `trip:otp` | Server → Client | `{ tripId, otp }` | OTP sent to passenger after driver starts |
| `trip:started` | Server → Client | `{ tripId }` | OTP verified, trip is IN_PROGRESS |
| `trip:completed` | Server → Client | `{ tripId, status }` | Trip completed by driver |
| `trip:payment_done` | Server → Client | `{ tripId, status }` | Payment received |
| `trip:cancelled` | Server → Client | `{ tripId }` | Ride/booking cancelled |
| `payment:received` | Server → Client | `{ tripId, amount }` | Driver earning notification |
| `chat:join` | Client → Server | `tripId` | Join chat room |
| `chat:message` | Client → Server | `{ tripId, message }` | Send chat message |
| `chat:message` | Server → Client | `ChatMessage` | Receive chat message |
| `notification:new` | Server → Client | `{ title, body }` | Push notification |

---

## 🗄️ Database Schema

17 models in PostgreSQL via Prisma ORM:

```
Organization → OrganizationSettings
Organization → User → EmployeeProfile
                    → Vehicle → Ride → RideBooking → Payment
                                     → Trip → TripParticipant
                                            → TripLocation
                                            → ChatMessage
                                            → Payment
             → Wallet → WalletTransaction
             → Rating
             → SavedPlace
             → Notification
```

**Key design decisions:**
- No `$transaction` calls — Neon serverless has interactive transaction timeouts, so all writes are sequential
- Soft deletes via `isActive` flag on User and Vehicle
- JWT access tokens (15min) + HTTP-only refresh cookies (7 days)
- Ride search uses Haversine distance formula for proximity matching

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon free tier)
- Razorpay test account (optional)

### 1. Clone & Install

```bash
git clone https://github.com/xau-aman/Carpooling-Platform.git
cd Carpooling-Platform
npm install          # installs root + all workspaces
```

### 2. Environment Setup

```bash
# Server
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
DATABASE_URL="postgresql://..."     # Neon or local PostgreSQL
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
PORT=3001
NODE_ENV=development
```

```bash
# Client
cp client/.env.example client/.env
```

Edit `client/.env`:
```env
VITE_RAZORPAY_KEY_ID="rzp_test_..."
VITE_SERVER_URL=""    # Leave empty for local dev (uses Vite proxy)
```

### 3. Database Setup

```bash
# Run migrations
cd server
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed with demo data (250+ records)
npm run db:seed
```

### 4. Run Development Server

```bash
# From root — runs both server + client concurrently
npm run dev

# Server runs at: http://localhost:3001
# Client runs at: http://localhost:5173
```

### 5. Optional: Prisma Studio

```bash
npm run db:studio    # Visual DB browser at http://localhost:5555
```

---

## ☁️ Production Deployment

### Backend — Render

The server auto-deploys from GitHub via `render.yaml`.

**Environment variables on Render:**
```
DATABASE_URL=<neon_postgresql_url>
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
RAZORPAY_KEY_ID=rzp_test_TNArC1VdlKrzoS
RAZORPAY_KEY_SECRET=<secret>
NODE_ENV=production
PORT=3001
```

### Frontend — Vercel

1. Import `https://github.com/xau-aman/Carpooling-Platform` on Vercel
2. Set **Root Directory** to `client`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`
5. Add environment variables:
```
VITE_SERVER_URL=https://carpooling-platform.onrender.com
VITE_RAZORPAY_KEY_ID=rzp_test_TNArC1VdlKrzoS
```
6. Deploy → Vercel auto-handles SPA routing via `vercel.json`

---

## 📱 Mobile APK

Built with **Capacitor 6** wrapping the React app as a native Android app.

**Download:** `GoTogether-v6.0-debug.apk` (debug build, ~12MB)

**Build from source:**
```bash
cd mobile
npm run build
npx cap sync android
cd android
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

**Mobile-specific features:**
- Full-screen map picker (Uber/Rapido style)
- Native push notifications via `@capacitor/local-notifications`
- Razorpay payment via same-origin iframe (works in WebView)
- Network security config for OSM tiles + Render API

---

## 🔒 Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT access tokens expire in **15 minutes**
- Refresh tokens in **HTTP-only cookies** (7 days, SameSite=None in prod)
- All protected routes require `Authorization: Bearer <token>`
- Admin routes additionally check `role === 'ADMIN'`
- Razorpay webhook signature verified server-side

---

## 🐛 Known Issues & Solutions

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| Booking 500 error | Neon DB `$transaction` timeout on cold start | Removed all `$transaction`, sequential writes |
| OTP not arriving | `user:join` emitted after trip loaded (race condition) | Separate `useEffect` emits `user:join` on mount |
| Map not loading on Android | OSM tiles blocked by Android network security | `network_security_config.xml` with domain allowlist |
| Auth lost on page refresh (Vercel) | Cookie not sent cross-origin | Token persisted to `localStorage` + `/auth/me` restore |

---

## 👥 Team

Built for **Odoo Hackathon 2026** 🏆

---

<div align="center">
  <strong>GoTogether — Smarter commutes, together.</strong><br/>
  <a href="https://carpooling-platform-client.vercel.app">Live Demo</a> ·
  <a href="https://carpooling-platform.onrender.com/api/v1/health">API Health</a> ·
  <a href="https://github.com/xau-aman/Carpooling-Platform">GitHub</a>
</div>
