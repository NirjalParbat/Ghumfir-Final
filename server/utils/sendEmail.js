import nodemailer from 'nodemailer';
import axios from 'axios';

const createTransporter = (port) => {
  const normalizedPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: normalizedPass,
    },
  });
};

export const sendEmail = async ({ to, subject, html }) => {
  const resendKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || process.env.EMAIL_USER || 'onboarding@resend.dev';

  const sendViaResend = async () => {
    await axios.post(
      'https://api.resend.com/emails',
      {
        from: resendFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
  };

  // Prefer HTTPS-based provider on hosted platforms; SMTP remains fallback.
  if (resendKey) {
    try {
      await sendViaResend();
      return;
    } catch (resendErr) {
      const resendReason = resendErr?.response?.data || resendErr?.message || resendErr;
      console.error('Resend failed, falling back to SMTP:', resendReason);
    }
  }

  const preferredPort = Number(process.env.EMAIL_PORT) || 587;
  const fallbackPort = preferredPort === 587 ? 465 : 587;

  const send = async (port) => {
    const transporter = createTransporter(port);
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Ghumfir Travel'}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  };

  try {
    await send(preferredPort);
  } catch (err) {
    const msg = String(err?.message || '').toLowerCase();
    const isTimeout = msg.includes('timeout') || err?.code === 'ETIMEDOUT';
    if (!isTimeout) throw err;

    try {
      await send(fallbackPort);
      return;
    } catch (fallbackErr) {
      const fallbackMsg = String(fallbackErr?.message || '').toLowerCase();
      const fallbackTimedOut = fallbackMsg.includes('timeout') || fallbackErr?.code === 'ETIMEDOUT';
      if (!fallbackTimedOut) throw fallbackErr;
    }

    // Final HTTPS fallback if SMTP timed out on both ports.
    if (!resendKey) {
      throw new Error('SMTP timed out on both ports and RESEND_API_KEY is not configured');
    }

    await sendViaResend();
  }
};

export const bookingConfirmationEmail = (user, booking, pkg) => {
  const travelDate = new Date(booking.travelDate).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const bookedOn = new Date(booking.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const coverImage = pkg.images?.[0]?.url || 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?w=800&q=80';
  const logoUrl = process.env.MAIL_LOGO_URL || 'https://res.cloudinary.com/dxj6vfy7z/image/upload/v1773559163/logo_eozqdi.png';

  const statusBadge = {
    pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending Confirmation' },
    confirmed: { color: '#16a34a', bg: '#dcfce7', label: 'Confirmed' },
    cancelled: { color: '#dc2626', bg: '#fee2e2', label: 'Cancelled' },
    completed: { color: '#2563eb', bg: '#dbeafe', label: 'Completed' },
  }[booking.bookingStatus] || { color: '#6b7280', bg: '#f3f4f6', label: booking.bookingStatus };

  const paymentLabel = {
    cash: 'Cash on Arrival',
    card: 'Credit / Debit Card',
    khalti: 'Khalti Digital Wallet',
  }[booking.paymentMethod] || booking.paymentMethod;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation – Ghumfir</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:40px 40px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:20px;">
              <div style="width:100px;height:100px;display:inline-flex;align-items:center;justify-content:center;font-size:22px;line-height:44px;text-align:center;"><img src="${logoUrl}" alt="Ghumfir Logo" style="width:100%;height:100%;object-fit:cover;" /></div>
             
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
              <tr>
                <td width="100" height="100" align="center" valign="middle" style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:50%;font-size:34px;line-height:1;text-align:center;">✅</td>
              </tr>
            </table>
            <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0 0 8px;">Booking Received!</h1>
            <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Thank you, ${user.name}. Your adventure is being prepared.</p>
          </td>
        </tr>

        <!-- Status Banner -->
        <tr>
          <td style="padding:0 40px;">
            <div style="background:${statusBadge.bg};border-left:4px solid ${statusBadge.color};border-radius:8px;padding:14px 18px;margin-top:28px;display:flex;align-items:center;gap:10px;">
              <span style="font-size:20px;">📋</span>
              <div>
                <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Booking Status</div>
                <div style="font-size:16px;font-weight:700;color:${statusBadge.color};">${statusBadge.label}</div>
              </div>
              <div style="margin-left:auto;font-size:12px;color:#6b7280;">
                ID: <span style="font-family:monospace;font-weight:600;color:#374151;">${booking._id.toString().slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </td>
        </tr>

        <!-- Package Image -->
        <tr>
          <td style="padding:24px 40px 0;">
            <div style="border-radius:12px;overflow:hidden;position:relative;">
              <img src="${coverImage}" alt="${pkg.title}" width="100%" style="display:block;height:200px;object-fit:cover;border-radius:12px;" />
              <div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);padding:16px;border-radius:0 0 12px 12px;">
                <span style="background:#16a34a;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">${pkg.category}</span>
                <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:6px;">${pkg.title}</div>
                <div style="color:rgba(255,255,255,0.85);font-size:13px;">📍 ${pkg.destination}, ${pkg.country}</div>
              </div>
            </div>
          </td>
        </tr>

        <!-- Booking Details Grid -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #f3f4f6;">Trip Details</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                  <div style="background:#f9fafb;border-radius:10px;padding:14px;">
                    <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;margin-bottom:4px;">✈️ Travel Date</div>
                    <div style="font-size:14px;font-weight:700;color:#111827;">${travelDate}</div>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                  <div style="background:#f9fafb;border-radius:10px;padding:14px;">
                    <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;margin-bottom:4px;">👥 Travelers</div>
                    <div style="font-size:14px;font-weight:700;color:#111827;">${booking.numberOfPeople} ${booking.numberOfPeople === 1 ? 'Person' : 'People'}</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
                  <div style="background:#f9fafb;border-radius:10px;padding:14px;">
                    <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;margin-bottom:4px;">⏱️ Duration</div>
                    <div style="font-size:14px;font-weight:700;color:#111827;">${pkg.duration} Days</div>
                  </div>
                </td>
                <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
                  <div style="background:#f9fafb;border-radius:10px;padding:14px;">
                    <div style="font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;margin-bottom:4px;">💳 Payment</div>
                    <div style="font-size:14px;font-weight:700;color:#111827;">${paymentLabel}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Price Summary -->
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;border-radius:12px;padding:20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:14px;color:#374151;">Price per person</td>
                  <td align="right" style="font-size:14px;color:#374151;">NPR ${(pkg.price).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#374151;padding-top:8px;">Travelers × ${booking.numberOfPeople}</td>
                  <td align="right" style="font-size:14px;color:#374151;padding-top:8px;">${booking.numberOfPeople}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:12px 0 12px;"><hr style="border:none;border-top:1px dashed #86efac;" /></td>
                </tr>
                <tr>
                  <td style="font-size:18px;font-weight:700;color:#15803d;">Total Amount</td>
                  <td align="right" style="font-size:22px;font-weight:800;color:#15803d;">NPR ${booking.totalPrice.toLocaleString()}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        ${booking.specialRequests ? `
        <!-- Special Requests -->
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
              <div style="font-size:12px;color:#92400e;font-weight:600;text-transform:uppercase;margin-bottom:4px;">📝 Special Requests</div>
              <div style="font-size:14px;color:#374151;">${booking.specialRequests}</div>
            </div>
          </td>
        </tr>` : ''}

        <!-- What's Next -->
        <tr>
          <td style="padding:0 40px 32px;">
            <h2 style="font-size:16px;font-weight:700;color:#111827;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #f3f4f6;">What Happens Next?</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:top;width:32px;padding-right:12px;padding-bottom:16px;">
                  <div style="width:32px;height:32px;background:#dcfce7;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">1️⃣</div>
                </td>
                <td style="vertical-align:top;padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:600;color:#111827;">Our team reviews your booking</div>
                  <div style="font-size:13px;color:#6b7280;margin-top:2px;">We'll confirm your slot within 24 hours.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;width:32px;padding-right:12px;padding-bottom:16px;">
                  <div style="width:32px;height:32px;background:#dcfce7;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">2️⃣</div>
                </td>
                <td style="vertical-align:top;padding-bottom:16px;">
                  <div style="font-size:14px;font-weight:600;color:#111827;">Confirmation email sent</div>
                  <div style="font-size:13px;color:#6b7280;margin-top:2px;">You'll receive a final confirmation with full trip details.</div>
                </td>
              </tr>
              <tr>
                <td style="vertical-align:top;width:32px;padding-right:12px;">
                  <div style="width:32px;height:32px;background:#dcfce7;border-radius:50%;text-align:center;line-height:32px;font-size:16px;">3️⃣</div>
                </td>
                <td style="vertical-align:top;">
                  <div style="font-size:14px;font-weight:600;color:#111827;">Pack your bags!</div>
                  <div style="font-size:13px;color:#6b7280;margin-top:2px;">Get ready for an unforgettable journey with Ghumfir.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${process.env.CLIENT_URL}/bookings" style="display:inline-block;background:#15803d;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:10px;">View My Bookings →</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">Questions? Email us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#15803d;text-decoration:none;">${process.env.EMAIL_USER}</a></p>
            <p style="margin:0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Ghumfir Travel. Bharatpur, Chitwan, Nepal.</p>
            <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">Booked on ${bookedOn}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

export default sendEmail;
