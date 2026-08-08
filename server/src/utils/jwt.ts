import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface JwtPayload {
  userId: string
  organizationId: string
  role: string
}

const REFRESH_SECRET = config.jwtSecret + '_refresh'

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' } as jwt.SignOptions)

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload

export const signRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' } as jwt.SignOptions)

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, REFRESH_SECRET) as JwtPayload
