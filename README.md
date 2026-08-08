# WorkZen — Enterprise Employee Carpooling Platform

> Professional Neobrutalism · Real-time Tracking · Smart Matching · Integrated Payments

---

## Demo Accounts

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | admin@odoo.com    | Demo@1234   |
| Driver   | raj@odoo.com      | Demo@1234   |
| Employee | aman@odoo.com     | Demo@1234   |
| Employee | priya@odoo.com    | Demo@1234   |

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd workzen
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Environment Setup

```bash
# Server
cp server/.env.example server/.env
# Fill in DATABASE_URL (Neon PostgreSQL), JWT_SECRET, RAZORPAY keys

# Client
cp client/.env.example client/.env
# Fill in VITE_RAZORPAY_KEY_ID
```

### 3. Database Setup

```bash
# From root — run migration
DATABASE_URL="your_neon_url" node_modules/.bin/prisma migrate dev --schema=server/prisma/schema.prisma --name init

# Generate client
DATABASE_URL="your_neon_url" node_modules/.bin/prisma generate --schema=server/prisma/schema.prisma

# Seed demo data
cd server && npm run db:seed
```

### 4. Run

```bash
# From root — runs both server + client concurrently
npm run dev

# Or individually:
cd server && npm run dev      # http://localhost:3001
cd client && npm run dev      # http://localhost:5173
```

### 5. Prisma Studio (optional)

```bash
npm run db:studio
```

---

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS |
| Animations | GSAP                                    |
| Charts     | Recharts                                |
| Maps       | Leaflet + OpenStreetMap                 |
| Backend    | Node.js, Express, TypeScript            |
| Realtime   | Socket.IO                               |
| Database   | Neon PostgreSQL + Prisma ORM            |
| Auth       | JWT + bcrypt                            |
| Payments   | Razorpay Test Mode                      |

---

## Demo Flow (Hackathon)

1. Login as `aman@techcorp.demo`
2. Dashboard → **Find a Ride**
3. Enter: ISKCON → Infocity, tomorrow 9:00 AM
4. Confirm route → See matching rides (98% match)
5. Book Raj Patel's ride
6. Open **My Trips** → View Trip Details

7. Open new tab → Login as `raj@techcorp.demo`
8. Go to **My Trips** → same trip → **Start Trip**
9. Click **Simulate Movement** → passenger sees live driver marker

10. Both users can **Chat** in real-time
11. Driver clicks **Complete Trip**
12. Passenger sees "Payment Pending" → **Pay Now**
13. Pay via Wallet (₹1240 balance available)
14. Trip moves to **Ride History**

15. Login as `admin@techcorp.demo`
16. Admin Dashboard shows updated analytics

---

## Project Structure

```
workzen/
├── client/          # React frontend
│   └── src/
│       ├── components/    # Button, Input, Badge, etc.
│       ├── context/       # AuthContext
│       ├── features/      # admin/, tracking/
│       ├── layouts/       # AppShell
│       ├── lib/           # api.ts, socket.ts
│       ├── pages/         # All route pages
│       └── types/         # TypeScript types
│
├── server/          # Node.js backend
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/        # prisma.ts, env.ts
│       ├── controllers/   # Thin HTTP handlers
│       ├── middleware/     # auth.ts
│       ├── repositories/  # DB queries
│       ├── routes/        # Express routers
│       ├── services/      # Business logic
│       ├── sockets/       # Socket.IO handlers
│       └── utils/         # jwt.ts, response.ts
│
└── docs/            # Architecture docs
```

---

## API Base URL

`http://localhost:3001/api/v1`

Key endpoints:
- `POST /auth/login` — Login
- `POST /auth/register` — Register
- `GET /rides/search` — Find matching rides
- `POST /rides` — Offer a ride
- `POST /bookings` — Book a ride
- `GET /trips` — My trips
- `POST /trips/:id/start` — Start trip (driver)
- `POST /trips/:id/complete` — Complete trip (driver)
- `POST /payments/pay` — Pay for ride
- `GET /wallet` — Wallet balance + transactions
- `GET /admin/dashboard` — Admin stats

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `trip:join` | Client→Server | Join trip room |
| `trip:location` | Bidirectional | Driver location update |
| `trip:simulate` | Client→Server | Demo movement simulation |
| `chat:join` | Client→Server | Join chat room |
| `chat:message` | Bidirectional | Send/receive message |
