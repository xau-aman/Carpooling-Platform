import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import * as service from '../services/payment.service'
import { ok, created, badRequest, serverError } from '../utils/response'

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body
    if (!amount) return badRequest(res, 'amount required')
    const order = await service.createRazorpayOrder(parseFloat(amount))
    return created(res, order)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('not configured')) return badRequest(res, msg)
    return serverError(res, e)
  }
}

export const pay = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId, tripId, amount, method, razorpayOrderId, razorpayPayId, razorpaySignature } = req.body
    if (!bookingId || !tripId || !amount || !method) return badRequest(res, 'bookingId, tripId, amount, method required')
    const payment = await service.processPayment({
      userId: req.user!.userId,
      bookingId, tripId,
      amount: parseFloat(amount),
      method,
      razorpayOrderId, razorpayPayId, razorpaySignature,
    })
    return ok(res, payment, 'Payment successful')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (['Already paid', 'Insufficient balance', 'Payment verification failed', 'Payment verification data missing'].includes(msg))
      return badRequest(res, msg)
    return serverError(res, e)
  }
}
