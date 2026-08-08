import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as repo from '../repositories/booking.repository'
import { ok, created, badRequest, serverError } from '../utils/response'
import { pushNotification } from '../sockets'

export const bookRide = async (req: AuthRequest, res: Response) => {
  try {
    const { rideId, seats } = req.body
    if (!rideId) return badRequest(res, 'rideId required')
    const result = await repo.createBooking(rideId, req.user!.userId, seats || 1)
    // Notify driver
    await pushNotification(
      result.booking.ride.driver.id,
      'New Booking!',
      `${req.user!.userId} booked a seat on your ride`
    ).catch(() => {})
    return created(res, result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (['Ride not found', 'Ride not available', 'Not enough seats', 'Driver cannot book own ride', 'Already booked'].includes(msg))
      return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await repo.getUserBookings(req.user!.userId)
    return ok(res, bookings)
  } catch (e) { return serverError(res, e) }
}

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  try {
    await repo.cancelBooking(req.params.id as string, req.user!.userId)
    return ok(res, null, 'Booking cancelled')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('not found') || msg.includes('cancelled')) return badRequest(res, msg)
    return serverError(res, e)
  }
}
