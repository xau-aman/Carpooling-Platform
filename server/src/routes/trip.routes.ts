import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/trip.controller'

const router = Router()
router.use(authenticate)
router.get('/', ctrl.getMyTrips)
router.get('/:id', ctrl.getTrip)
router.post('/:id/start', ctrl.startTrip)
router.post('/:id/verify-otp', ctrl.verifyOtp)
router.post('/:id/complete', ctrl.completeTrip)
router.post('/:id/cancel-ride', ctrl.cancelRide)
router.post('/:id/cancel-booking', ctrl.cancelBooking)

export default router
