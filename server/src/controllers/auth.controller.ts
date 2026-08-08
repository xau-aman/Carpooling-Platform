import { Request, Response } from 'express'
import * as service from '../services/auth.service'
import { ok, created, badRequest, serverError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return badRequest(res, 'Email and password required')
    const result = await service.login(email, password)
    return ok(res, result, 'Login successful')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Login failed'
    if (msg === 'Invalid credentials') return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const register = async (req: Request, res: Response) => {
  try {
    const result = await service.register(req.body)
    return created(res, result, 'Account created')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Registration failed'
    if (msg.includes('already') || msg.includes('not found')) return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const getOrganizations = async (_req: Request, res: Response) => {
  try {
    const orgs = await service.getOrganizations()
    return ok(res, orgs)
  } catch (e) {
    return serverError(res, e)
  }
}

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await service.getMe(req.user!.userId)
    return ok(res, user)
  } catch (e) {
    return serverError(res, e)
  }
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
