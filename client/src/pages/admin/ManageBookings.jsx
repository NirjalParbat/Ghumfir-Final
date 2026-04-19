import { useState, useEffect } from 'react';
import { bookingAPI } from '../../api/index.js';
import { Search, Filter } from 'lucide-react';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchBookings = () => {
    const params = filter ? { status: filter } : {};
    bookingAPI.getAll(params)
      .then(({ data }) => setBookings(data.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [filter]);

  const handleStatusUpdate = async (id, updates) => {
    try {
      await bookingAPI.updateStatus(id, updates);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const filtered = bookings.filter((b) =>
    b.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.package?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-sm text-gray-500">{bookings.length} total bookings</p>
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by user or package..." className="input pl-9" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-full sm:w-auto">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Package', 'Date', 'People', 'Amount', 'Payment', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{b.user?.name}</div>
                    <div className="text-xs text-gray-400">{b.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800 max-w-xs truncate">{b.package?.title}</div>
                    <div className="text-xs text-gray-400">{b.package?.destination}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(b.travelDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.numberOfPeople}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">NPR {b.totalPrice?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600 capitalize">{b.paymentMethod}</div>
                    <span className={`badge text-xs ${
                      b.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : b.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : b.paymentStatus === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : b.paymentStatus === 'refunded'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                    }`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${STATUS_COLORS[b.bookingStatus]}`}>{b.bookingStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {b.bookingStatus === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(b._id, { bookingStatus: 'confirmed', paymentStatus: b.paymentMethod === 'cash' ? 'pending' : b.paymentStatus })}
                          className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Confirm
                        </button>
                      )}
                      {b.paymentStatus === 'pending' && b.paymentMethod === 'cash' && b.bookingStatus !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(b._id, { paymentStatus: 'paid' })}
                          className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {b.bookingStatus === 'cancelled' && b.paymentStatus === 'paid' && (
                        <button
                          onClick={() => handleStatusUpdate(b._id, { paymentStatus: 'refunded' })}
                          className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Mark Refunded
                        </button>
                      )}
                      {b.bookingStatus === 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(b._id, { bookingStatus: 'completed' })}
                          className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No bookings found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
