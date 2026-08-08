import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import * as ctrl from '../controllers/admin.controller'

const router = Router()
router.use(authenticate, requireAdmin)
router.get('/dashboard', ctrl.getDashboard)
router.get('/employees', ctrl.getEmployees)
router.post('/employees', ctrl.addEmployee)
router.patch('/employees/:id/access', ctrl.toggleAccess)
router.get('/settings', ctrl.getSettings)
router.put('/settings', ctrl.saveSettings)
router.get('/reports', ctrl.getReports)

export default router
