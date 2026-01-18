const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const emailService = {
    sendEmail: async (to, subject, htmlContent) => {
        try {
            if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_email') || !process.env.SMTP_PASS || process.env.SMTP_PASS.includes('your_app_password')) {
                console.log('📧 Email Simulation (no valid credentials):', { to, subject });
                return { success: true, simulated: true };
            }

            const mailOptions = {
                from: `"SeatsLabs Auto M" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: htmlContent
            };

            await transporter.sendMail(mailOptions);
            return { success: true };
        } catch (error) {
            console.error('Email sending failed:', error);
            // Don't throw error in dev mode if it's just credential issue
            if (process.env.NODE_ENV === 'development') {
                return { success: false, error: error.message, simulated: true };
            }
            throw error;
        }
    },

    sendBookingConfirmation: async (userEmail, bookingDetails) => {
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f4f4f4; }
          .details { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #3498db; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 SeatsLabs - Booking Confirmation</h1>
          </div>
          <div class="content">
            <h2>Dear ${bookingDetails.customerName},</h2>
            <p>Your booking has been confirmed! Here are the details:</p>
            
            <div class="details">
              <p><strong>Booking Reference:</strong> ${bookingDetails.bookingReference}</p>
              <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
              <p><strong>Date & Time:</strong> ${bookingDetails.scheduledDateTime}</p>
              <p><strong>Vehicle:</strong> ${bookingDetails.vehicle}</p>
              <p><strong>Estimated Price:</strong> Rs. ${bookingDetails.estimatedPrice}</p>
            </div>

            <h3>Important Reminders:</h3>
            <ul>
              <li>Please arrive 10 minutes before your scheduled time</li>
              <li>Bring your vehicle registration documents</li>
              <li>You will receive a reminder 24 hours before your appointment</li>
            </ul>

            <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
          </div>
          <div class="footer">
            <p><strong>Auto M Pvt Ltd</strong><br>
            Colombo, Sri Lanka<br>
            Phone: +94 77 123 4567 | Email: info@autom.lk</p>
          </div>
        </div>
      </body>
      </html>
    `;

        return await emailService.sendEmail(
            userEmail,
            'Booking Confirmation - SeatsLabs',
            htmlContent
        );
    },

    sendBookingReminder: async (userEmail, bookingDetails) => {
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .reminder { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>🔔 Booking Reminder</h2>
          <div class="reminder">
            <p><strong>Your service appointment is tomorrow!</strong></p>
            <p><strong>Reference:</strong> ${bookingDetails.bookingReference}</p>
            <p><strong>Time:</strong> ${bookingDetails.scheduledDateTime}</p>
            <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
          </div>
          <p>We look forward to seeing you!</p>
        </div>
      </body>
      </html>
    `;

        return await emailService.sendEmail(
            userEmail,
            'Reminder: Your Appointment Tomorrow - SeatsLabs',
            htmlContent
        );
    }
};

module.exports = emailService;