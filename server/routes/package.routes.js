import express from 'express';
import {
  getTours, getPackageById, createPackage,
  updatePackage, deletePackage, getFeaturedPackages, getAllPackagesAdmin,
} from '../controllers/tourController.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import {
  mongoIdParam,
  packageFilterValidation,
  createPackageValidation,
  updatePackageValidation,
} from '../middleware/validation.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

const publicReadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

router.get('/', publicReadLimiter, packageFilterValidation, getTours);
router.get('/featured', publicReadLimiter, getFeaturedPackages);
router.get('/admin/all', protect, adminOnly, getAllPackagesAdmin);
router.get('/:id', publicReadLimiter, mongoIdParam('id'), getPackageById);
router.post('/', protect, adminOnly, createPackageValidation, createPackage);
router.put('/:id', protect, adminOnly, mongoIdParam('id'), updatePackageValidation, updatePackage);
router.delete('/:id', protect, adminOnly, mongoIdParam('id'), deletePackage);

export default router;
