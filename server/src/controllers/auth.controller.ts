import { Request, Response } from 'express'
import * as service from '../services/auth.service'
import { ok, created, badRequest, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { verifyRefreshToken, signToken, signRefreshToken } from '../utils/jwt'

const isProd = process.env.NODE_ENV === 'production'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

const setRefreshCookie = (res: Response, token: string) =>
  res.cookie('rt', token, COOKIE_OPTS)

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return badRequest(res, 'Email and password required')
    const { accessToken, refreshToken, user } = await service.login(email, password)
    setRefreshCookie(res, refreshToken)
    return ok(res, { token: accessToken, user }, 'Login successful')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Login failed'
    if (msg === 'Invalid credentials') return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, user } = await service.register(req.body)
    setRefreshCookie(res, refreshToken)
    return created(res, { token: accessToken, user }, 'Account created')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed'
    if (msg.includes('already') || msg.includes('not found')) return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const refresh = (req: Request, res: Response) => {
  try {
    const token = req.cookies?.rt
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' })
    const payload = verifyRefreshToken(token)
    const accessToken = signToken({ userId: payload.userId, organizationId: payload.organizationId, role: payload.role })
    const newRefresh = signRefreshToken({ userId: payload.userId, organizationId: payload.organizationId, role: payload.role })
    setRefreshCookie(res, newRefresh)
    return ok(res, { token: accessToken, user: { id: payload.userId, role: payload.role, organizationId: payload.organizationId } })
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('rt')
  return ok(res, null, 'Logged out')
}

export const getOrganizations = async (_req: Request, res: Response) => {
  try {
    const orgs = await service.getOrganizations()
    return ok(res, orgs)
  } catch (e) {
    return serverError(res, e)
  }
}

// No DB call — user data decoded from JWT
export const getMe = (req: AuthRequest, res: Response) => {
  return ok(res, { id: req.user!.userId, role: req.user!.role, organizationId: req.user!.organizationId })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body
    if (!name?.trim()) return badRequest(res, 'Name required')
    const { prisma } = await import('../config/prisma')
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { name: name.trim(), phone: phone?.trim() || undefined },
      select: { id: true, name: true, email: true, phone: true, role: true, organizationId: true },
    })
    return ok(res, user, 'Profile updated')
  } catch (e) {
    return serverError(res, e)
  }
}
