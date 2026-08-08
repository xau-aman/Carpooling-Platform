import { Router } from 'express'
import * as ctrl from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/login', ctrl.login)
router.post('/register', ctrl.register)
router.get('/organizations', ctrl.getOrganizations)
router.get('/me', authenticate, ctrl.getMe)
router.patch('/profile', authenticate, ctrl.updateProfile)

export default router
