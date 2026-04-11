import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiUsers, FiMapPin, FiStar, FiX } from "react-icons/fi";
import { bookingAPI, reviewAPI } from "../../api/index.js";
import toast from "react-hot-toast";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

const paymentColors = {
  pending: "bg-gray-100 text-gray-600",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
};

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=300&q=80";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null); // booking to review
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data } = await bookingAPI.getMyBookings();
      setBookings(data.bookings);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await bookingAPI.cancel(id);
      toast.success("Booking cancelled");
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }
    setSubmittingReview(true);
    try {
      const selectedPackage = reviewModal?.package || reviewModal?.packageId;
      const selectedPackageId =
        typeof selectedPackage === "string"
          ? selectedPackage
          : selectedPackage?._id;
      await reviewAPI.create({
        packageId: selectedPackageId,
        bookingId: reviewModal._id,
        ...reviewForm,
      });
      toast.success("Review submitted! ðŸŒŸ");
      setReviewModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-800 mb-2">
          My Bookings
        </h1>
        <p className="text-gray-500 mb-8">
          Track and manage your tour bookings
        </p>

        {bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">ðŸ—ºï¸</div>
            <h3 className="font-display text-xl font-bold text-gray-700 mb-2">
              No bookings yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start your adventure by booking a tour package!
            </p>
            <Link to="/packages" className="btn-primary">
              Browse Packages
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const pkg = booking.package || booking.packageId;
              const packageDocId = typeof pkg === "string" ? pkg : pkg?._id;
              const canCancel =
                booking.bookingStatus === "pending" ||
                booking.bookingStatus === "confirmed";
              const canReview =
                !booking.hasReviewed &&
                (booking.bookingStatus === "confirmed" ||
                  booking.bookingStatus === "completed");
              const rawImage = pkg?.images?.[0];
              const coverImage =
                typeof rawImage === "string" ? rawImage : rawImage?.url;

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row">
                    <img
                      src={coverImage || PLACEHOLDER}
                      alt={pkg?.title}
                      className="w-full sm:w-36 h-32 sm:h-auto object-cover"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                    <div className="p-5 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-display font-bold text-gray-800 text-lg">
                            {pkg?.title}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FiMapPin className="text-primary-400" />{" "}
                            {pkg?.destination}, {pkg?.country}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span
                            className={`badge ${statusColors[booking.bookingStatus]}`}
                          >
                            {booking.bookingStatus}
                          </span>
                          <span
                            className={`badge ${paymentColors[booking.paymentStatus]}`}
                          >
                            {booking.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FiCalendar className="text-primary-400" />
                          {new Date(booking.travelDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <FiUsers className="text-primary-400" />
                          {booking.numberOfPeople} traveler
                          {booking.numberOfPeople > 1 ? "s" : ""}
                        </div>
                        <div className="text-gray-500">
                          ðŸ’³ {booking.paymentMethod}
                        </div>
                        <div className="font-semibold text-primary-500">
                          NPR {booking.totalPrice?.toLocaleString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {packageDocId ? (
                          <Link
                            to={`/packages/${packageDocId}`}
                            className="text-xs font-medium text-primary-500 hover:text-primary-600 border border-primary-200 hover:border-primary-400 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            View Package
                          </Link>
                        ) : (
                          <span className="text-xs font-medium text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 cursor-not-allowed">
                            Package Unavailable
                          </span>
                        )}
                        {canReview && (
                          <button
                            onClick={() => setReviewModal(booking)}
                            className="text-xs font-medium text-yellow-600 border border-yellow-300 hover:bg-yellow-50 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                          >
                            <FiStar /> Write Review
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
                          >
                            <FiX /> Cancel
                          </button>
                        )}
                        {booking.hasReviewed && (
                          <span className="text-xs text-green-600 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-1">
                            âœ… Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-gray-800 text-lg">
                Write a Review
              </h3>
              <button
                onClick={() => setReviewModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Reviewing:{" "}
              <strong>
                {(reviewModal.package || reviewModal.packageId)?.title}
              </strong>
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setReviewForm((p) => ({ ...p, rating: star }))
                      }
                    >
                      <FiStar
                        className={`text-2xl ${star <= reviewForm.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Sum up your experience"
                  className="input-field text-sm"
                />
              </div>
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review *
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((p) => ({ ...p, comment: e.target.value }))
                  }
                  rows={4}
                  placeholder="Share your experience with other travelers..."
                  className="input-field resize-none text-sm"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 btn-primary py-3 text-sm"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
