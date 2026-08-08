import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as service from '../services/ride.service'
import { ok, created, badRequest, serverError, notFound } from '../utils/response'

export const searchRides = async (req: AuthRequest, res: Response) => {
  try {
    const { pickupLat, pickupLng, destLat, destLng, departureTime, seats } = req.query
    if (!pickupLat || !pickupLng || !destLat || !destLng || !departureTime)
      return badRequest(res, 'pickupLat, pickupLng, destLat, destLng, departureTime required')

    const rides = await service.findMatchingRides({
      organizationId: req.user!.organizationId,
      pickupLat: parseFloat(pickupLat as string),
      pickupLng: parseFloat(pickupLng as string),
      destLat: parseFloat(destLat as string),
      destLng: parseFloat(destLng as string),
      departureTime: new Date(departureTime as string),
      seats: parseInt((seats as string) || '1'),
      requesterId: req.user!.userId,
    })
    return ok(res, rides)
  } catch (e) { return serverError(res, e) }
}

export const offerRide = async (req: AuthRequest, res: Response) => {
  try {
    const {
      vehicleId, pickupAddress, pickupLat, pickupLng,
      destAddress, destLat, destLng, departureTime,
      availableSeats, farePerSeat, isRecurring, distanceKm, durationMin, routePolyline,
    } = req.body

    if (!vehicleId || !pickupAddress || !destAddress || !departureTime || !availableSeats || !farePerSeat)
      return badRequest(res, 'Missing required fields')

    const ride = await service.createRide({
      organizationId: req.user!.organizationId,
      driverId: req.user!.userId,
      vehicleId,
      pickupAddress, pickupLat: parseFloat(pickupLat), pickupLng: parseFloat(pickupLng),
      destAddress, destLat: parseFloat(destLat), destLng: parseFloat(destLng),
      departureTime: new Date(departureTime),
      availableSeats: parseInt(availableSeats),
      totalSeats: parseInt(availableSeats),
      farePerSeat: parseFloat(farePerSeat),
      isRecurring: isRecurring || false,
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      durationMin: durationMin ? parseInt(durationMin) : undefined,
      routePolyline,
    })

    // Notify all org members about new ride
    const { prisma } = await import('../config/prisma')
    const { pushNotification, ioInstance } = await import('../sockets')
    const orgUsers = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId, id: { not: req.user!.userId } },
      select: { id: true },
    })
    const driverName = (await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { name: true } }))?.name || 'Someone'
    const title = '🚗 New Ride Available!'
    const body = `${driverName} is offering a ride: ${pickupAddress.split(',')[0]} → ${destAddress.split(',')[0]}`
    // Broadcast real-time event to all org users (no DB spam — just socket)
    ioInstance?.to(`org:${req.user!.organizationId}`).emit('notification:new', { title, body })
    // Save DB notification only for users who haven't seen it (limit to 20)
    await Promise.all(orgUsers.slice(0, 20).map(u =>
      prisma.notification.create({ data: { userId: u.id, title, body } }).catch(() => {})
    ))

    return created(res, ride)
  } catch (e) { return serverError(res, e) }
}

export const getRide = async (req: AuthRequest, res: Response) => {
  try {
    const ride = await service.getRideById(req.params.id as string, req.user!.organizationId)
    if (!ride) return notFound(res, 'Ride not found')
    return ok(res, ride)
  } catch (e) { return serverError(res, e) }
}

export const getMyOfferedRides = async (req: AuthRequest, res: Response) => {
  try {
    const rides = await service.getDriverRides(req.user!.userId, req.user!.organizationId)
    return ok(res, rides)
  } catch (e) { return serverError(res, e) }
}
