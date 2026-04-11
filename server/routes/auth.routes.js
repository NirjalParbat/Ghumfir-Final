/**
 * Authentication Routes
 * 
 * Endpoints:
 * POST   /register - Create new user account (rate limited: 10/hour)
 * POST   /login - Authenticate user and get JWT token (rate limited: 10/15min)
 * POST   /forgot-password - Request password reset email (rate limited: 10/15min)
 * PUT    /reset-password - Update password with reset token (rate limited: 10/15min)
 * GET    /me - Get current user profile (protected)
 * PUT    /update-profile - Update user details (protected)
 * PUT    /change-password - Change password with old password verification (protected)
 * POST   /google - Google OAuth callback (rate limited: 30/15min)
 * GET    /google/callback - Google OAuth redirect (rate limited: 30/15min)
 */

import express from 'express';
import passport from 'passport';
import generateToken from '../utils/generateToken.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  emailValidation,
  resetPasswordValidation,
} from '../middleware/validation.middleware.js';
import { createRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = express.Router();

// 10 registration attempts per hour per IP
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Please try again in an hour.' },
});

// 10 login attempts per 15 minutes per IP
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});

const googleAuthLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many Google auth attempts. Please try again later.' },
});

router.post('/register', registerLimiter, registerValidation, register);
router.post('/login', loginLimiter, loginValidation, login);
router.post('/forgot-password', loginLimiter, emailValidation, forgotPassword);
router.put('/reset-password', loginLimiter, resetPasswordValidation, resetPassword);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfileValidation, updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);

// --- Google OAuth ---
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Step 1: redirect browser to Google consent screen
router.get('/google', googleAuthLimiter, passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Google redirects back here with auth code
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${CLIENT_URL}/login?error=google_failed`,
  }),
  (req, res) => {
    const token = generateToken(req.user._id);
    // Destroy the OAuth handshake session — API auth uses JWT from here on
    req.session.destroy(() => {
      res.redirect(`${CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
    });
  }
);

export default router;
