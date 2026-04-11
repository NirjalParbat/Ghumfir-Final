import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, packageAPI, userAPI } from '../../api/index.js';
import {
  TrendingUp, Package, BookOpen, Users, DollarSign,
  Clock, CheckCircle, XCircle, ArrowUpRight, BarChart2,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [packages, setPackages] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    Promise.all([
      bookingAPI.getStats(),
      packageAPI.getAdminAll(),
      bookingAPI.getAll({ limit: 5 }),
      userAPI.getAll(),
    ]).then(([statsRes, pkgRes, bookRes, userRes]) => {
      setStats(statsRes.data.stats);
      setPackages(pkgRes.data.packages);
      setRecentBookings(bookRes.data.bookings);
      setUsersCount(userRes.data.users.length);
    }).catch(console.error);
  }, []);

  const STAT_CARDS = stats ? [
    {
      label: 'Total Revenue',
      value: `NPR ${stats.totalRevenue?.toLocaleString()}`,
      icon: DollarSign,
      accentClass: 'stat-bar-success',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      change: '+12%',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: BookOpen,
      accentClass: 'stat-bar-secondary',
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      change: '+8%',
    },
    {
      label: 'Confirmed',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      accentClass: 'stat-bar-primary',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      change: null,
    },
    {
      label: 'Pending',
      value: stats.pendingBookings,
      icon: Clock,
      accentClass: 'stat-bar-warning',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      change: null,
    },
    {
      label: 'Cancelled',
      value: stats.cancelledBookings,
      icon: XCircle,
      accentClass: 'stat-bar-danger',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-500',
      change: null,
    },
    {
      label: 'Packages',
      value: packages.length,
      icon: Package,
      accentClass: 'stat-bar-primary',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      change: null,
    },
    {
      label: 'Registered Users',
      value: usersCount,
      icon: Users,
      accentClass: 'stat-bar-secondary',
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      change: '+5%',
    },
  ] : [];

  const STATUS_STYLES = {
    pending:   'badge-warning',
    confirmed: 'badge-success',
    cancelled: 'badge-danger',
    completed: 'badge-secondary',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-brand-bg min-h-full">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text">Dashboard</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-muted shadow-card">
          <BarChart2 className="w-4 h-4 text-primary-500" />
          Live overview
        </div>
      </div>

      {/* â”€â”€ Stat Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, accentClass, iconBg, iconColor, change }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl p-5 shadow-card border border-brand-border ${accentClass} hover:shadow-card-hover transition-shadow duration-200`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              {change && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg px-2 py-0.5">
                  {change}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-brand-text mb-0.5 leading-none">
              {value ?? 'â€”'}
            </div>
            <div className="text-xs text-brand-muted font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* â”€â”€ Tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
            <div>
              <h2 className="font-display font-semibold text-brand-text">Recent Bookings</h2>
              <p className="text-xs text-brand-muted mt-0.5">Latest 5 bookings</p>
            </div>
            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-accent-500 font-semibold transition-colors"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3">
            {recentBookings.length > 0 ? (
              <div className="space-y-1.5">
                {recentBookings.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-primary-600 font-bold text-sm">
                        {b.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-text truncate">{b.user?.name}</div>
                      <div className="text-xs text-brand-muted truncate">{b.package?.title}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-brand-text">
                        NPR {b.totalPrice?.toLocaleString()}
                      </div>
                      <span className={`badge text-xs capitalize ${STATUS_STYLES[b.bookingStatus] || 'badge-primary'}`}>
                        {b.bookingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 text-brand-border mx-auto mb-2" />
                <p className="text-sm text-brand-muted">No bookings yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Packages */}
        <div className="bg-white rounded-2xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
            <div>
              <h2 className="font-display font-semibold text-brand-text">All Packages</h2>
              <p className="text-xs text-brand-muted mt-0.5">Top 5 by listing</p>
            </div>
            <Link
              to="/admin/packages"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-accent-500 font-semibold transition-colors"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3">
            {packages.length > 0 ? (
              <div className="space-y-1.5">
                {packages.slice(0, 5).map((pkg) => (
                  <div
                    key={pkg._id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <img
                      src={pkg.images?.[0]?.url || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=100&q=70'}
                      alt={pkg.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-text truncate">{pkg.title}</div>
                      <div className="text-xs text-brand-muted">{pkg.destination} Â· {pkg.category}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary-600">
                        NPR {pkg.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-brand-border mx-auto mb-2" />
                <p className="text-sm text-brand-muted mb-3">No packages yet</p>
                <Link to="/admin/packages" className="btn-primary text-xs py-2 px-4">
                  Add Package
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

