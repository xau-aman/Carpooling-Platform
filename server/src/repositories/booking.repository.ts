import { prisma } from '../config/prisma'
import { BookingStatus } from '@prisma/client'

export const createBooking = async (rideId: string, userId: string, seats: number) => {
  // Run validations OUTSIDE transaction first (avoids timeout on slow Neon wake-up)
  const ride = await prisma.ride.findUnique({ where: { id: rideId } })
  if (!ride) throw new Error('Ride not found')
  if (ride.status !== 'PUBLISHED') throw new Error('Ride not available')
  if (ride.availableSeats < seats) throw new Error('Not enough seats')
  if (ride.driverId === userId) throw new Error('Driver cannot book own ride')

  const existing = await prisma.rideBooking.findUnique({ where: { rideId_userId: { rideId, userId } } })
  if (existing && existing.status !== 'CANCELLED') throw new Error('Already booked')

  // Now run the actual writes in a short transaction (timeout 30s for Neon)
  return prisma.$transaction(async (tx) => {
    const booking = await tx.rideBooking.create({
      data: { rideId, userId, seats, status: BookingStatus.CONFIRMED },
      include: { ride: { include: { driver: { select: { id: true, name: true } }, vehicle: true } } },
    })

    const newSeats = ride.availableSeats - seats
    await tx.ride.update({
      where: { id: rideId },
      data: { availableSeats: newSeats, status: newSeats === 0 ? 'FULL' : 'PUBLISHED' },
    })

    // Ensure trip exists
    let trip = await tx.trip.findUnique({ where: { rideId } })
    if (!trip) {
      trip = await tx.trip.create({ data: { rideId, status: 'BOOKED' } })
      await tx.tripParticipant.create({ data: { tripId: trip.id, userId: ride.driverId, isDriver: true } })
    }
    await tx.tripParticipant.upsert({
      where: { tripId_userId: { tripId: trip.id, userId } },
      create: { tripId: trip.id, userId, isDriver: false },
      update: {},
    })

    return { booking, trip }
  }, { timeout: 30000 })
}

export const getUserBookings = (userId: string) =>
  prisma.rideBooking.findMany({
    where: { userId },
    include: {
      ride: {
        include: {
          driver: { select: { id: true, name: true, profilePhoto: true } },
          vehicle: true,
          trip: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

export const cancelBooking = async (bookingId: string, userId: string) => {
  const booking = await prisma.rideBooking.findUnique({ where: { id: bookingId } })
  if (!booking || booking.userId !== userId) throw new Error('Booking not found')
  if (booking.status === 'CANCELLED') throw new Error('Already cancelled')

  return prisma.$transaction(async (tx) => {
    await tx.rideBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
    await tx.ride.update({
      where: { id: booking.rideId },
      data: { availableSeats: { increment: booking.seats }, status: 'PUBLISHED' },
    })
    return booking
  }, { timeout: 30000 })
}
