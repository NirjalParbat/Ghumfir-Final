import Booking from '../models/Booking.model.js';
import axios from 'axios';

// @desc    Verify Khalti payment
// @route   POST /api/payments/khalti/verify
export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Verify with Khalti ePayment lookup
    const response = await axios.post(
      'https://a.khalti.com/api/v2/epayment/lookup/',
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const status = response.data?.status;
    const totalAmount = Number(response.data?.total_amount || 0);
    const expectedAmount = Number(booking.totalPrice) * 100;

    if (status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Payment is not completed' });
    }

    if (totalAmount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount does not match booking total' });
    }

    if (response.data?.pidx || response.data?.transaction_id) {
      const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          paymentStatus: 'paid',
          bookingStatus: 'confirmed',
          khaltiTransactionId: response.data.transaction_id || response.data.pidx,
        },
        { new: true }
      );
      if (updatedBooking) {
        await updatedBooking.populate('package', 'title');
      }
      return res.json({ success: true, message: 'Payment verified', booking: updatedBooking });
    }

    res.status(400).json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    console.error('verifyKhaltiPayment error:', error?.response?.data || error?.message || error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

// @desc    Simulate card payment
// @route   POST /api/payments/card/simulate
export const simulateCardPayment = async (req, res) => {
  try {
    const { bookingId, cardNumber } = req.body;

    // Simulate payment processing (in real app, use Stripe etc.)
    if (!cardNumber || cardNumber.length < 16) {
      return res.status(400).json({ success: false, message: 'Invalid card details' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: 'paid', bookingStatus: 'confirmed' },
      { new: true }
    );

    res.json({ success: true, message: 'Card payment successful', booking: updatedBooking });
  } catch (error) {
    console.error('simulateCardPayment error:', error);
    res.status(500).json({ success: false, message: 'Card payment failed.' });
  }
};
