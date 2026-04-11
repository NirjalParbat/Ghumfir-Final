/**
 * LoginPage Component
 * 
 * User authentication page with email/password and OAuth options.
 * Features:
 * - Email and password login with validation
 * - Google OAuth authentication via GoogleSignInButton
 * - Forgot password link for account recovery
 * - Redirect to intended page after successful login
 * - Error handling and display
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import logoImg from '../../images/logo.png';
import GoogleSignInButton from '../../components/common/GoogleSignInButton.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const credentials = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      const data = await login(credentials);
      navigate(data.user.role === 'admin' ? '/admin' : from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Cannot reach server. Make sure backend is running, then try again.');
      } else {
        setError(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&q=90" alt="Nepal" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/70 to-primary-700/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <div className="mb-8 rounded-2xl bg-white/95 px-4 py-3 shadow-xl ring-1 ring-white/60 backdrop-blur-sm">
            <img src={logoImg} alt="Ghumfir" className="h-16 w-auto object-contain" />
          </div>
          <h2 className="font-display text-4xl font-bold text-center mb-4 text-white">Welcome Back, Explorer!</h2>
          <p className="text-white/80 text-center max-w-sm">Login to continue your journey and discover amazing destinations across Nepal and beyond.</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 inline-flex rounded-xl bg-primary-50 px-3 py-2 ring-1 ring-primary-100">
            <img src={logoImg} alt="Ghumfir" className="h-11 w-auto object-contain" />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text mb-2">Sign In</h1>
          <p className="text-brand-muted mb-8">Enter your credentials to access your account</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl mb-5 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className="input pr-12"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-primary-600 hover:text-accent-500">
                Forgot password?
              </Link>
            </div>
          </form>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs text-gray-400"><span className="bg-white px-3">or continue with</span></div>
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-brand-muted mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:text-accent-500">Create one</Link>
          </p>
{/* 
          <div className="mt-6 p-4 bg-brand-bg border border-brand-border rounded-xl text-xs text-brand-muted">
            <strong className="text-brand-text">Demo Admin:</strong> admin@ghumfir.com / admin123
          </div> */}
        </div>
      </div>
    </div>
  );
}
