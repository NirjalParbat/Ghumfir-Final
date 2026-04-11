import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sanitizeText } from '../utils/sanitizeText.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (typeof this.name === 'string') this.name = sanitizeText(this.name, { maxLength: 80 });
  if (typeof this.phone === 'string') this.phone = sanitizeText(this.phone, { maxLength: 30 });
  if (typeof this.avatar === 'string') this.avatar = sanitizeText(this.avatar, { maxLength: 500 });
  if (typeof this.email === 'string') this.email = sanitizeText(this.email, { maxLength: 255 }).toLowerCase();
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
