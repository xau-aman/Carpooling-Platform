import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as service from '../services/vehicle.service'
import { ok, created, badRequest, serverError, forbidden } from '../utils/response'
import { FuelType } from '@prisma/client'

export const getMyVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await service.getMyVehicles(req.user!.userId, req.user!.organizationId)
    return ok(res, vehicles)
  } catch (e) { return serverError(res, e) }
}

export const addVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { model, registration, seats, fuelType, color } = req.body
    if (!model || !registration || !seats) return badRequest(res, 'model, registration, seats required')
    const vehicle = await service.addVehicle({
      userId: req.user!.userId,
      organizationId: req.user!.organizationId,
      model, registration,
      seats: parseInt(seats),
      fuelType: (fuelType as FuelType) || FuelType.PETROL,
      color,
    })
    return created(res, vehicle)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('Unique')) return badRequest(res, 'Registration number already exists')
    return serverError(res, e)
  }
}

export const editVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await service.editVehicle(req.params.id as string, req.user!.userId, req.user!.organizationId, req.body)
    return ok(res, vehicle)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'Not your vehicle') return forbidden(res)
    return serverError(res, e)
  }
}

export const toggleVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = req.body
    const vehicle = await service.toggleVehicle(req.params.id as string, req.user!.userId, req.user!.organizationId, isActive)
    return ok(res, vehicle)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'Not your vehicle') return forbidden(res)
    return serverError(res, e)
  }
}

export const getOrgVehicles = async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await service.getOrgVehicles(req.user!.organizationId)
    return ok(res, vehicles)
  } catch (e) { return serverError(res, e) }
}
