import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as repo from '../repositories/trip.repository'
import { ok, badRequest, serverError, notFound, forbidden } from '../utils/response'
import { pushNotification, ioInstance } from '../sockets'
import { prisma } from '../config/prisma'

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const getMyTrips = async (req: AuthRequest, res: Response) => {
  try {
    const trips = await repo.getUserTrips(req.user!.userId)
    return ok(res, trips)
  } catch (e) { return serverError(res, e) }
}

export const getTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    const ok2 = await repo.isParticipant(trip.id, req.user!.userId)
    if (!ok2) return forbidden(res)
    return ok(res, trip)
  } catch (e) { return serverError(res, e) }
}

// Driver calls this — generates OTP, emits to passengers via socket
export const startTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can start trip')
    if (!['BOOKED', 'STARTED'].includes(trip.status)) return badRequest(res, 'Trip cannot be started')

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const updated = await repo.updateTripStatus(trip.id, 'STARTED', { otp })

    // Send OTP to each passenger via socket + notification
    const passengers = trip.participants.filter(p => !p.isDriver)
    await Promise.all(passengers.map(p => {
      ioInstance?.to(`user:${p.userId}`).emit('trip:otp', { tripId: trip.id, otp })
      return pushNotification(p.userId, '🔑 Your Ride OTP', `Share OTP ${otp} with your driver to start the ride`)
    }))

    // Tell driver OTP was sent
    ioInstance?.to(`trip:${trip.id}`).emit('trip:otp_sent', { tripId: trip.id })

    return ok(res, { ...updated, otp }, 'OTP sent to passengers')
  } catch (e) { return serverError(res, e) }
}

// Passenger submits OTP — driver verifies it
export const verifyOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can verify OTP')
    if (trip.status !== 'STARTED') return badRequest(res, 'Trip not in OTP verification state')
    if (!otp || trip.otp !== otp.toString()) return badRequest(res, 'Invalid OTP')

    const updated = await repo.updateTripStatus(trip.id, 'IN_PROGRESS', {
      startedAt: new Date(),
      otpVerified: true,
    })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { status: 'IN_PROGRESS' } })

    ioInstance?.to(`trip:${trip.id}`).emit('trip:started', { tripId: trip.id, status: 'IN_PROGRESS' })

    const passengers = trip.participants.filter(p => !p.isDriver)
    await Promise.all(passengers.map(p =>
      pushNotification(p.userId, '🚗 Ride Started!', 'Your ride is now in progress. Track live location.')
    ))

    return ok(res, updated, 'Trip started')
  } catch (e) { return serverError(res, e) }
}

// Driver completes trip — geofence check (bypass if simulated)
export const completeTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, simulated } = req.body
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can complete trip')
    if (trip.status !== 'IN_PROGRESS') return badRequest(res, 'Trip not in progress')

    // Geofence check — must be within 300m of destination (skip if simulated)
    if (!simulated && lat != null && lng != null) {
      const distKm = haversineKm(lat, lng, trip.ride.destLat, trip.ride.destLng)
      if (distKm > 0.3) {
        return badRequest(res, `You are ${Math.round(distKm * 1000)}m from destination. Get within 300m to complete.`)
      }
    }

    const updated = await repo.updateTripStatus(trip.id, 'PAYMENT_PENDING', { completedAt: new Date() })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { status: 'COMPLETED' } })

    ioInstance?.to(`trip:${trip.id}`).emit('trip:completed', {
      tripId: trip.id,
      status: 'PAYMENT_PENDING',
      farePerSeat: trip.ride.farePerSeat,
    })

    const passengers = trip.participants.filter(p => !p.isDriver)
    await Promise.all(passengers.map(p =>
      pushNotification(p.userId, '🏁 Trip Completed', `Pay ₹${trip.ride.farePerSeat} to complete your ride`)
    ))

    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
}

// Driver cancels entire ride (before IN_PROGRESS)
export const cancelRide = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can cancel ride')
    if (['IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(trip.status))
      return badRequest(res, 'Cannot cancel a ride that is already in progress or completed')

    await prisma.$transaction(async (tx) => {
      await tx.trip.update({ where: { id: trip.id }, data: { status: 'CANCELLED' } })
      await tx.ride.update({ where: { id: trip.rideId }, data: { status: 'CANCELLED' } })
      await tx.rideBooking.updateMany({ where: { rideId: trip.rideId, status: { not: 'CANCELLED' } }, data: { status: 'CANCELLED' } })
    }, { timeout: 30000 })

    // Notify all passengers
    const passengers = trip.participants.filter(p => !p.isDriver)
    await Promise.all(passengers.map(p => {
      ioInstance?.to(`user:${p.userId}`).emit('trip:cancelled', { tripId: trip.id })
      return pushNotification(p.userId, '❌ Ride Cancelled', `Your ride from ${trip.ride.pickupAddress.split(',')[0]} has been cancelled by the driver`)
    }))

    ioInstance?.to(`trip:${trip.id}`).emit('trip:cancelled', { tripId: trip.id })
    return ok(res, null, 'Ride cancelled')
  } catch (e) { return serverError(res, e) }
}

// Passenger cancels their booking (before IN_PROGRESS)
export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (['IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(trip.status))
      return badRequest(res, 'Cannot cancel after ride has started')

    const booking = trip.ride.bookings?.find(b => b.userId === req.user!.userId)
    if (!booking) return notFound(res, 'Booking not found')

    await prisma.$transaction(async (tx) => {
      await tx.rideBooking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
      await tx.ride.update({ where: { id: trip.rideId }, data: { availableSeats: { increment: booking.seats }, status: 'PUBLISHED' } })
      await tx.tripParticipant.deleteMany({ where: { tripId: trip.id, userId: req.user!.userId } })
    }, { timeout: 30000 })

    // Notify driver
    await pushNotification(trip.ride.driver.id, '👤 Passenger Cancelled', `A passenger cancelled their booking for your ride`)
    ioInstance?.to(`user:${trip.ride.driver.id}`).emit('booking:cancelled', { tripId: trip.id, userId: req.user!.userId })

    return ok(res, null, 'Booking cancelled')
  } catch (e) { return serverError(res, e) }
}
