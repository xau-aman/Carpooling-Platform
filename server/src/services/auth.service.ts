import bcrypt from 'bcryptjs'
import { signToken } from '../utils/jwt'
import * as repo from '../repositories/auth.repository'

export const login = async (email: string, password: string) => {
  const user = await repo.findUserByEmail(email)
  if (!user || !user.isActive) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  const token = signToken({ userId: user.id, organizationId: user.organizationId, role: user.role })
  return { token, user: sanitizeUser(user) }
}

export const register = async (data: {
  name: string
  email: string
  phone?: string
  password: string
  organizationId: string
  profilePhoto?: string
}) => {
  const existing = await repo.findUserByEmail(data.email)
  if (existing) throw new Error('Email already registered')

  const org = await repo.findOrganizationById(data.organizationId)
  if (!org) throw new Error('Organization not found')

  const passwordHash = await bcrypt.hash(data.password, 12)
  const user = await repo.createUser({
    organizationId: data.organizationId,
    email: data.email,
    phone: data.phone,
    passwordHash,
    name: data.name,
    profilePhoto: data.profilePhoto,
  })

  const token = signToken({ userId: user.id, organizationId: user.organizationId, role: user.role })
  return { token, user: sanitizeUser(user) }
}

export const getOrganizations = () => repo.listOrganizations()

export const getMe = async (userId: string) => {
  const user = await repo.findUserById(userId)
  if (!user) throw new Error('User not found')
  return sanitizeUser(user)
}

const sanitizeUser = (user: { passwordHash: string; [key: string]: unknown }) => {
  const { passwordHash: _, ...safe } = user
  return safe
}
