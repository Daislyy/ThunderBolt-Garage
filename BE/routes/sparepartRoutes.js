import { Router } from 'express';
import { sparepartController } from '../controllers/sparepartController.js';

const router = Router();

router.get('/', sparepartController.getAllSpareparts);

export default router;
