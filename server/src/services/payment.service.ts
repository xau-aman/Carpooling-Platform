import Razorpay from 'razorpay'
import crypto from 'crypto'
import { prisma } from '../config/prisma'
import { config } from '../config/env'
import { deductWallet, creditWallet } from '../repositories/wallet.repository'
import { pushNotification, ioInstance } from '../sockets'

const getRazorpay = () => {
  const { keyId, keySecret } = config.razorpay
  if (!keyId || !keySecret) throw new Error('Razorpay not configured')
  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export const createRazorpayOrder = async (amount: number) => {
  return getRazorpay().orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `gt_${Date.now()}` })
}

export const verifyRazorpayPayment = (orderId: string, paymentId: string, signature: string): boolean => {
  const body = `${orderId}|${paymentId}`
  const expected = crypto.createHmac('sha256', config.razorpay.keySecret).update(body).digest('hex')
  return expected === signature
}

// Get driver ID from trip
const getDriverId = async (tripId: string): Promise<string | null> => {
  const participant = await prisma.tripParticipant.findFirst({
    where: { tripId, isDriver: true },
  })
  return participant?.userId ?? null
}

const finalizePayment = async (params: {
  userId: string
  bookingId: string
  tripId: string
  amount: number
  method: string
  razorpayOrderId?: string
  razorpayPayId?: string
}) => {
  const { userId, bookingId, tripId, amount, method, razorpayOrderId, razorpayPayId } = params

  const payment = await prisma.payment.create({
    data: { userId, bookingId, tripId, amount, method: method as never, status: 'COMPLETED', razorpayOrderId, razorpayPayId },
  })

  // Check if ALL bookings for this trip are paid — if yes mark trip PAYMENT_COMPLETED
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      ride: { include: { bookings: { where: { status: { not: 'CANCELLED' } } } } },
      participants: true,
    },
  })

  if (!trip) return payment

  const allBookingIds = trip.ride.bookings.map(b => b.id)
  const paidCount = await prisma.payment.count({
    where: { bookingId: { in: allBookingIds }, status: 'COMPLETED' },
  })
  const allPaid = paidCount >= allBookingIds.length

  await prisma.trip.update({
    where: { id: tripId },
    data: { status: allPaid ? 'PAYMENT_COMPLETED' : 'PAYMENT_PENDING' },
  })
  await prisma.rideBooking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } })

  // Credit driver wallet
  const driverId = await getDriverId(tripId)
  if (driverId) {
    await creditWallet(driverId, amount, `Ride earning from trip`)
    await pushNotification(driverId, '💰 Payment Received', `₹${amount} credited to your wallet`)
    // Emit real-time earning event to driver
    ioInstance?.to(`user:${driverId}`).emit('payment:received', { tripId, amount })
  }

  // Notify passenger
  await pushNotification(userId, '✅ Payment Successful', `₹${amount} paid successfully`)
  // Emit to trip room so all participants see updated status
  ioInstance?.to(`trip:${tripId}`).emit('trip:payment_done', { tripId, bookingId, status: allPaid ? 'PAYMENT_COMPLETED' : 'PAYMENT_PENDING' })

  return payment
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

  const existing = await prisma.payment.findFirst({
    where: { bookingId, status: { in: ['COMPLETED', 'PROCESSING'] } },
  })
  if (existing) throw new Error('Already paid')

  if (method === 'WALLET') {
    await deductWallet(userId, amount, `Ride payment`)
    return finalizePayment({ userId, bookingId, tripId, amount, method })
  }

  if (method === 'CASH') {
    return finalizePayment({ userId, bookingId, tripId, amount, method })
  }

  // CARD / UPI — verify Razorpay
  const { razorpayOrderId, razorpayPayId, razorpaySignature } = params
  if (!razorpayOrderId || !razorpayPayId || !razorpaySignature) throw new Error('Payment verification data missing')
  if (!verifyRazorpayPayment(razorpayOrderId, razorpayPayId, razorpaySignature)) throw new Error('Payment verification failed')

  return finalizePayment({ userId, bookingId, tripId, amount, method, razorpayOrderId, razorpayPayId })
}
