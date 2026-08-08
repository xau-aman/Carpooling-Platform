import { prisma } from '../config/prisma'
import { FuelType } from '@prisma/client'

export const getUserVehicles = (userId: string, organizationId: string) =>
  prisma.vehicle.findMany({
    where: { userId, organizationId },
    orderBy: { createdAt: 'desc' },
  })

export const getOrgVehicles = (organizationId: string) =>
  prisma.vehicle.findMany({
    where: { organizationId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

export const getVehicleById = (id: string, organizationId: string) =>
  prisma.vehicle.findFirst({ where: { id, organizationId } })

export const createVehicle = (data: {
  organizationId: string
  userId: string
  model: string
  registration: string
  seats: number
  fuelType: FuelType
  color?: string
}) => prisma.vehicle.create({ data })

export const updateVehicle = (id: string, userId: string, data: Partial<{
  model: string; seats: number; fuelType: FuelType; color: string; isActive: boolean
}>) => prisma.vehicle.update({ where: { id }, data })

export const setVehicleActive = (id: string, isActive: boolean) =>
  prisma.vehicle.update({ where: { id }, data: { isActive } })
