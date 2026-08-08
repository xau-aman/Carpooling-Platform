import { Server, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { isParticipant, saveTripLocation } from '../repositories/trip.repository'
import { prisma } from '../config/prisma'

interface AuthSocket extends Socket {
  userId?: string
  organizationId?: string
}

// Export io so other modules can push notifications
export let ioInstance: Server

export const pushNotification = async (userId: string, title: string, body: string) => {
  await prisma.notification.create({ data: { userId, title, body } })
  ioInstance?.to(`user:${userId}`).emit('notification:new', { title, body })
}

export const registerSockets = (io: Server) => {
  ioInstance = io
  // Auth middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1]
    if (!token) return next(new Error('Unauthorized'))
    try {
      const payload = verifyToken(token)
      socket.userId = payload.userId
      socket.organizationId = payload.organizationId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket: AuthSocket) => {
    // Join personal room for notifications
    if (socket.userId) socket.join(`user:${socket.userId}`)
    // Join org room for broadcast notifications
    if (socket.organizationId) socket.join(`org:${socket.organizationId}`)

    // Allow client to explicitly re-join personal room (for OTP delivery)
    socket.on('user:join', (userId: string) => {
      if (socket.userId === userId) socket.join(`user:${userId}`)
    })
    // ── Trip room ──────────────────────────────────────────────────────────
    socket.on('trip:join', async (tripId: string) => {
      if (!socket.userId) return
      const ok = await isParticipant(tripId, socket.userId)
      if (!ok) return socket.emit('error', 'Not a trip participant')
      socket.join(`trip:${tripId}`)
    })

    socket.on('trip:leave', (tripId: string) => {
      socket.leave(`trip:${tripId}`)
    })

    // Driver sends location
    socket.on('trip:location', async (data: { tripId: string; lat: number; lng: number; heading?: number; speed?: number }) => {
      if (!socket.userId) return
      const ok = await isParticipant(data.tripId, socket.userId)
      if (!ok) return

      // Persist last location
      await saveTripLocation(data.tripId, data.lat, data.lng, data.heading, data.speed)

      // Broadcast to all in room
      io.to(`trip:${data.tripId}`).emit('trip:location', {
        tripId: data.tripId,
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
        timestamp: new Date().toISOString(),
      })
    })

    // Demo simulation — instantly jump to last waypoint
    socket.on('trip:simulate', async (data: { tripId: string; waypoints: Array<{ lat: number; lng: number }> }) => {
      if (!socket.userId) return
      const ok = await isParticipant(data.tripId, socket.userId)
      if (!ok) return
      // Emit all waypoints instantly, last one is destination
      for (const point of data.waypoints) {
        await saveTripLocation(data.tripId, point.lat, point.lng)
        io.to(`trip:${data.tripId}`).emit('trip:location', {
          tripId: data.tripId, lat: point.lat, lng: point.lng,
          timestamp: new Date().toISOString(),
        })
      }
    })

    // ── Chat ───────────────────────────────────────────────────────────────
    socket.on('chat:join', async (tripId: string) => {
      if (!socket.userId) return
      const ok = await isParticipant(tripId, socket.userId)
      if (!ok) return socket.emit('error', 'Not a trip participant')
      socket.join(`chat:${tripId}`)
    })

    socket.on('chat:message', async (data: { tripId: string; message: string }) => {
      if (!socket.userId || !data.message?.trim()) return
      const ok = await isParticipant(data.tripId, socket.userId)
      if (!ok) return

      const msg = await prisma.chatMessage.create({
        data: { tripId: data.tripId, senderId: socket.userId, message: data.message.trim() },
        include: { sender: { select: { id: true, name: true, profilePhoto: true } } },
      })

      io.to(`chat:${data.tripId}`).emit('chat:message', msg)
    })

    socket.on('disconnect', () => {
      // cleanup handled by socket.io automatically
    })
  })
}
