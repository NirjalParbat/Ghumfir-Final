import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Star, ChevronRight, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { packageAPI, reviewAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import StarRating from '../../components/common/StarRating.jsx';

export default function PackageDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    Promise.all([packageAPI.getById(id), reviewAPI.getByPackage(id)])
      .then(([pkgRes, revRes]) => {
        setPkg(pkgRes.data.package);
        setReviews(revRes.data.reviews);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!pkg) return <div className="text-center py-20 text-gray-500">Package not found</div>;

  const images = pkg.images?.length > 0
    ? pkg.images.map((i) => i.url)
    : ['https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=800&q=80'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/packages" className="hover:text-gray-700">Packages</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium truncate">{pkg.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md">
              <div className="relative h-80 md:h-96">
                <img src={images[activeImage]} alt={pkg.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 badge bg-primary-600 text-white">{pkg.category}</span>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-primary-500' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="font-display text-xl sm:text-3xl font-bold text-gray-900">{pkg.title}</h1>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {pkg.destination}, {pkg.country}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-primary-500" />
                  {pkg.duration} days
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  {pkg.rating?.toFixed(1)} ({pkg.numReviews} reviews)
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto scrollbar-hide">
                {['overview', 'itinerary', 'includes', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium capitalize transition-all border-b-2 -mb-px whitespace-nowrap ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab} {tab === 'reviews' && `(${reviews.length})`}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <p className="text-gray-600 leading-relaxed mb-5">{pkg.description}</p>
                  {pkg.highlights?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold text-gray-900 mb-3">Highlights</h3>
                      <ul className="space-y-2">
                        {pkg.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="space-y-4">
                  {pkg.itinerary?.length > 0 ? pkg.itinerary.map((item) => (
                    <div key={item.day} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center text-sm font-bold">
                        {item.day}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display font-semibold text-gray-900 mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        {item.accommodation && (
                          <p className="text-xs text-gray-400 mt-1">🏨 {item.accommodation}</p>
                        )}
                        {item.meals && (
                          <p className="text-xs text-gray-400 mt-0.5">🍽️ {item.meals}</p>
                        )}
                      </div>
                    </div>
                  )) : <p className="text-gray-500">No itinerary added yet.</p>}
                </div>
              )}

              {activeTab === 'includes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pkg.includes?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold text-green-700 mb-3 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> What's Included</h3>
                      <ul className="space-y-2">
                        {pkg.includes.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" />{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.excludes?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold text-red-700 mb-3 flex items-center gap-1"><XCircle className="w-4 h-4" /> Not Included</h3>
                      <ul className="space-y-2">
                        {pkg.excludes.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" />{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review._id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-sm">
                          {review.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{review.user?.name}</div>
                          <StarRating value={review.rating} size="sm" />
                        </div>
                        <span className="ml-auto text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-24">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Price per person</div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-primary-600">
                  {pkg.currency} {pkg.price?.toLocaleString()}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 flex items-center gap-1.5"><Clock className="w-4 h-4" />Duration</span>
                  <span className="font-semibold text-gray-800">{pkg.duration} Days</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" />Category</span>
                  <span className="font-semibold text-gray-800">{pkg.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" />Available Dates</span>
                  <span className="font-semibold text-gray-800">{pkg.availableDates?.length || 0} dates</span>
                </div>
              </div>

              <button
                onClick={() => user ? navigate(`/book/${pkg._id}`) : navigate('/login')}
                className="btn-primary w-full text-center text-base py-3"
              >
                {user ? 'Book Now' : 'Login to Book'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-3">Free cancellation within 24 hours of booking</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
