import bcrypt from 'bcryptjs'
import { signToken, signRefreshToken } from '../utils/jwt'
import * as repo from '../repositories/auth.repository'

const makeTokens = (user: { id: string; organizationId: string; role: string }) => {
  const payload = { userId: user.id, organizationId: user.organizationId, role: user.role }
  return { accessToken: signToken(payload), refreshToken: signRefreshToken(payload) }
}

export const login = async (email: string, password: string) => {
  const user = await repo.findUserByEmail(email)
  if (!user || !user.isActive) throw new Error('Invalid credentials')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  return { ...makeTokens(user), user: sanitizeUser(user) }
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

  return { ...makeTokens(user), user: sanitizeUser(user) }
}

export const getOrganizations = () => repo.listOrganizations()

const sanitizeUser = (user: { passwordHash: string; [key: string]: unknown }) => {
  const { passwordHash: _, ...safe } = user
  return safe
}
