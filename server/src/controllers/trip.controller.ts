import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as repo from '../repositories/trip.repository'
import { ok, badRequest, serverError, notFound, forbidden } from '../utils/response'

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

export const startTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can start trip')
    if (!['BOOKED', 'STARTED'].includes(trip.status)) return badRequest(res, 'Trip cannot be started')
    const updated = await repo.updateTripStatus(trip.id, 'IN_PROGRESS', { startedAt: new Date() })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
}

export const completeTrip = async (req: AuthRequest, res: Response) => {
  try {
    const trip = await repo.getTripById(req.params.id as string)
    if (!trip) return notFound(res)
    if (trip.ride.driver.id !== req.user!.userId) return forbidden(res, 'Only driver can complete trip')
    if (trip.status !== 'IN_PROGRESS') return badRequest(res, 'Trip not in progress')
    const updated = await repo.updateTripStatus(trip.id, 'PAYMENT_PENDING', { completedAt: new Date() })
    return ok(res, updated)
  } catch (e) { return serverError(res, e) }
}
