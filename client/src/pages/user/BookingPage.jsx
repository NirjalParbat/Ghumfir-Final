import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packageAPI, bookingAPI, paymentAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  MapPin, Clock, Users, CreditCard, Wallet, DollarSign,
  CheckCircle, AlertCircle, ArrowRight, ShieldCheck,
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';

const STEPS = ['Trip Details', 'Payment', 'Confirmation'];

export default function BookingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    travelDate: '',
    numberOfPeople: 1,
    paymentMethod: 'cash',
    specialRequests: '',
    contactPhone: user?.phone || '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });

  useEffect(() => {
    packageAPI.getById(id)
      .then(({ data }) => setPkg(data.package))
      .catch(() => navigate('/packages'))
      .finally(() => setLoading(false));
  }, [id]);

  const totalPrice = pkg ? pkg.price * form.numberOfPeople : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'numberOfPeople' ? Number(value) : value }));
  };

  const handleBooking = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await bookingAPI.create({
        packageId: id,
        travelDate: form.travelDate,
        numberOfPeople: form.numberOfPeople,
        paymentMethod: form.paymentMethod,
        specialRequests: form.specialRequests,
        contactPhone: form.contactPhone,
      });
      setBooking(data.booking);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (form.paymentMethod === 'card') {
        await paymentAPI.simulateCard({ bookingId: booking._id, cardNumber: form.cardNumber });
      } else if (form.paymentMethod === 'khalti') {
        await paymentAPI.simulateCard({ bookingId: booking._id, cardNumber: '1234567890123456' });
      }
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!pkg) return null;

  const coverImage =
    pkg.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&q=80';

  const ErrorBanner = ({ msg }) => (
    <div className="flex items-center gap-2.5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl mb-5 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{msg}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg py-10">
      <div className="max-w-5xl mx-auto px-4">

     
        <div className="mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-text">
            Complete Your Booking
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            You're one step away from your next adventure.
          </p>
        </div>

     
        <div className="flex items-center mb-10">
          {STEPS.map((label, i) => {
            const current = i + 1;
            const done = current < step;
            const active = current === step;
            return (
              <div key={label} className="flex items-center flex-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 shrink-0 ${
                      done
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : active
                        ? 'border-primary-600 text-primary-600 bg-white shadow-sm'
                        : 'border-brand-border text-brand-muted bg-white'
                    }`}
                  >
                    {done ? <CheckCircle className="w-4.5 h-4.5" /> : current}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:block ${
                      active ? 'text-primary-600' : done ? 'text-brand-muted' : 'text-brand-muted'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                      done ? 'bg-primary-600' : 'bg-brand-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
          <div className="lg:col-span-2">

            {/* STEP 1: Trip Details */}
            {step === 1 && (
              <div className="surface p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-brand-text mb-6">Trip Details</h2>
                {error && <ErrorBanner msg={error} />}

                <div className="space-y-5">
                  <div className="form-group">
                    <label className="input-label">Travel Date <span className="text-accent-500">*</span></label>
                    <input
                      type="date"
                      name="travelDate"
                      value={form.travelDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Number of People <span className="text-accent-500">*</span></label>
                    <input
                      type="number"
                      name="numberOfPeople"
                      value={form.numberOfPeople}
                      onChange={handleChange}
                      min={1}
                      className="input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Contact Phone</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={form.contactPhone}
                      onChange={handleChange}
                      className="input"
                      placeholder="+977 9800000000"
                    />
                  </div>

                  {/* Payment Method selector */}
                  <div className="form-group">
                    <label className="input-label">Payment Method <span className="text-accent-500">*</span></label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'khalti', label: 'Khalti',  icon: Wallet,     color: 'text-purple-600' },
                        { value: 'card',   label: 'Card',    icon: CreditCard,  color: 'text-primary-600' },
                        { value: 'cash',   label: 'Cash',    icon: DollarSign,  color: 'text-emerald-600' },
                      ].map(({ value, label, icon: Icon, color }) => {
                        const selected = form.paymentMethod === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, paymentMethod: value }))}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                              selected
                                ? 'border-primary-500 bg-primary-50 shadow-sm'
                                : 'border-brand-border hover:border-primary-300 bg-white'
                            }`}
                          >
                            <Icon className={`w-5 h-5 ${selected ? 'text-primary-600' : color}`} />
                            <span className={`text-sm font-semibold ${selected ? 'text-primary-700' : 'text-brand-muted'}`}>
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="input-label">Special Requests</label>
                    <textarea
                      name="specialRequests"
                      value={form.specialRequests}
                      onChange={handleChange}
                      rows={3}
                      className="input resize-none"
                      placeholder="Dietary requirements, accessibility needs, etc."
                    />
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!form.travelDate || submitting}
                    className="btn-primary-navy w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : (
                      <span className="flex items-center justify-center gap-2">
                        Continue to Payment <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-brand-muted">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Secured & encrypted booking
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === 2 && (
              <div className="surface p-6 sm:p-8">
                <h2 className="font-display text-xl font-bold text-brand-text mb-6">Payment</h2>
                {error && <ErrorBanner msg={error} />}

                {form.paymentMethod === 'khalti' && (
                  <div className="p-6 bg-purple-50 border border-purple-200 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-purple-800 font-semibold text-lg mb-1">Pay with Khalti</p>
                    <p className="text-sm text-purple-600 mb-5">
                      Total: <strong>NPR {totalPrice.toLocaleString()}</strong>
                    </p>
                    <p className="text-xs text-purple-500 mb-6 max-w-xs mx-auto">
                      Khalti payment gateway launches here in production. Click below to simulate.
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={submitting}
                      className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Simulate Khalti Payment'}
                    </button>
                  </div>
                )}

                {form.paymentMethod === 'card' && (
                  <div className="space-y-5">
                    <div className="form-group">
                      <label className="input-label">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={form.cardNumber}
                        onChange={handleChange}
                        className="input font-mono tracking-widest"
                        placeholder="1234 5678 9012 3456"
                        maxLength={16}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="input-label">Expiry Date</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={form.cardExpiry}
                          onChange={handleChange}
                          className="input"
                          placeholder="MM / YY"
                        />
                      </div>
                      <div className="form-group">
                        <label className="input-label">CVV</label>
                        <input
                          type="text"
                          name="cardCvv"
                          value={form.cardCvv}
                          onChange={handleChange}
                          className="input"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <button
                      onClick={handlePayment}
                      disabled={submitting || form.cardNumber.length < 16}
                      className="btn-primary-navy w-full py-3.5 text-base disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : `Pay NPR ${totalPrice.toLocaleString()}`}
                    </button>
                  </div>
                )}

                {form.paymentMethod === 'cash' && (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-emerald-800 font-semibold text-lg mb-2">Cash on Arrival</p>
                    <p className="text-sm text-emerald-700 mb-6 max-w-xs mx-auto">
                      Pay <strong>NPR {totalPrice.toLocaleString()}</strong> in cash upon arrival. Your booking will be confirmed by our team.
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={submitting}
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                    >
                      {submitting ? 'Confirming...' : 'Confirm Cash Booking'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Confirmation */}
            {step === 3 && (
              <div className="surface p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="font-display text-2xl font-bold text-brand-text mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-brand-muted mb-8">
                  Your trip to <span className="font-semibold text-brand-text">{pkg.destination}</span> has been booked.
                </p>

                <div className="bg-brand-bg rounded-2xl p-5 text-left mb-8 space-y-3 text-sm border border-brand-border">
                  {[
                    ['Booking ID',   <span className="font-mono text-primary-700">{booking?._id?.slice(-8).toUpperCase()}</span>],
                    ['Travel Date',  new Date(form.travelDate).toLocaleDateString('en-US', { dateStyle: 'long' })],
                    ['Travelers',    `${form.numberOfPeople} ${form.numberOfPeople === 1 ? 'person' : 'people'}`],
                    ['Total',        <span className="font-bold text-primary-600">NPR {totalPrice.toLocaleString()}</span>],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-brand-muted">{label}</span>
                      <span className="font-medium text-brand-text">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => navigate('/bookings')}
                    className="btn-primary-navy flex-1 py-3"
                  >
                    View My Bookings
                  </button>
                  <button
                    onClick={() => navigate('/packages')}
                    className="btn-outline flex-1 py-3"
                  >
                    Explore More
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="surface overflow-hidden sticky top-24">
              <div className="relative h-44">
                <img src={coverImage} alt={pkg.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <p className="font-display font-bold text-sm leading-tight line-clamp-2">{pkg.title}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1.5 text-sm text-brand-muted mb-4">
                  <MapPin className="w-3.5 h-3.5 text-secondary-400" />
                  {pkg.destination}, {pkg.country}
                </div>
                <div className="flex items-center gap-4 text-sm text-brand-muted mb-5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {pkg.duration} days
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {form.numberOfPeople} {form.numberOfPeople === 1 ? 'person' : 'people'}
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-brand-muted">
                      NPR {pkg.price?.toLocaleString()} Ã— {form.numberOfPeople}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-brand-text">Total</span>
                    <span className="font-bold text-2xl text-primary-600">
                      NPR {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-brand-muted bg-emerald-50 rounded-lg p-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  Free cancellation within 24 hours
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
