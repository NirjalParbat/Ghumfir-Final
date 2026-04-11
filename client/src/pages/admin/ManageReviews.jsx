import { useState, useEffect } from 'react';
import { reviewAPI } from '../../api/index.js';
import { Trash2 } from 'lucide-react';
import StarRating from '../../components/common/StarRating.jsx';

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewAPI.getAll()
      .then(({ data }) => setReviews(data.reviews))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-gray-500">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Manage Reviews</h1>
        <p className="text-sm text-gray-500">{reviews.length} total reviews</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Package', 'Rating', 'Comment', 'Date', 'Action'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reviews.map((r) => (
              <tr key={r._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{r.user?.name}</div>
                  <div className="text-xs text-gray-400">{r.user?.email}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">{r.package?.title}</td>
                <td className="px-4 py-3"><StarRating value={r.rating} size="sm" /></td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                  <p className="line-clamp-2">{r.comment}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No reviews yet</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
