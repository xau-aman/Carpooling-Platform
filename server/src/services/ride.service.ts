import * as repo from '../repositories/ride.repository'
import { prisma } from '../config/prisma'

// Haversine distance in km
const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const proximityScore = (distKm: number, maxKm: number): number =>
  Math.max(0, 1 - distKm / maxKm)

const timeScore = (rideTime: Date, requestedTime: Date): number => {
  const diffMin = Math.abs(rideTime.getTime() - requestedTime.getTime()) / 60000
  if (diffMin <= 15) return 1
  if (diffMin <= 30) return 0.8
  if (diffMin <= 60) return 0.5
  if (diffMin <= 120) return 0.2
  return 0
}

export const findMatchingRides = async (params: {
  organizationId: string
  pickupLat: number
  pickupLng: number
  destLat: number
  destLng: number
  departureTime: Date
  seats: number
  requesterId: string
}) => {
  const rides = await repo.findRides(params.organizationId, { date: new Date(params.departureTime) })

  const scored = await Promise.all(
    rides
      .filter(r => r.driverId !== params.requesterId && r.availableSeats >= params.seats)
      .map(async (ride) => {
        // Get driver avg rating
        const ratingAgg = await prisma.rating.aggregate({
          where: { rateeId: ride.driverId },
          _avg: { score: true },
          _count: true,
        })
        const avgRating = ratingAgg._avg.score ?? 4.5

        // Scoring weights: route 40, pickup 25, time 20, dest 10, rating 5
        const pickupDist = haversine(params.pickupLat, params.pickupLng, ride.pickupLat, ride.pickupLng)
        const destDist = haversine(params.destLat, params.destLng, ride.destLat, ride.destLng)

        const pickupScore = proximityScore(pickupDist, 3) * 25
        const destScore = proximityScore(destDist, 3) * 10
        const tScore = timeScore(ride.departureTime, params.departureTime) * 20
        const ratingScoreVal = ((avgRating / 5) * 5)

        // Route similarity: check if ride route roughly covers the requested route
        const rideRouteDist = haversine(ride.pickupLat, ride.pickupLng, ride.destLat, ride.destLng)
        const reqRouteDist = haversine(params.pickupLat, params.pickupLng, params.destLat, params.destLng)
        const routeSimilarity = rideRouteDist > 0 ? Math.min(reqRouteDist / rideRouteDist, 1) : 0
        const routeScore = routeSimilarity * 40

        const matchScore = Math.round(routeScore + pickupScore + tScore + destScore + ratingScoreVal)

        return {
          ...ride,
          matchScore: Math.min(matchScore, 100),
          driverRating: Math.round(avgRating * 10) / 10,
          ratingCount: ratingAgg._count,
          pickupDistanceKm: Math.round(pickupDist * 10) / 10,
        }
      })
  )

  return scored.sort((a, b) => b.matchScore - a.matchScore)
}

export const createRide = (data: Parameters<typeof repo.createRide>[0]) =>
  repo.createRide(data)

export const getRideById = (id: string, organizationId: string) =>
  repo.getRideById(id, organizationId)

export const getDriverRides = (driverId: string, organizationId: string) =>
  repo.getDriverRides(driverId, organizationId)
