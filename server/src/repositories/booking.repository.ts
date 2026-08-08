import { prisma } from '../config/prisma'
import { BookingStatus } from '@prisma/client'

export const createBooking = async (rideId: string, userId: string, seats: number) => {
  // Validate first (outside any transaction — avoids Neon cold start timeout)
  const ride = await prisma.ride.findUnique({ where: { id: rideId } })
  if (!ride) throw new Error('Ride not found')
  if (ride.status !== 'PUBLISHED') throw new Error('Ride not available')
  if (ride.availableSeats < seats) throw new Error('Not enough seats')
  if (ride.driverId === userId) throw new Error('Driver cannot book own ride')

  const existing = await prisma.rideBooking.findUnique({ where: { rideId_userId: { rideId, userId } } })
  if (existing && existing.status !== 'CANCELLED') throw new Error('Already booked')

  // Sequential writes — no interactive transaction (faster on serverless Neon)
  const booking = await prisma.rideBooking.create({
    data: { rideId, userId, seats, status: BookingStatus.CONFIRMED },
    include: { ride: { include: { driver: { select: { id: true, name: true } }, vehicle: true } } },
  })

  const newSeats = ride.availableSeats - seats
  await prisma.ride.update({
    where: { id: rideId },
    data: { availableSeats: newSeats, status: newSeats === 0 ? 'FULL' : 'PUBLISHED' },
  })

  // Ensure trip exists for this ride
  let trip = await prisma.trip.findUnique({ where: { rideId } })
  if (!trip) {
    trip = await prisma.trip.create({ data: { rideId, status: 'BOOKED' } })
    // Add driver as participant
    await prisma.tripParticipant.create({
      data: { tripId: trip.id, userId: ride.driverId, isDriver: true },
    })
  }

  // Add passenger as participant (upsert in case of re-booking)
  await prisma.tripParticipant.upsert({
    where: { tripId_userId: { tripId: trip.id, userId } },
    create: { tripId: trip.id, userId, isDriver: false },
    update: {},
  })

  return { booking, trip }
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

  await prisma.rideBooking.update({ where: { id: bookingId }, data: { status: 'CANCELLED' } })
  await prisma.ride.update({
    where: { id: booking.rideId },
    data: { availableSeats: { increment: booking.seats }, status: 'PUBLISHED' },
  })
  return booking
}
