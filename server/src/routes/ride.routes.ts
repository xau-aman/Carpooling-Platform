import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/ride.controller'

const router = Router()
router.use(authenticate)
router.get('/search', ctrl.searchRides)
router.get('/offered', ctrl.getMyOfferedRides)
router.get('/:id', ctrl.getRide)
router.post('/', ctrl.offerRide)

export default router
