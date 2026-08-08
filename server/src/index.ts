import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config/env'
import { connectWithRetry } from './config/prisma'
import { registerSockets } from './sockets'

import authRoutes from './routes/auth.routes'
import vehicleRoutes from './routes/vehicle.routes'
import rideRoutes from './routes/ride.routes'
import bookingRoutes from './routes/booking.routes'
import tripRoutes from './routes/trip.routes'
import walletRoutes from './routes/wallet.routes'
import paymentRoutes from './routes/payment.routes'
import adminRoutes from './routes/admin.routes'
import miscRoutes from './routes/misc.routes'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok = [
      config.clientUrl, 'http://localhost:5173', 'http://localhost:5174',
      /^http:\/\/10\./, /^http:\/\/192\.168\./, /\.vercel\.app$/, /\.onrender\.com$/,
    ].some(o => typeof o === 'string' ? o === origin : o.test(origin))
    cb(null, ok)
  }, credentials: true },
})

// Allow from any origin in dev (mobile + web)
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  /^http:\/\/10\./,
  /^http:\/\/192\.168\./,
  /\.vercel\.app$/,
  /\.onrender\.com$/,
]

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true)
    const ok = allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))
    cb(null, ok)
  },
  credentials: true,
}))
app.use(cookieParser() as unknown as express.RequestHandler)
app.use(express.json())

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/vehicles', vehicleRoutes)
app.use('/api/v1/rides', rideRoutes)
app.use('/api/v1/bookings', bookingRoutes)
app.use('/api/v1/trips', tripRoutes)
app.use('/api/v1/wallet', walletRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1', miscRoutes)

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }))

registerSockets(io)

// Connect DB then start server
connectWithRetry().then(() => {
  httpServer.listen(config.port, () => {
    console.log(`🚀 GoTogether server running on port ${config.port}`)
  })
})
