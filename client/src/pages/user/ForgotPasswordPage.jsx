/**
 * ForgotPasswordPage Component
 * 
 * Allows users to request a password reset by entering their email address.
 * The backend sends a secure reset link via email (if configured).
 * Uses generic success message to prevent account enumeration attacks.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { authAPI } from '../../api/index.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handles form submission to request password reset
   * @param {Event} e - Form submission event
   * Sends email to backend, displays generic success message for security
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await authAPI.forgotPassword({ email: email.trim().toLowerCase() });
      setSuccess(data.message || 'If an account with this email exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-brand-border rounded-2xl shadow-sm p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-brand-text mb-2">Forgot Password</h1>
        <p className="text-sm text-brand-muted mb-6">Enter your email and we will send a reset link.</p>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl mb-4 text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-9"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? 'Sending reset link...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-sm text-brand-muted mt-5 text-center">
          Remember your password?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-accent-500">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
