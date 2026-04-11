import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      logAuditEvent('auth.register.blocked_existing_email', { email: normalizedEmail, ip: req.ip }, 'warn');
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = new User({ name, email: normalizedEmail, password, phone });
    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
    logAuditEvent('auth.register.success', { userId: user._id, email: normalizedEmail, ip: req.ip });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      logAuditEvent('auth.login.failed_unknown_user', { email: normalizedEmail, ip: req.ip }, 'warn');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      logAuditEvent('auth.login.failed_bad_password', {
        userId: user._id,
        email: normalizedEmail,
        ip: req.ip,
      }, 'warn');
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      logAuditEvent('auth.login.blocked_inactive_account', { userId: user._id, email: normalizedEmail, ip: req.ip }, 'warn');
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
    logAuditEvent('auth.login.success', { userId: user._id, email: normalizedEmail, ip: req.ip });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user profile.' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(500).json({ success: false, message: 'Update failed. Please try again.' });
  }
};

// @desc    Change password (authenticated)
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: 'Password change failed. Please try again.' });
  }
};

