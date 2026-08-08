import * as repo from '../repositories/vehicle.repository'
import { FuelType } from '@prisma/client'

export const getMyVehicles = (userId: string, organizationId: string) =>
  repo.getUserVehicles(userId, organizationId)

export const addVehicle = async (data: {
  userId: string
  organizationId: string
  model: string
  registration: string
  seats: number
  fuelType: FuelType
  color?: string
}) => {
  return repo.createVehicle(data)
}

export const editVehicle = async (
  id: string,
  userId: string,
  organizationId: string,
  data: Partial<{ model: string; seats: number; fuelType: FuelType; color: string }>
) => {
  const vehicle = await repo.getVehicleById(id, organizationId)
  if (!vehicle) throw new Error('Vehicle not found')
  if (vehicle.userId !== userId) throw new Error('Not your vehicle')
  return repo.updateVehicle(id, userId, data)
}

export const toggleVehicle = async (id: string, userId: string, organizationId: string, isActive: boolean) => {
  const vehicle = await repo.getVehicleById(id, organizationId)
  if (!vehicle) throw new Error('Vehicle not found')
  if (vehicle.userId !== userId) throw new Error('Not your vehicle')
  return repo.setVehicleActive(id, isActive)
}

export const getOrgVehicles = (organizationId: string) =>
  repo.getOrgVehicles(organizationId)
