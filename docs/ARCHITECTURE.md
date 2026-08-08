# WorkZen Architecture

## System Overview

```
Browser (React)
    │
    ├── HTTP (axios)  ──→  Express API  ──→  Prisma  ──→  Neon PostgreSQL
    │
    └── WebSocket (Socket.IO)  ──→  Node.js  ──→  Trip Rooms
```

## Backend Layers

```
Route → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Routes**: URL mapping only
- **Controllers**: HTTP request/response, no business logic
- **Services**: Business logic, validation, orchestration
- **Repositories**: All database queries, Prisma calls only here

## Organization Isolation

Every query that touches tenant data includes `organizationId` filter.
Backend enforces this — frontend filtering alone is never trusted.

## Ride Matching Algorithm

```
matchScore = routeSimilarity(40%) + pickupProximity(25%) + timeCompatibility(20%) + destProximity(10%) + driverRating(5%)
```

Uses Haversine formula for distance calculations.

## Live Tracking Architecture

```
Driver (navigator.geolocation)
  → socket.emit('trip:location', { tripId, lat, lng })
  → Server validates participant
  → Server persists to TripLocation table
  → io.to('trip:tripId').emit('trip:location', data)
  → Passenger receives update
  → Leaflet marker moves
```

Demo simulation uses identical pipeline — no fake local animation.

## Payment Flow

```
Frontend → POST /payments/order → Razorpay order created
Frontend → Razorpay checkout → payment
Razorpay → Frontend callback (razorpay_payment_id, signature)
Frontend → POST /payments/pay (with signature)
Backend → crypto.createHmac verify signature
Backend → Update payment, trip, booking status
```

Wallet payments skip Razorpay and deduct directly with DB transaction.
