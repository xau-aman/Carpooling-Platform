import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { prisma } from '../config/prisma'
import { ok, badRequest, serverError } from '../utils/response'
import bcrypt from 'bcryptjs'

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId
    const [employees, vehicles, ridesThisMonth, trips] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.vehicle.count({ where: { organizationId: orgId } }),
      prisma.ride.count({
        where: {
          organizationId: orgId,
          departureTime: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      prisma.trip.count({
        where: { ride: { organizationId: orgId }, status: { in: ['COMPLETED', 'PAYMENT_COMPLETED'] } },
      }),
    ])
    return ok(res, { employees, vehicles, ridesThisMonth, completedTrips: trips })
  } catch (e) { return serverError(res, e) }
}

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    })
    return ok(res, users.map(u => { const { passwordHash: _, ...safe } = u; return safe }))
  } catch (e) { return serverError(res, e) }
}

export const addEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, department, manager, location } = req.body
    if (!name || !email) return badRequest(res, 'name and email required')
    const passwordHash = await bcrypt.hash('Workzen@123', 12)
    const user = await prisma.user.create({
      data: {
        organizationId: req.user!.organizationId,
        name, email, phone,
        passwordHash,
        profile: { create: { department, manager, location } },
      },
      include: { profile: true },
    })
    await prisma.wallet.create({ data: { userId: user.id, balance: 0 } })
    const { passwordHash: _, ...safe } = user
    return ok(res, safe, 'Employee added. Default password: Workzen@123')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Unique')) return badRequest(res, 'Email already exists')
    return serverError(res, e)
  }
}

export const toggleAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive },
    })
    return ok(res, { id: user.id, isActive: user.isActive })
  } catch (e) { return serverError(res, e) }
}

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const [org, settings] = await Promise.all([
      prisma.organization.findUnique({ where: { id: req.user!.organizationId } }),
      prisma.organizationSettings.findUnique({ where: { organizationId: req.user!.organizationId } }),
    ])
    return ok(res, { org, settings })
  } catch (e) { return serverError(res, e) }
}

export const saveSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, industry, fuelCostPerLiter, costPerKm, travelCostPolicy, defaultCarpoolPolicy } = req.body
    const orgId = req.user!.organizationId
    const [org, settings] = await Promise.all([
      prisma.organization.update({ where: { id: orgId }, data: { name, address, industry } }),
      prisma.organizationSettings.upsert({
        where: { organizationId: orgId },
        create: { organizationId: orgId, fuelCostPerLiter, costPerKm, travelCostPolicy, defaultCarpoolPolicy },
        update: { fuelCostPerLiter, costPerKm, travelCostPolicy, defaultCarpoolPolicy },
      }),
    ])
    return ok(res, { org, settings })
  } catch (e) { return serverError(res, e) }
}

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId
    const settings = await prisma.organizationSettings.findUnique({ where: { organizationId: orgId } })
    const costPerKm = settings?.costPerKm ?? 5

    const completedTrips = await prisma.trip.findMany({
      where: { ride: { organizationId: orgId }, status: { in: ['COMPLETED', 'PAYMENT_COMPLETED'] } },
      include: { ride: { include: { vehicle: true, driver: { select: { name: true } } } } },
    })

    const totalDistance = completedTrips.reduce((s, t) => s + (t.ride.distanceKm ?? 0), 0)
    const totalFuelCost = totalDistance * costPerKm
    const totalParticipants = await prisma.tripParticipant.count({
      where: { trip: { ride: { organizationId: orgId } }, isDriver: false },
    })

    // Vehicle utilization
    const vehicleStats = await prisma.ride.groupBy({
      by: ['vehicleId'],
      where: { organizationId: orgId, status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
      _count: { id: true },
      _sum: { distanceKm: true },
    })

    return ok(res, {
      totalTrips: completedTrips.length,
      totalDistance: Math.round(totalDistance),
      totalFuelCost: Math.round(totalFuelCost),
      totalPassengers: totalParticipants,
      vehicleStats,
    })
  } catch (e) { return serverError(res, e) }
}
