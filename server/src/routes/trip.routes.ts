import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/trip.controller'

const router = Router()
router.use(authenticate)
router.get('/', ctrl.getMyTrips)
router.get('/:id', ctrl.getTrip)
router.post('/:id/start', ctrl.startTrip)
router.post('/:id/complete', ctrl.completeTrip)

export default router
