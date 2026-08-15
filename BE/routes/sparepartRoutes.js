import { Router } from 'express';
import { sparepartController } from '../controllers/sparepartController.js';
import { verifyToken, verifyAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', sparepartController.getAllSpareparts);
router.get('/:id', sparepartController.getSparepartById);
router.post('/', verifyToken, verifyAdmin, sparepartController.createSparepart);
router.put('/:id', verifyToken, verifyAdmin, sparepartController.updateSparepart);
router.delete('/:id', verifyToken, verifyAdmin, sparepartController.deleteSparepart);

export default router;

