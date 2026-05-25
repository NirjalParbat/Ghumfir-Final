import { useState } from "react";
import { khaltiAPI } from "../../api/index.js";

const KhaltiButton = ({
  bookingId,
  purchaseOrderName = "Ghumfir Booking",
  className = "",
  onError,
  onStart,
  onRedirect,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!bookingId) {
      const error = new Error("bookingId is required to start Khalti payment");
      if (onError) onError(error);
      console.error(error);
      return;
    }

    setLoading(true);
    if (onStart) onStart();
    try {
      const response = await khaltiAPI.initiate({
        bookingId,
        purchase_order_name: purchaseOrderName,
      });

      if (response.data?.payment_url) {
        if (onRedirect) onRedirect();
        window.location.href = response.data.payment_url;
        return;
      }

      throw new Error("Khalti payment URL missing");
    } catch (error) {
      if (onError) onError(error);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={disabled || loading || !bookingId} className={className}>
      {loading ? "Processing..." : "Pay with Khalti"}
    </button>
  );
};

export default KhaltiButton;