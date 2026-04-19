import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { bookingAPI, packageAPI, userAPI } from '../../api/index.js';
import {
  Package, BookOpen, Users, DollarSign,
  Clock, CheckCircle, XCircle, ArrowUpRight, CalendarDays, FilterX, Download,
} from 'lucide-react';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [packages, setPackages] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateError, setDateError] = useState('');
  const [comparisonPeriod, setComparisonPeriod] = useState('month');
  const [comparisonPackageA, setComparisonPackageA] = useState('');
  const [comparisonPackageB, setComparisonPackageB] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = () => {
    setLoading(true);
    setError('');
    Promise.all([
      bookingAPI.getAll({ limit: 1000 }),
      packageAPI.getAdminAll(),
      userAPI.getAll(),
    ]).then(([bookRes, pkgRes, userRes]) => {
      console.log('Dashboard data fetched:', {
        bookings: bookRes.data.bookings?.length || 0,
        packages: pkgRes.data.packages?.length || 0,
        users: userRes.data.users?.length || 0,
      });
      setBookings(bookRes.data.bookings || []);
      setPackages(pkgRes.data.packages);
      setUsersCount(userRes.data.users.length);
    }).catch((err) => {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try refreshing.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  useEffect(() => {
    const handleFocus = () => {
      fetchDashboardData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (!dateFrom || !dateTo) {
      setDateError('');
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      setDateError('Start date cannot be later than end date.');
      return;
    }
    setDateError('');
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (packages.length < 2) return;
    setComparisonPackageA((prev) => prev || packages[0]._id);
    setComparisonPackageB((prev) => prev || packages[1]._id);
  }, [packages]);

  const selectedRangeBookings = useMemo(() => {
    const isInSelectedRange = (createdAt) => {
      const date = new Date(createdAt);
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (date < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (date > to) return false;
      }
      return true;
    };

    return bookings.filter((booking) => isInSelectedRange(booking.createdAt));
  }, [bookings, dateFrom, dateTo]);

  const previousRangeBookings = useMemo(() => {
    if (!dateFrom && !dateTo) {
      return [];
    }

    const start = new Date(dateFrom || dateTo);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo || dateFrom);
    end.setHours(23, 59, 59, 999);
    const duration = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return bookings.filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      return createdAt >= previousStart && createdAt <= previousEnd;
    });
  }, [bookings, dateFrom, dateTo]);

  const filteredBookings = useMemo(() => {
    return selectedRangeBookings;
  }, [selectedRangeBookings]);

  const stats = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const confirmedBookings = filteredBookings.filter((b) => b.bookingStatus === 'confirmed').length;
    const pendingBookings = filteredBookings.filter((b) => b.bookingStatus === 'pending').length;
    const cancelledBookings = filteredBookings.filter((b) => b.bookingStatus === 'cancelled').length;
    const completedBookings = filteredBookings.filter((b) => b.bookingStatus === 'completed').length;
    const totalRevenue = filteredBookings
      .filter((b) => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
    const pendingRevenue = filteredBookings
      .filter((b) => b.paymentStatus === 'pending' && b.bookingStatus !== 'cancelled')
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    return {
      totalBookings,
      confirmedBookings,
      pendingBookings,
      cancelledBookings,
      completedBookings,
      totalRevenue,
      pendingRevenue,
    };
  }, [filteredBookings]);

  const revenueTrendData = useMemo(() => {
    const grouped = new Map();
    filteredBookings
      .filter((b) => b.paymentStatus === 'paid')
      .forEach((b) => {
        const d = new Date(b.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        grouped.set(key, (grouped.get(key) || 0) + (Number(b.totalPrice) || 0));
      });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, revenue]) => ({ month, revenue }));
  }, [filteredBookings]);

  const destinationBarData = useMemo(() => {
    const grouped = new Map();
    filteredBookings
      .filter((b) => b.bookingStatus !== 'cancelled')
      .forEach((b) => {
        const destination = b.package?.destination || 'Unknown';
        grouped.set(destination, (grouped.get(destination) || 0) + 1);
      });

    return Array.from(grouped.entries())
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [filteredBookings]);

  const topPackagesData = useMemo(() => {
    const grouped = new Map();

    filteredBookings
      .filter((booking) => booking.bookingStatus !== 'cancelled')
      .forEach((booking) => {
        const packageId = booking.package?._id?.toString() || 'unknown';
        const previous = grouped.get(packageId) || {
          packageId,
          title: booking.package?.title || 'Unknown package',
          destination: booking.package?.destination || 'Unknown',
          bookings: 0,
          revenue: 0,
        };

        previous.bookings += 1;
        previous.revenue += Number(booking.totalPrice) || 0;
        grouped.set(packageId, previous);
      });

    return Array.from(grouped.values())
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredBookings]);

  const topUsersData = useMemo(() => {
    const grouped = new Map();

    filteredBookings
      .filter((booking) => booking.bookingStatus !== 'cancelled')
      .forEach((booking) => {
        const userId = booking.user?._id?.toString() || 'unknown';
        const previous = grouped.get(userId) || {
          userId,
          name: booking.user?.name || 'Unknown user',
          email: booking.user?.email || '',
          bookings: 0,
          revenue: 0,
        };

        previous.bookings += 1;
        previous.revenue += Number(booking.totalPrice) || 0;
        grouped.set(userId, previous);
      });

    return Array.from(grouped.values())
      .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredBookings]);

  const revenueComparison = useMemo(() => {
    const currentRevenue = filteredBookings
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);

    const previousRevenue = previousRangeBookings
      .filter((booking) => booking.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);

    const difference = currentRevenue - previousRevenue;
    const percentage = previousRevenue > 0 ? (difference / previousRevenue) * 100 : 0;

    return {
      currentRevenue,
      previousRevenue,
      difference,
      percentage,
    };
  }, [filteredBookings, previousRangeBookings]);

  const periodKeyForDate = (value, period) => {
    const date = new Date(value);
    if (period === 'day') {
      return date.toISOString().slice(0, 10);
    }

    if (period === 'week') {
      const start = new Date(date);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      return start.toISOString().slice(0, 10);
    }

    if (period === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    return `${date.getFullYear()}`;
  };

  const formatPeriodLabel = (periodKey, period) => {
    if (period === 'day') {
      return new Date(periodKey).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    if (period === 'week') {
      return `Week of ${new Date(periodKey).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    if (period === 'month') {
      const [year, month] = periodKey.split('-').map(Number);
      return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    }

    return periodKey;
  };

  const comparisonPackages = useMemo(() => {
    const packageA = packages.find((pkg) => pkg._id === comparisonPackageA);
    const packageB = packages.find((pkg) => pkg._id === comparisonPackageB);

    return { packageA, packageB };
  }, [packages, comparisonPackageA, comparisonPackageB]);

  const packageComparisonData = useMemo(() => {
    if (!comparisonPackages.packageA || !comparisonPackages.packageB) return [];

    const packageAId = comparisonPackages.packageA._id.toString();
    const packageBId = comparisonPackages.packageB._id.toString();
    const grouped = new Map();

    filteredBookings
      .filter((booking) => booking.bookingStatus !== 'cancelled')
      .forEach((booking) => {
        const packageId = booking.package?._id?.toString();
        if (packageId !== packageAId && packageId !== packageBId) return;

        const periodKey = periodKeyForDate(booking.createdAt, comparisonPeriod);
        const previous = grouped.get(periodKey) || {
          periodKey,
          periodLabel: formatPeriodLabel(periodKey, comparisonPeriod),
          packageABookings: 0,
          packageBBookings: 0,
          packageARevenue: 0,
          packageBRevenue: 0,
        };

        if (packageId === packageAId) {
          previous.packageABookings += 1;
          previous.packageARevenue += Number(booking.totalPrice) || 0;
        }

        if (packageId === packageBId) {
          previous.packageBBookings += 1;
          previous.packageBRevenue += Number(booking.totalPrice) || 0;
        }

        grouped.set(periodKey, previous);
      });

    return Array.from(grouped.values())
      .sort((a, b) => a.periodKey.localeCompare(b.periodKey));
  }, [filteredBookings, comparisonPackages, comparisonPeriod]);

  const formatRevenueAxis = (value) => {
    const amount = Number(value) || 0;
    if (amount >= 1000000) return `NPR ${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    if (amount >= 1000) return `NPR ${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
    return `NPR ${amount}`;
  };

  const formatCurrency = (value) => `NPR ${Number(value || 0).toLocaleString()}`;

  const handleDownloadReport = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const reportTitle = 'Ghumfir Admin Report';
    const generatedAt = new Date().toLocaleString();
    const selectedRangeLabel = `${dateFrom || 'All'} to ${dateTo || 'All'}`;

    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(reportTitle, 14, 16);

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated at: ${generatedAt}`, 14, 23);
    doc.text(`Selected range: ${selectedRangeLabel}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', formatCurrency(revenueComparison.currentRevenue)],
        ['Previous Revenue', formatCurrency(revenueComparison.previousRevenue)],
        ['Revenue Change', `${revenueComparison.difference >= 0 ? '+' : ''}${formatCurrency(Math.abs(revenueComparison.difference))}`],
        ['Total Bookings', String(stats.totalBookings)],
        ['Confirmed Bookings', String(stats.confirmedBookings)],
        ['Pending Bookings', String(stats.pendingBookings)],
        ['Cancelled Bookings', String(stats.cancelledBookings)],
        ['Completed Bookings', String(stats.completedBookings)],
        ['Packages', String(packages.length)],
        ['Users', String(usersCount)],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [14, 116, 144] },
      margin: { left: 14, right: 14 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Top Packages', 'Bookings', 'Revenue']],
      body: topPackagesData.map((item) => [
        `${item.title} (${item.destination})`,
        String(item.bookings),
        formatCurrency(item.revenue),
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 163, 74] },
      margin: { left: 14, right: 14 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Top Users', 'Bookings', 'Revenue']],
      body: topUsersData.map((item) => [
        `${item.name}${item.email ? ` (${item.email})` : ''}`,
        String(item.bookings),
        formatCurrency(item.revenue),
      ]),
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [168, 85, 247] },
      margin: { left: 14, right: 14 },
    });

    if (packageComparisonData.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [[
          'Period',
          comparisonPackages.packageA?.title || 'Package A',
          comparisonPackages.packageB?.title || 'Package B',
        ]],
        body: packageComparisonData.map((item) => [
          item.periodLabel,
          `${item.packageABookings} booking(s), ${formatCurrency(item.packageARevenue)}`,
          `${item.packageBBookings} booking(s), ${formatCurrency(item.packageBRevenue)}`,
        ]),
        theme: 'grid',
        styles: { fontSize: 8.3, cellPadding: 2.5 },
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save(`ghumfir-admin-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const statusPieData = useMemo(() => ([
    { name: 'Confirmed', value: stats.confirmedBookings },
    { name: 'Pending', value: stats.pendingBookings },
    { name: 'Cancelled', value: stats.cancelledBookings },
    { name: 'Completed', value: stats.completedBookings },
  ].filter((item) => item.value > 0)), [stats]);

  const recentBookings = useMemo(() => (
    [...filteredBookings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  ), [filteredBookings]);

  const STAT_CARDS = [
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
      label: 'Pending Revenue',
      value: `NPR ${stats.pendingRevenue?.toLocaleString()}`,
      icon: DollarSign,
      accentClass: 'stat-bar-warning',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      change: null,
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      icon: BookOpen,
      accentClass: 'stat-bar-secondary',
      iconBg: 'bg-secondary-100',
      iconColor: 'text-secondary-600',
      change: null,
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
      change: null,
    },
  ];

  const STATUS_STYLES = {
    pending:   'badge-warning',
    confirmed: 'badge-success',
    cancelled: 'badge-danger',
    completed: 'badge-secondary',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-brand-bg min-h-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text">Dashboard</h1>
          <p className="text-brand-muted text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh dashboard data"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-white border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-muted shadow-card hover:border-primary-300 hover:text-primary-600 transition-colors"
          >
            <Download className="w-4 h-4 text-primary-500" />
            Download PDF report
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-600 hover:text-red-700 text-lg font-bold"
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-blue-900">Loading dashboard data...</p>
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-sm text-amber-900">
            <strong>No bookings yet.</strong> Create a booking from the user dashboard or wait for bookings to be created.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-border shadow-card mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-primary-600" />
          <h2 className="font-semibold text-brand-text">Date-wise filter</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input"
            aria-label="Filter start date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input"
            aria-label="Filter end date"
          />
          <button
            type="button"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <FilterX className="w-4 h-4" /> Reset Filter
          </button>
        </div>
        {dateError && <p className="text-red-600 text-xs mt-2">{dateError}</p>}
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5 xl:col-span-2">
          <h3 className="font-display font-semibold text-brand-text mb-4">Revenue Trend (Line Chart)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis width={90} allowDecimals={false} tickFormatter={formatRevenueAxis} domain={[0, 'dataMax']} />
                <Tooltip formatter={(value) => `NPR ${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5">
          <h3 className="font-display font-semibold text-brand-text mb-4">Booking Status (Pie Chart)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label
                >
                  {statusPieData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${entry.value}`}
                      fill={['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'][index % 4]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5 mb-8">
        <h3 className="font-display font-semibold text-brand-text mb-4">Top Destinations by Bookings (Bar Graph)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={destinationBarData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="destination" interval={0} angle={-15} textAnchor="end" height={65} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-5">
            <div>
              <h3 className="font-display font-semibold text-brand-text">Package Comparison</h3>
              <p className="text-xs text-brand-muted mt-0.5">Compare popular packages by day, week, month, or year.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              <select value={comparisonPeriod} onChange={(e) => setComparisonPeriod(e.target.value)} className="input">
                <option value="day">Days</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
                <option value="year">Years</option>
              </select>
              <select value={comparisonPackageA} onChange={(e) => setComparisonPackageA(e.target.value)} className="input">
                {packages.map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>{pkg.title}</option>
                ))}
              </select>
              <select value={comparisonPackageB} onChange={(e) => setComparisonPackageB(e.target.value)} className="input">
                {packages.map((pkg) => (
                  <option key={pkg._id} value={pkg._id}>{pkg.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-80">
            {packageComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={packageComparisonData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodLabel" interval={0} angle={-15} textAnchor="end" height={65} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value).toLocaleString()} bookings`,
                      name === 'packageABookings'
                        ? comparisonPackages.packageA?.title || 'Package A'
                        : comparisonPackages.packageB?.title || 'Package B',
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="packageABookings"
                    name={comparisonPackages.packageA?.title || 'Package A'}
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="packageBBookings"
                    name={comparisonPackages.packageB?.title || 'Package B'}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-brand-muted bg-brand-bg rounded-2xl border border-dashed border-brand-border">
                Select two packages to start comparing performance.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-card p-4 sm:p-5">
          <h3 className="font-display font-semibold text-brand-text mb-4">Revenue Comparison</h3>
          <div className="space-y-3">
            <div className="rounded-2xl border border-brand-border bg-brand-bg p-4">
              <div className="text-xs text-brand-muted">Current Range Revenue</div>
              <div className="text-2xl font-bold text-brand-text">NPR {revenueComparison.currentRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-bg p-4">
              <div className="text-xs text-brand-muted">Previous Equivalent Revenue</div>
              <div className="text-2xl font-bold text-brand-text">NPR {revenueComparison.previousRevenue.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-brand-border bg-brand-bg p-4">
              <div className="text-xs text-brand-muted">Change</div>
              <div className={`text-2xl font-bold ${revenueComparison.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {revenueComparison.difference >= 0 ? '+' : '-'}NPR {Math.abs(revenueComparison.difference).toLocaleString()}
              </div>
              <div className={`text-xs mt-1 ${revenueComparison.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {revenueComparison.percentage >= 0 ? '+' : ''}{revenueComparison.percentage.toFixed(1)}% vs previous period
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-brand-border shadow-card">
          <div className="px-5 pt-5 pb-3 border-b border-brand-border">
            <h2 className="font-display font-semibold text-brand-text">Top Packages in Selected Range</h2>
            <p className="text-xs text-brand-muted mt-0.5">Ranked by bookings and revenue from the current range.</p>
          </div>
          <div className="p-4 space-y-3">
            {topPackagesData.length > 0 ? topPackagesData.map((item, index) => (
              <div key={item.packageId} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-bg px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-brand-muted mb-0.5">#{index + 1}</div>
                  <div className="text-sm font-semibold text-brand-text truncate">{item.title}</div>
                  <div className="text-xs text-brand-muted truncate">{item.destination}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-text">{item.bookings} bookings</div>
                  <div className="text-xs text-brand-muted">NPR {item.revenue.toLocaleString()}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-brand-muted text-center py-8">No package activity in the selected range.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-brand-border shadow-card">
          <div className="px-5 pt-5 pb-3 border-b border-brand-border">
            <h2 className="font-display font-semibold text-brand-text">Top Users in Selected Range</h2>
            <p className="text-xs text-brand-muted mt-0.5">Ranked by booking count and total spend.</p>
          </div>
          <div className="p-4 space-y-3">
            {topUsersData.length > 0 ? topUsersData.map((item, index) => (
              <div key={item.userId} className="flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-brand-bg px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-brand-muted mb-0.5">#{index + 1}</div>
                  <div className="text-sm font-semibold text-brand-text truncate">{item.name}</div>
                  <div className="text-xs text-brand-muted truncate">{item.email || 'No email provided'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-brand-text">{item.bookings} bookings</div>
                  <div className="text-xs text-brand-muted">NPR {item.revenue.toLocaleString()}</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-brand-muted text-center py-8">No user activity in the selected range.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-brand-border shadow-card">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border">
            <div>
              <h2 className="font-display font-semibold text-brand-text">Recent Bookings</h2>
              <p className="text-xs text-brand-muted mt-0.5">Filtered latest 5 bookings</p>
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
                        {b.user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                <p className="text-sm text-brand-muted">No bookings in selected date range</p>
              </div>
            )}
          </div>
        </div>

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

      {loading && <p className="text-sm text-brand-muted mt-4">Loading report...</p>}
    </div>
  );
}

