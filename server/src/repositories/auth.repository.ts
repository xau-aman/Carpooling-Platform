import { prisma } from '../config/prisma'

export const findUserByEmail = (email: string) =>
  prisma.user.findUnique({
    where: { email },
    include: { profile: true, wallet: true },
  })

export const findUserById = (id: string) =>
  prisma.user.findUnique({
    where: { id },
    include: { profile: true, wallet: true },
  })

export const createUser = (data: {
  organizationId: string
  email: string
  phone?: string
  passwordHash: string
  name: string
  profilePhoto?: string
}) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data })
    await tx.wallet.create({ data: { userId: user.id, balance: 0 } })
    return user
  })

export const findOrganizationByName = (name: string) =>
  prisma.organization.findFirst({ where: { name: { contains: name, mode: 'insensitive' } } })

export const findOrganizationById = (id: string) =>
  prisma.organization.findUnique({ where: { id } })

export const listOrganizations = () =>
  prisma.organization.findMany({ select: { id: true, name: true } })
