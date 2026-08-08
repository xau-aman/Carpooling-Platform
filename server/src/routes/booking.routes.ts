import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/booking.controller'

const router = Router()
router.use(authenticate)
router.post('/', ctrl.bookRide)
router.get('/', ctrl.getMyBookings)
router.delete('/:id', ctrl.cancelBooking)

export default router
