import { Router } from 'express'
import { authenticate, requireAdmin } from '../middleware/auth'
import * as ctrl from '../controllers/vehicle.controller'

const router = Router()

router.use(authenticate)
router.get('/', ctrl.getMyVehicles)
router.post('/', ctrl.addVehicle)
router.put('/:id', ctrl.editVehicle)
router.patch('/:id/toggle', ctrl.toggleVehicle)
router.get('/org/all', requireAdmin, ctrl.getOrgVehicles)

export default router
