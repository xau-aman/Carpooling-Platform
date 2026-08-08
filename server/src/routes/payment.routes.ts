import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/payment.controller'

const router = Router()
router.use(authenticate)
router.post('/order', ctrl.createOrder)
router.post('/pay', ctrl.pay)

export default router
