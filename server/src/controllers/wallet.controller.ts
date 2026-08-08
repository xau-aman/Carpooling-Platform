import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as repo from '../repositories/wallet.repository'
import { ok, badRequest, serverError } from '../utils/response'

export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const wallet = await repo.getWallet(req.user!.userId)
    return ok(res, wallet)
  } catch (e) { return serverError(res, e) }
}

export const recharge = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return badRequest(res, 'Valid amount required')
    const wallet = await repo.rechargeWallet(req.user!.userId, parseFloat(amount))
    return ok(res, wallet, 'Wallet recharged')
  } catch (e) { return serverError(res, e) }
}
