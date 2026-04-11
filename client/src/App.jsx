import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Public Pages
import HomePage from './pages/user/HomePage.jsx';
import Tours from './pages/user/Tours.jsx';
import PackageDetailPage from './pages/user/PackageDetailPage.jsx';
import LoginPage from './pages/user/LoginPage.jsx';
import RegisterPage from './pages/user/RegisterPage.jsx';
import OAuthCallbackPage from './pages/user/OAuthCallbackPage.jsx';
import ForgotPasswordPage from './pages/user/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/user/ResetPasswordPage.jsx';

// Protected Pages
import BookingPage from './pages/user/BookingPage.jsx';
import BookingsPage from './pages/user/BookingsPage.jsx';
import ProfilePage from './pages/user/ProfilePage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManagePackages from './pages/admin/ManagePackages.jsx';
import ManageBookings from './pages/admin/ManageBookings.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageReviews from './pages/admin/ManageReviews.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/packages" element={<Tours />} />
            <Route path="/packages/:id" element={<PackageDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />

            {/* Protected User Routes */}
            <Route path="/book/:id" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="packages" element={<ManagePackages />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="reviews" element={<ManageReviews />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="text-7xl mb-4">🏔️</div>
                <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-gray-500 mb-6">Oops! This page got lost in the mountains.</p>
                <a href="/" className="btn-primary">Back to Home</a>
              </div>
            </div>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
