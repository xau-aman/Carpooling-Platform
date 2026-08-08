import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '../config/prisma'
import { config } from '../config/env'
import { deductWallet } from '../repositories/wallet.repository'

const getRazorpay = () => {
  const { keyId, keySecret } = config.razorpay
  if (!keyId || !keySecret) throw new Error('Razorpay not configured')
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export const createRazorpayOrder = async (amount: number) => {
  return getRazorpay().orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `wz_${Date.now()}` })
}

export const verifyRazorpayPayment = (orderId: string, paymentId: string, signature: string): boolean => {
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex')
  return expected === signature
}

export const processPayment = async (params: {
  userId: string
  bookingId: string
  tripId: string
  amount: number
  method: 'CASH' | 'CARD' | 'UPI' | 'WALLET'
  razorpayOrderId?: string
  razorpayPayId?: string
  razorpaySignature?: string
}) => {
  const { userId, bookingId, tripId, amount, method } = params

  // Check not already paid
  const existing = await prisma.payment.findFirst({
    where: { bookingId, status: { in: ['COMPLETED', 'PROCESSING'] } },
  })
  if (existing) throw new Error('Already paid')

  if (method === 'WALLET') {
    await deductWallet(userId, amount, `Ride payment`)
    const payment = await prisma.payment.create({
      data: { userId, bookingId, tripId, amount, method: 'WALLET', status: 'COMPLETED' },
    })
    await prisma.trip.update({ where: { id: tripId }, data: { status: 'PAYMENT_COMPLETED' } })
    await prisma.rideBooking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })
    return payment
  }

  if (method === 'CASH') {
    const payment = await prisma.payment.create({
      data: { userId, bookingId, tripId, amount, method: 'CASH', status: 'COMPLETED' },
    })
    await prisma.trip.update({ where: { id: tripId }, data: { status: 'PAYMENT_COMPLETED' } })
    await prisma.rideBooking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })
    return payment
  }

  // CARD / UPI — verify Razorpay
  const { razorpayOrderId, razorpayPayId, razorpaySignature } = params
  if (!razorpayOrderId || !razorpayPayId || !razorpaySignature) throw new Error('Payment verification data missing')
  const valid = verifyRazorpayPayment(razorpayOrderId, razorpayPayId, razorpaySignature)
  if (!valid) throw new Error('Payment verification failed')

  const payment = await prisma.payment.create({
    data: { userId, bookingId, tripId, amount, method, status: 'COMPLETED', razorpayOrderId, razorpayPayId },
  })
  await prisma.trip.update({ where: { id: tripId }, data: { status: 'PAYMENT_COMPLETED' } })
  await prisma.rideBooking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })
  return payment
}
