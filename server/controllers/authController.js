import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/sendEmail.js';

const SALT_ROUNDS = 10;

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
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    console.log('[bcrypt] Register: hashing password with salt rounds = 10');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('[bcrypt] Register: password hashed successfully');

    const user = new User({ name, email: normalizedEmail, password: hashedPassword, phone });
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
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    console.log('[bcrypt] Login: comparing entered password with stored hash');
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`[bcrypt] Login: compare result = ${passwordMatch}`);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
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

    console.log('[bcrypt] Change password: comparing current password');
    const currentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    console.log(`[bcrypt] Change password: current password valid = ${currentPasswordMatch}`);

    if (!currentPasswordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    console.log('[bcrypt] Change password: hashing new password with salt rounds = 10');
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ success: false, message: 'Password change failed. Please try again.' });
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();
    const genericMessage = 'If an account with this email exists, a reset link has been sent.';

    if (!normalizedEmail) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpire');
    if (!user) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <div style="background:#0f766e;color:#fff;padding:24px 28px;">
            <h1 style="margin:0;font-size:24px;">Reset Your Password</h1>
            <p style="margin:8px 0 0;font-size:14px;opacity:0.92;">Use the button below to set a new password.</p>
          </div>
          <div style="padding:28px;">
            <p style="font-size:14px;color:#374151;line-height:1.6;">This link expires in 15 minutes.</p>
            <a href="${resetUrl}" style="display:inline-block;margin:12px 0;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">Reset Password</a>
            <p style="font-size:13px;color:#6b7280;word-break:break-all;line-height:1.6;">If the button does not work, open this URL:<br/>${resetUrl}</p>
            <p style="font-size:13px;color:#6b7280;">If you did not request this, you can ignore this email.</p>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Ghumfir Password Reset',
      html,
    });

    return res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('forgotPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
};

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: new Date() },
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
    }

    console.log('[bcrypt] Reset password: hashing new password with salt rounds = 10');
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
};