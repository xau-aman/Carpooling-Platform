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
    const isP = await repo.isParticipant(trip.id, req.user!.userId)
    if (!isP) return forbidden(res)
    return ok(res, trip)
  } catch (e) { return serverError(res, e) }
}

export const startTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can start trip')
    if (!['BOOKED', 'STARTED'].includes(trip.status)) return badRequest(res, 'Trip cannot be started')

    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const updated = await repo.updateTripStatus(trip.id, 'STARTED', { otp })

    const passengers = trip.participants.filter(p => !p.isDriver)
    for (const p of passengers) {
      // Emit to user personal room AND trip room — covers both connected states
      ioInstance?.to(`user:${p.userId}`).to(`trip:${trip.id}`).emit('trip:otp', {
        tripId: trip.id, otp,
        from: trip.ride.pickupAddress, to: trip.ride.destAddress,
      })
      await pushNotification(p.userId, 'Your Ride OTP', `Share OTP ${otp} with your driver to start the ride`).catch(() => {})
    }

    ioInstance?.to(`trip:${trip.id}`).emit('trip:otp_sent', { tripId: trip.id })
    return ok(res, { ...updated, otp }, 'OTP sent to passengers')
  } catch (e) { return serverError(res, e) }
}

export const verifyOtp = async (req: AuthRequest, res: Response) => {
  try {
    const { otp } = req.body
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can verify OTP')
    if (trip.status !== 'STARTED') return badRequest(res, 'Trip not in OTP verification state')
    if (!otp || trip.otp !== otp.toString()) return badRequest(res, 'Invalid OTP')

    const updated = await repo.updateTripStatus(trip.id, 'IN_PROGRESS', { startedAt: new Date(), otpVerified: true })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { status: 'IN_PROGRESS' } })

    ioInstance?.to(`trip:${trip.id}`).emit('trip:started', {
      tripId: trip.id, status: 'IN_PROGRESS',
      from: trip.ride.pickupAddress, to: trip.ride.destAddress,
    })

    const passengers = trip.participants.filter(p => !p.isDriver)
    for (const p of passengers) {
      await pushNotification(p.userId, 'Ride Started!', 'Your ride is now in progress.').catch(() => {})
    }

    return ok(res, updated, 'Trip started')
  } catch (e) { return serverError(res, e) }
}

export const completeTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { lat, lng, simulated } = req.body
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can complete trip')
    if (trip.status !== 'IN_PROGRESS') return badRequest(res, 'Trip not in progress')

    if (!simulated && lat != null && lng != null) {
      const distKm = haversineKm(lat, lng, trip.ride.destLat, trip.ride.destLng)
      if (distKm > 0.3) return badRequest(res, `${Math.round(distKm * 1000)}m from destination. Need < 300m.`)
    }

    const updated = await repo.updateTripStatus(trip.id, 'PAYMENT_PENDING', { completedAt: new Date() })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { status: 'COMPLETED' } })

    ioInstance?.to(`trip:${trip.id}`).emit('trip:completed', {
      tripId: trip.id, status: 'PAYMENT_PENDING', farePerSeat: trip.ride.farePerSeat,
      from: trip.ride.pickupAddress, to: trip.ride.destAddress,
    })

    const passengers = trip.participants.filter(p => !p.isDriver)
    for (const p of passengers) {
      await pushNotification(p.userId, 'Trip Completed', `Pay Rs.${trip.ride.farePerSeat} to complete your ride`).catch(() => {})
    }

    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
}

export const cancelRide = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can cancel ride')
    if (['IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(trip.status))
      return badRequest(res, 'Cannot cancel a ride already in progress or completed')

    // Sequential writes — no transaction
    await prisma.trip.update({ where: { id: trip.id }, data: { status: 'CANCELLED' } })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { status: 'CANCELLED' } })
    await prisma.rideBooking.updateMany({ where: { rideId: trip.rideId, status: { not: 'CANCELLED' } }, data: { status: 'CANCELLED' } })

    const passengers = trip.participants.filter(p => !p.isDriver)
    for (const p of passengers) {
      ioInstance?.to(`user:${p.userId}`).emit('trip:cancelled', { tripId: trip.id })
      await pushNotification(p.userId, 'Ride Cancelled', `Your ride has been cancelled by the driver`).catch(() => {})
    }
    ioInstance?.to(`trip:${trip.id}`).emit('trip:cancelled', { tripId: trip.id })

    return ok(res, null, 'Ride cancelled')
  } catch (e) { return serverError(res, e) }
}

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (['IN_PROGRESS', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED'].includes(trip.status))
      return badRequest(res, 'Cannot cancel after ride has started')

    const booking = trip.ride.bookings?.find(b => b.userId === req.user!.userId)
    if (!booking) return notFound(res, 'Booking not found')

    // Sequential writes — no transaction
    await prisma.rideBooking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } })
    await prisma.ride.update({ where: { id: trip.rideId }, data: { availableSeats: { increment: booking.seats }, status: 'PUBLISHED' } })
    await prisma.tripParticipant.deleteMany({ where: { tripId: trip.id, userId: req.user!.userId } })

    await pushNotification(trip.ride.driver.id, 'Passenger Cancelled', `A passenger cancelled their booking`).catch(() => {})
    ioInstance?.to(`user:${trip.ride.driver.id}`).emit('booking:cancelled', { tripId: trip.id, userId: req.user!.userId })

    return ok(res, null, 'Booking cancelled')
  } catch (e) { return serverError(res, e) }
}
