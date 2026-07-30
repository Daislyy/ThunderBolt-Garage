import { Router } from 'express';
import { serviceController } from '../controllers/serviceController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);
router.post('/', verifyToken, verifyAdmin, serviceController.createService);
router.put('/:id', verifyToken, verifyAdmin, serviceController.updateService);
router.delete('/:id', verifyToken, verifyAdmin, serviceController.deleteService);

export default router;
