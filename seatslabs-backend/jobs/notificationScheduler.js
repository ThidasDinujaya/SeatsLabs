const cron = require('node-cron');
const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');

// Run every hour
cron.schedule('0 * * * *', async () => {
    console.log('Running notification scheduler...');

    try {
        // Get bookings that need 24-hour reminders
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];

        const bookings = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_reference,
        b.scheduled_date_time,
        s.service_name,
        u.user_email,
        u.user_phone_number,
        u.user_first_name,
        CONCAT(vb.vehicle_brand_name, ' ', vm.vehicle_model_name) as vehicle
      FROM bookings b
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      JOIN services s ON b.service_id = s.service_id
      JOIN vehicles v ON b.vehicle_id = v.vehicle_id
      JOIN vehicle_brands vb ON v.vehicle_brand_id = vb.vehicle_brand_id
      JOIN vehicle_models vm ON v.vehicle_model_id = vm.vehicle_model_id
      WHERE DATE(b.scheduled_date_time) = $1
        AND b.booking_status = 'Approved'
        AND NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE booking_id = b.booking_id
          AND notification_type = '24_hour_reminder'
        )
    `, [tomorrowDate]);

        for (const booking of bookings.rows) {
            // Send email reminder
            await sendEmail(
                booking.user_email,
                'Reminder: Your Service Appointment Tomorrow',
                `
          <h2>Booking Reminder</h2>
          <p>Dear ${booking.user_first_name},</p>
          <p>This is a reminder that your service appointment is tomorrow:</p>
          <ul>
            <li><strong>Reference:</strong> ${booking.booking_reference}</li>
            <li><strong>Service:</strong> ${booking.service_name}</li>
            <li><strong>Time:</strong> ${new Date(booking.scheduled_date_time).toLocaleString()}</li>
            <li><strong>Vehicle:</strong> ${booking.vehicle}</li>
          </ul>
          <p>Please arrive 10 minutes before your scheduled time.</p>
        `
            );

            // Send SMS reminder
            await sendSMS(
                booking.user_phone_number,
                `Reminder: Your SeatsLabs appointment ${booking.booking_reference} is tomorrow at ${new Date(booking.scheduled_date_time).toLocaleTimeString()}. See you soon!`
            );

            // Log notification
            await pool.query(`
        INSERT INTO notifications
        (user_id, booking_id, notification_type, notification_title, notification_message, delivery_status, sent_time)
        VALUES (
          (SELECT user_id FROM customers WHERE customer_id = $1),
          $2,
          '24_hour_reminder',
          'Appointment Reminder',
          'Your service appointment is tomorrow',
          'Sent',
          CURRENT_TIMESTAMP
        )
      `, [booking.customer_id, booking.booking_id]);
        }

        console.log(`Sent ${bookings.rows.length} 24-hour reminders`);
    } catch (error) {
        console.error('Error in notification scheduler:', error);
    }
});

console.log('Notification scheduler started');

module.exports = {};