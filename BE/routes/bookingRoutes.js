import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { sparepartController } from '../controllers/sparepartController.js';

const router = Router();

router.get('/', bookingController.getAllBookings);
router.get('/user/:userId', bookingController.getBookingsByUser);
router.get('/:id', bookingController.getBookingById);
router.get('/:id/spareparts', sparepartController.getBookingSpareparts);
router.post('/', bookingController.createBooking);
router.post('/:id/spareparts', sparepartController.saveBookingSpareparts);
router.patch('/:id/status', bookingController.updateBookingStatus);
router.delete('/:id', bookingController.deleteBooking);

export default router;

