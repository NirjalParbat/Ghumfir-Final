import Booking from '../models/Booking.model.js';
import Package from '../models/Package.model.js';
import User from '../models/User.model.js';
import { sendEmail, bookingConfirmationEmail } from '../utils/sendEmail.js';

// @desc    Create booking
// @route   POST /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { packageId, travelDate, numberOfPeople, paymentMethod, specialRequests, contactPhone } = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });

    const totalPrice = pkg.price * numberOfPeople;

    const booking = await Booking.create({
      user: req.user._id,
      package: packageId,
      travelDate,
      numberOfPeople,
      totalPrice,
      paymentMethod,
      specialRequests,
      contactPhone,
    });

    const user = await User.findById(req.user._id).select('name email');
    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: `Booking Confirmed - ${pkg.title}`,
          html: bookingConfirmationEmail(user, booking, pkg),
        });
      } catch (emailError) {
        console.error('booking email error:', emailError);
      }
    }

    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking.' });
  }
};

// @desc    Get my bookings
// @route   GET /api/bookings/my
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('package', 'title destination images price duration category')
      .sort('-createdAt');
    res.json({ success: true, bookings });
  } catch (error) {
    console.error('getMyBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('package')
      .populate('user', 'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Only owner or admin can view
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error('getBookingById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled', booking });
  } catch (error) {
    console.error('cancelBooking error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
};

// @desc    Get all bookings (admin)
// @route   GET /api/bookings/admin/all
export const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = Number(page);
    const pageLimit = Number(limit);
    const query = status ? { bookingStatus: status } : {};

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('package', 'title destination price')
      .sort('-createdAt')
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    res.json({ success: true, total, bookings });
  } catch (error) {
    console.error('getAllBookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

// @desc    Update booking status (admin)
// @route   PUT /api/bookings/:id/status
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingStatus, paymentStatus } = req.body;
    const updates = {};
    if (bookingStatus !== undefined) updates.bookingStatus = bookingStatus;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('user', 'name email').populate('package', 'title');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking status updated', booking });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status.' });
  }
};

// @desc    Get booking stats (admin)
// @route   GET /api/bookings/admin/stats
export const getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const pendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });

    const revenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: { totalBookings, confirmedBookings, pendingBookings, cancelledBookings, totalRevenue },
    });
  } catch (error) {
    console.error('getBookingStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking stats.' });
  }
};
