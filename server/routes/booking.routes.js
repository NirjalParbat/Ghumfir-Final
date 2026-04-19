import express from 'express';
import {
  createBooking, getMyBookings, getBookingById, cancelBooking,
  getAllBookings, updateBookingStatus, getBookingStats, getTopDestinations,
} from '../controllers/booking.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { createBookingValidation, mongoIdParam, bookingListValidation, bookingStatusValidation } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/', protect, createBookingValidation, createBooking);
router.get('/destinations/top', getTopDestinations);
router.get('/my', protect, getMyBookings);
router.get('/admin/all', protect, adminOnly, bookingListValidation, getAllBookings);
router.get('/admin/stats', protect, adminOnly, getBookingStats);
router.get('/:id', protect, mongoIdParam('id'), getBookingById);
router.put('/:id/cancel', protect, mongoIdParam('id'), cancelBooking);
router.put('/:id/status', protect, adminOnly, mongoIdParam('id'), bookingStatusValidation, updateBookingStatus);

export default router;
