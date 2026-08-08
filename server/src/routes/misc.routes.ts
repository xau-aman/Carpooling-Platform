import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/misc.controller'

const router = Router()
router.use(authenticate)

router.get('/notifications', ctrl.getNotifications)
router.patch('/notifications/read-all', ctrl.markAllRead)

router.get('/saved-places', ctrl.getSavedPlaces)
router.post('/saved-places', ctrl.addSavedPlace)
router.delete('/saved-places/:id', ctrl.deleteSavedPlace)

router.post('/ratings', ctrl.rateDriver)
router.get('/ratings/:id', ctrl.getDriverRating)

export default router
