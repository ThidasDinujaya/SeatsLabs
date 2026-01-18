const pool = require('../config/database');

const analyticsController = {
    // Dashboard Statistics
    getDashboardStats: async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Today's statistics
            const todayStats = await pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN booking_status = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN booking_status = 'Pending' THEN 1 END) as pending,
          COUNT(CASE WHEN booking_status = 'In Progress' THEN 1 END) as in_progress,
          COALESCE(SUM(CASE WHEN booking_status = 'Completed' THEN estimated_price ELSE 0 END), 0) as revenue
        FROM bookings
        WHERE DATE(scheduled_date_time) = $1
      `, [today]);

            // This month's statistics
            const monthStats = await pool.query(`
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN booking_status = 'Completed' THEN 1 END) as completed,
          COALESCE(SUM(CASE WHEN booking_status = 'Completed' THEN estimated_price ELSE 0 END), 0) as service_revenue
        FROM bookings
        WHERE EXTRACT(MONTH FROM scheduled_date_time) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM scheduled_date_time) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);

            // Ad revenue this month
            const adRevenue = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as ad_revenue
        FROM ad_payments
        WHERE EXTRACT(MONTH FROM payment_date_time) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM payment_date_time) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND payment_status = 'Completed'
      `);

            // Active technicians
            const technicians = await pool.query(`
        SELECT COUNT(*) as active_technicians
        FROM technicians
        WHERE is_available = true
      `);

            // Customer satisfaction
            const satisfaction = await pool.query(`
        SELECT AVG(service_rating) as avg_rating
        FROM feedbacks
        WHERE EXTRACT(MONTH FROM submitted_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      `);

            res.json({
                success: true,
                data: {
                    today: {
                        bookings: parseInt(todayStats.rows[0].total_bookings),
                        completed: parseInt(todayStats.rows[0].completed),
                        pending: parseInt(todayStats.rows[0].pending),
                        inProgress: parseInt(todayStats.rows[0].in_progress),
                        revenue: parseFloat(todayStats.rows[0].revenue)
                    },
                    thisMonth: {
                        bookings: parseInt(monthStats.rows[0].total_bookings),
                        completed: parseInt(monthStats.rows[0].completed),
                        serviceRevenue: parseFloat(monthStats.rows[0].service_revenue),
                        adRevenue: parseFloat(adRevenue.rows[0].ad_revenue),
                        totalRevenue: parseFloat(monthStats.rows[0].service_revenue) +
                            parseFloat(adRevenue.rows[0].ad_revenue)
                    },
                    resources: {
                        activeTechnicians: parseInt(technicians.rows[0].active_technicians)
                    },
                    satisfaction: {
                        avgRating: parseFloat(satisfaction.rows[0].avg_rating || 0).toFixed(2)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Booking Trends (Last 30 days)
    getBookingTrends: async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT 
          DATE(scheduled_date_time) as date,
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN booking_status = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN booking_status = 'Cancelled' THEN 1 END) as cancelled
        FROM bookings
        WHERE scheduled_date_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(scheduled_date_time)
        ORDER BY date
      `);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Service Popularity
    getServicePopularity: async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT 
          s.service_name,
          COUNT(b.booking_id) as booking_count,
          AVG(f.service_rating) as avg_rating,
          SUM(b.estimated_price) as total_revenue
        FROM services s
        LEFT JOIN bookings b ON s.service_id = b.service_id
        LEFT JOIN feedbacks f ON b.booking_id = f.booking_id
        WHERE b.booking_status = 'Completed'
        GROUP BY s.service_id, s.service_name
        ORDER BY booking_count DESC
      `);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Peak Hours Analysis
    getPeakHours: async (req, res) => {
        try {
            const result = await pool.query(`
        SELECT 
          EXTRACT(HOUR FROM ts.start_time) as hour,
          COUNT(b.booking_id) as booking_count
        FROM time_slots ts
        LEFT JOIN bookings b ON ts.time_slot_id = b.time_slot_id
        WHERE b.scheduled_date_time >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM ts.start_time)
        ORDER BY hour
      `);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRevenueAnalysis: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getCustomerRetention: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getTechnicianUtilization: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getAdvertisementROI: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    }
};

module.exports = analyticsController;