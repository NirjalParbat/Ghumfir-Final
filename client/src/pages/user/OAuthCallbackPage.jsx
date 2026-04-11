import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loader, XCircle } from 'lucide-react';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (err || !token) {
      setError('Google sign-in failed. Please try again.');
      return;
    }

    loginWithToken(token)
      .then((user) => navigate(user.role === 'admin' ? '/admin' : '/', { replace: true }))
      .catch(() => setError('Sign-in failed. Please try again.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-4">{error}</p>
          <Link to="/login" className="text-primary-600 hover:underline text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 text-sm">Completing Google sign-in…</p>
      </div>
    </div>
  );
}
