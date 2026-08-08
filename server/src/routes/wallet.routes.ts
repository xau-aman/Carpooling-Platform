import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as ctrl from '../controllers/wallet.controller'

const router = Router()
router.use(authenticate)
router.get('/', ctrl.getWallet)
router.post('/recharge', ctrl.recharge)

export default router
