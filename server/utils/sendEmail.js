import nodemailer from 'nodemailer';

/**
 * Creates a nodemailer transporter configured with SMTP settings from environment variables
 * Supports TLS (port 587) and SSL (port 465) based on port configuration
 * @returns {object} Nodemailer transporter instance
 */
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Sends an email using nodemailer
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Email body in HTML format
 * Requirements: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS must be set in .env
 */
export const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Ghumfir'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const bookingConfirmationEmail = (user, booking, pkg) => {
  const travelDate = new Date(booking.travelDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const totalPeople = booking.numberOfPeople;

  return `
    <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
        <div style="background:#0f766e;color:#fff;padding:28px 32px;">
          <h1 style="margin:0;font-size:28px;">Booking Confirmed</h1>
          <p style="margin:8px 0 0;font-size:16px;opacity:0.92;">Hi ${user.name}, your tour booking is ready.</p>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 18px;font-size:15px;color:#374151;">Thanks for booking with Ghumfir. Here are your booking details:</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#111827;">
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Package</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">${pkg.title}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Destination</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">${pkg.destination}, ${pkg.country}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Travel Date</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">${travelDate}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">People</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">${totalPeople}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Total Price</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">NPR ${booking.totalPrice.toLocaleString()}</td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">We will contact you if we need anything else. You can also log in to view this booking anytime.</p>
        </div>
      </div>
    </div>
  `;
};

export default sendEmail;