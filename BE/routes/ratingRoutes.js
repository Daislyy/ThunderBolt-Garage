import { Router } from 'express';
import { ratingController } from '../controllers/ratingController.js';

const router = Router();

router.get('/', ratingController.getAllRatings);
router.get('/service/:serviceId', ratingController.getRatingsByService);
router.get('/user/:userId', ratingController.getRatingsByUser);
router.get('/:id', ratingController.getRatingById);
router.post('/', ratingController.createRating);
router.delete('/:id', ratingController.deleteRating);

export default router;
