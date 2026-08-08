import { prisma } from '../config/prisma'
import { TripStatus } from '@prisma/client'

const tripInclude = {
  ride: {
    include: {
      driver: { select: { id: true, name: true, profilePhoto: true, phone: true } },
      vehicle: true,
      bookings: { where: { status: { not: 'CANCELLED' as const } }, select: { id: true, userId: true, seats: true, status: true } },
    },
  },
  participants: { include: { user: { select: { id: true, name: true, profilePhoto: true } } } },
  messages: { include: { sender: { select: { id: true, name: true, profilePhoto: true } } }, orderBy: { createdAt: 'asc' as const } },
}

export const getTripById = (id: string) =>
  prisma.trip.findUnique({ where: { id }, include: tripInclude })

export const getTripByRideId = (rideId: string) =>
  prisma.trip.findUnique({ where: { rideId }, include: tripInclude })

export const getUserTrips = (userId: string) =>
  prisma.trip.findMany({
    where: { participants: { some: { userId } } },
    include: tripInclude,
    orderBy: { createdAt: 'desc' },
  })

export const updateTripStatus = (id: string, status: TripStatus, extra?: { startedAt?: Date; completedAt?: Date; otp?: string; otpVerified?: boolean }) =>
  prisma.trip.update({ where: { id }, data: { status, ...extra } })

export const saveTripLocation = (tripId: string, lat: number, lng: number, heading?: number, speed?: number) =>
  prisma.tripLocation.create({ data: { tripId, lat, lng, heading, speed } })

export const getLastTripLocation = (tripId: string) =>
  prisma.tripLocation.findFirst({ where: { tripId }, orderBy: { timestamp: 'desc' } })

export const isParticipant = async (tripId: string, userId: string): Promise<boolean> => {
  const p = await prisma.tripParticipant.findUnique({ where: { tripId_userId: { tripId, userId } } })
  return !!p
}
