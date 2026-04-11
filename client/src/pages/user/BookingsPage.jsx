import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingAPI, reviewAPI } from '../../api/index.js';
import { MapPin, Calendar, Users, ChevronDown, Star } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StarRating from '../../components/common/StarRating.jsx';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    bookingAPI.getMyBookings()
      .then(({ data }) => setBookings(data.bookings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, bookingStatus: 'cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleReviewSubmit = async () => {
    setSubmitting(true);
    try {
      const selectedPackage = reviewModal?.package || reviewModal?.packageId;
      const selectedPackageId = typeof selectedPackage === 'string' ? selectedPackage : selectedPackage?._id;
      await reviewAPI.create({
        packageId: selectedPackageId,
        bookingId: reviewModal._id,
        rating: review.rating,
        comment: review.comment,
      });
      setReviewModal(null);
      alert('Review submitted!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">My Bookings</h1>

        {loading ? (
          <LoadingSpinner />
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const pkg = booking.package || booking.packageId;
              const packageDocId = typeof pkg === 'string' ? pkg : pkg?._id;
              const rawImage = pkg?.images?.[0];
              const cover = (typeof rawImage === 'string' ? rawImage : rawImage?.url) || 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&q=80';
              return (
                <div key={booking._id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <img src={cover} alt={pkg?.title} className="w-full sm:w-40 h-36 object-cover flex-shrink-0" />
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-display font-semibold text-lg text-gray-900">{pkg?.title}</h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-primary-500" />
                            {pkg?.destination}
                          </div>
                        </div>
                        <span className={`badge ${STATUS_COLORS[booking.bookingStatus]}`}>
                          {booking.bookingStatus}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(booking.travelDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {booking.numberOfPeople} people
                        </div>
                        <div className="font-semibold text-primary-600">
                          NPR {booking.totalPrice?.toLocaleString()}
                        </div>
                        <span className={`badge ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {booking.paymentMethod} · {booking.paymentStatus}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {booking.bookingStatus === 'pending' && (
                          <button onClick={() => handleCancel(booking._id)} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                            Cancel
                          </button>
                        )}
                        {['confirmed', 'completed'].includes(booking.bookingStatus) && (
                          <button onClick={() => setReviewModal(booking)} className="flex items-center gap-1 text-xs px-3 py-1.5 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors">
                            <Star className="w-3 h-3" /> Leave Review
                          </button>
                        )}
                        {packageDocId ? (
                          <Link to={`/packages/${packageDocId}`} className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                            View Package
                          </Link>
                        ) : (
                          <span className="text-xs px-3 py-1.5 border border-gray-200 text-gray-400 rounded-lg cursor-not-allowed">
                            Package Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🧳</div>
            <h3 className="font-display text-xl font-semibold text-gray-700 mb-2">No bookings yet</h3>
            <p className="text-gray-500 mb-6">Start exploring and book your first adventure!</p>
            <Link to="/packages" className="btn-primary">Browse Packages</Link>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Leave a Review</h2>
            <p className="text-sm text-gray-500 mb-5">{(reviewModal.package || reviewModal.packageId)?.title}</p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Your Rating</label>
              <StarRating value={review.rating} onChange={(r) => setReview(p => ({ ...p, rating: r }))} size="lg" />
            </div>
            <div className="mb-5">
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Your Comment</label>
              <textarea value={review.comment} onChange={(e) => setReview(p => ({ ...p, comment: e.target.value }))} rows={4} className="input resize-none" placeholder="Share your experience..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setReviewModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium">Cancel</button>
              <button onClick={handleReviewSubmit} disabled={submitting || !review.comment} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
