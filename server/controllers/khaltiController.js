import axios from "axios";
import Booking from "../models/Booking.model.js";

export const initializeKhaltiPayment = async (req, res) => {
  try {
    const { purchase_order_name, bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId).populate(
      "package",
      "title",
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.user.toString() !== req.user?._id?.toString() &&
      req.user?.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized for this booking" });
    }

    if (booking.paymentMethod !== "khalti") {
      return res
        .status(400)
        .json({ message: "Booking is not set to Khalti payment" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Booking is already paid" });
    }

    const clientUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    let clientOrigin;
    try {
      clientOrigin = new URL(clientUrl).origin;
    } catch {
      return res.status(500).json({ message: "CLIENT_URL is not a valid URL" });
    }

    if (
      !process.env.KHALTI_SECRET_KEY ||
      process.env.KHALTI_SECRET_KEY === "your_khalti_secret_key"
    ) {
      return res
        .status(500)
        .json({ message: "KHALTI_SECRET_KEY is not configured on the server" });
    }

    const returnUrl = `${clientUrl}/payment-success?bookingId=${encodeURIComponent(bookingId)}`;
    const amountPaisa = Math.round(Number(booking.totalPrice || 0) * 100);
    const orderName =
      purchase_order_name || booking.package?.title || "Ghumfir Booking";

    if (!Number.isInteger(amountPaisa) || amountPaisa <= 0) {
      return res
        .status(400)
        .json({ message: "Booking amount must be greater than zero" });
    }

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      {
        return_url: returnUrl,
        website_url: clientOrigin,
        amount: amountPaisa, // paisa
        purchase_order_id: bookingId,
        purchase_order_name: orderName,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(error.response?.status || 502).json({
      message:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Khalti payment initialization failed",
    });
  }
};

export const verifyKhaltiPayment = async (req, res) => {
  try {
    const { pidx } = req.body;

    const response = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      {
        pidx,
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Verification failed",
    });
  }
};
