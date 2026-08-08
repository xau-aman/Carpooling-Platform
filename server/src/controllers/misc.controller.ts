import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../config/prisma'
import { ok, created, serverError } from '../utils/response'

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    return ok(res, notifs)
  } catch (e) { return serverError(res, e) }
}

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    })
    return ok(res, null, 'Marked all read')
  } catch (e) { return serverError(res, e) }
}

// ── Saved Places ──────────────────────────────────────────────────────────────
export const getSavedPlaces = async (req: AuthRequest, res: Response) => {
  try {
    const places = await prisma.savedPlace.findMany({ where: { userId: req.user!.userId } })
    return ok(res, places)
  } catch (e) { return serverError(res, e) }
}

export const addSavedPlace = async (req: AuthRequest, res: Response) => {
  try {
    const { label, address, lat, lng } = req.body
    const place = await prisma.savedPlace.create({
      data: { userId: req.user!.userId, label, address, lat: parseFloat(lat), lng: parseFloat(lng) },
    })
    return created(res, place)
  } catch (e) { return serverError(res, e) }
}

export const deleteSavedPlace = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.savedPlace.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } })
    return ok(res, null, 'Deleted')
  } catch (e) { return serverError(res, e) }
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export const rateDriver = async (req: AuthRequest, res: Response) => {
  try {
    const { rateeId, rideId, score, comment } = req.body
    const rating = await prisma.rating.upsert({
      where: { raterId_rideId: { raterId: req.user!.userId, rideId } },
      create: { raterId: req.user!.userId, rateeId, rideId, score: parseFloat(score), comment },
      update: { score: parseFloat(score), comment },
    })
    return ok(res, rating)
  } catch (e) { return serverError(res, e) }
}

export const getDriverRating = async (req: AuthRequest, res: Response) => {
  try {
    const agg = await prisma.rating.aggregate({
      where: { rateeId: req.params.id as string },
      _avg: { score: true },
      _count: true,
    })
    return ok(res, { avg: agg._avg.score ?? 0, count: agg._count })
  } catch (e) { return serverError(res, e) }
}
