import { Router } from 'express';
import { vehicleController } from '../controllers/vehicleController.js';

const router = Router();

router.get('/', vehicleController.getAllVehicles);
router.get('/user/:userId', vehicleController.getVehiclesByUser);
router.get('/:id', vehicleController.getVehicleById);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

export default router;
