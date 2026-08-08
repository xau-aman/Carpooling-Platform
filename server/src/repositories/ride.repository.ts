import { prisma } from '../config/prisma'
import { RideStatus } from '@prisma/client'

export const createRide = (data: {
  organizationId: string
  driverId: string
  vehicleId: string
  pickupAddress: string
  pickupLat: number
  pickupLng: number
  destAddress: string
  destLat: number
  destLng: number
  departureTime: Date
  availableSeats: number
  totalSeats: number
  farePerSeat: number
  isRecurring?: boolean
  distanceKm?: number
  durationMin?: number
  routePolyline?: string
}) => prisma.ride.create({ data, include: rideInclude })

export const findRides = (organizationId: string, filters: {
  date?: Date
  status?: RideStatus
}) =>
  prisma.ride.findMany({
    where: {
      organizationId,
      status: filters.status || RideStatus.PUBLISHED,
      ...(filters.date && {
        departureTime: {
          gte: new Date(filters.date.setHours(0, 0, 0, 0)),
          lt: new Date(filters.date.setHours(23, 59, 59, 999)),
        },
      }),
    },
    include: rideInclude,
    orderBy: { departureTime: 'asc' },
  })

export const getRideById = (id: string, organizationId: string) =>
  prisma.ride.findFirst({ where: { id, organizationId }, include: rideInclude })

export const updateRideStatus = (id: string, status: RideStatus) =>
  prisma.ride.update({ where: { id }, data: { status } })

export const decrementSeats = (id: string, count: number) =>
  prisma.ride.update({ where: { id }, data: { availableSeats: { decrement: count } } })

export const getDriverRides = (driverId: string, organizationId: string) =>
  prisma.ride.findMany({
    where: { driverId, organizationId },
    include: rideInclude,
    orderBy: { departureTime: 'desc' },
  })

const rideInclude = {
  driver: { select: { id: true, name: true, profilePhoto: true } },
  vehicle: { select: { id: true, model: true, registration: true, seats: true, color: true } },
  bookings: { where: { status: { not: 'CANCELLED' as const } }, select: { id: true, userId: true, seats: true, status: true } },
  _count: { select: { bookings: true } },
}
