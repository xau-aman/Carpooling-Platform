import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface JwtPayload {
  userId: string
  organizationId: string
  role: string
}

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtSecret) as JwtPayload
