import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { paymentAPI } from "../../api/index.js";
import jsPDF from "jspdf";

const PaymentSuccess = () => {

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [receipt, setReceipt] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {

    const pidx = searchParams.get("pidx");
    const bookingId = searchParams.get("bookingId");

    if (!pidx || !bookingId) {
      setStatus("error");
      setMessage("Missing payment details. Please contact support.");
      return;
    }

    paymentAPI
      .verifyKhalti({ pidx, bookingId })
      .then(({ data }) => {
        setStatus("success");
        setMessage("Payment verified. Your booking is confirmed.");
        setReceipt({
          bookingId: data?.booking?._id || bookingId,
          amount: data?.booking?.totalPrice,
          transactionId: data?.booking?.khaltiTransactionId,
          pidx,
          packageTitle: data?.booking?.package?.title,
        });
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error.response?.data?.message || "Payment verification failed.");
      });

  }, [searchParams]);

  const handleCopy = async (value, field) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch {
      setCopiedField("");
    }
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;
    const doc = new jsPDF();
    const shortId = receipt.bookingId?.slice(-8).toUpperCase() || "PAYMENT";

    doc.setFontSize(16);
    doc.text("Payment Receipt", 14, 20);
    doc.setFontSize(11);
    doc.text(`Booking ID: ${receipt.bookingId || "-"}`, 14, 32);
    doc.text(`Package: ${receipt.packageTitle || "-"}`, 14, 40);
    doc.text(`Amount: NPR ${Number(receipt.amount || 0).toLocaleString()}`, 14, 48);
    doc.text(`Transaction ID: ${receipt.transactionId || "-"}`, 14, 56);
    doc.text(`PIDX: ${receipt.pidx || "-"}`, 14, 64);

    doc.save(`ghumfir-receipt-${shortId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Status</h1>
        <p className={status === "error" ? "text-red-600" : "text-gray-600"}>{message}</p>

        {status === "success" && receipt && (
          <div className="mt-6 text-left bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Booking ID</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{receipt.bookingId?.slice(-8).toUpperCase()}</span>
                <button
                  onClick={() => handleCopy(receipt.bookingId, "booking")}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  {copiedField === "booking" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            {receipt.packageTitle && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-500">Package</span>
                <span className="font-medium text-gray-900">{receipt.packageTitle}</span>
              </div>
            )}
            {receipt.amount !== undefined && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-900">NPR {Number(receipt.amount).toLocaleString()}</span>
              </div>
            )}
            {receipt.transactionId && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-500">Transaction ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{receipt.transactionId}</span>
                  <button
                    onClick={() => handleCopy(receipt.transactionId, "transaction")}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    {copiedField === "transaction" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-500">PIDX</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{receipt.pidx}</span>
                <button
                  onClick={() => handleCopy(receipt.pidx, "pidx")}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  {copiedField === "pidx" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={handleDownloadReceipt}
              className="btn-outline w-full py-2 mt-4"
            >
              Download Receipt
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => navigate("/bookings")}
            className="btn-primary-navy w-full py-3"
            disabled={status === "verifying"}
          >
            View My Bookings
          </button>
          <button
            onClick={() => navigate("/packages")}
            className="btn-outline w-full py-3"
          >
            Explore More
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;