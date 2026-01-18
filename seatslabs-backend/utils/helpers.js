const crypto = require('crypto');

const helpers = {
  // Generate unique booking reference
  generateBookingReference: () => {
    const prefix = 'BK';
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}${random}`;
  },

  // Calculate time slot end time
  calculateEndTime: (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  },

  // Format currency
  formatCurrency: (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  },

  // Validate time slot availability
  validateTimeSlot: async (pool, slotDate, startTime, endTime, excludeBookingId = null) => {
    let query = `
      SELECT COUNT(*) as overlapping_bookings
      FROM bookings b
      JOIN time_slots ts ON b.time_slot_id = ts.time_slot_id
      WHERE ts.slot_date = $1
        AND (
          (ts.start_time < $3 AND ts.end_time > $2) OR
          (ts.start_time >= $2 AND ts.start_time < $3)
        )
        AND b.booking_status NOT IN ('Cancelled', 'Rejected')
    `;

    const params = [slotDate, startTime, endTime];

    if (excludeBookingId) {
      query += ' AND b.booking_id != $4';
      params.push(excludeBookingId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].overlapping_bookings) === 0;
  },

  // Calculate service price with any discounts
  calculateServicePrice: (basePrice, discountPercent = 0) => {
    const discount = (basePrice * discountPercent) / 100;
    return basePrice - discount;
  },

  // Generate password reset token
  generateResetToken: () => {
    return crypto.randomBytes(32).toString('hex');
  },

  // Hash password reset token
  hashToken: (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
};

module.exports = helpers;