const pool = require('../config/database');

const analyticsController = {
    // Dashboard Statistics
    getDashboardStats: async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Today's statistics
            const todayStats = await pool.query(`
        SELECT 
          COUNT(*) as total_Bookings,
          COUNT(CASE WHEN "bookingStatus" = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN bookingStatus = 'Pending' THEN 1 END) as pending,
          COUNT(CASE WHEN bookingStatus = 'In Progress' THEN 1 END) as in_progress,
          COALESCE(SUM(CASE WHEN bookingStatus = 'Completed' THEN "bookingEstimatedPrice" ELSE 0 END), 0) as revenue
        FROM "Bookings"
        WHERE DATE("bookingScheduledDateTime") = $1
      `, [today]);

            // This month's statistics
            const monthStats = await pool.query(`
        SELECT 
          COUNT(*) as total_Bookings,
          COUNT(CASE WHEN "bookingStatus" = 'Completed' THEN 1 END) as completed,
          COALESCE(SUM(CASE WHEN "bookingStatus" = 'Completed' THEN "bookingEstimatedPrice" ELSE 0 END), 0) as service_revenue
        FROM "Bookings"
        WHERE EXTRACT(MONTH FROM "bookingScheduledDateTime") = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM "bookingScheduledDateTime") = EXTRACT(YEAR FROM CURRENT_DATE)
      `);

            // Ad revenue this month
            const adRevenue = await pool.query(`
        SELECT COALESCE(SUM("adPaymentAmount"), 0) as ad_revenue
        FROM "AdPayments"
        WHERE EXTRACT(MONTH FROM "adPaymentDateTime") = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM "adPaymentDateTime") = EXTRACT(YEAR FROM CURRENT_DATE)
          AND "adPaymentStatus" = 'Completed'
      `);

            // Active Technicians
            const Technicians = await pool.query(`
        SELECT COUNT(*) as active_Technicians
        FROM "Technicians"
        WHERE "technicianIsAvailable" = true
      `);

            // Customer satisfaction
            const satisfaction = await pool.query(`
        SELECT AVG("feedbackServiceRating") as avg_rating
        FROM "Feedbacks"
        WHERE EXTRACT(MONTH FROM "feedbackSubmittedAt") = EXTRACT(MONTH FROM CURRENT_DATE)
      `);

            res.json({
                success: true,
                data: {
                    today: {
                        Bookings: parseInt(todayStats.rows[0].total_Bookings),
                        completed: parseInt(todayStats.rows[0].completed),
                        pending: parseInt(todayStats.rows[0].pending),
                        inProgress: parseInt(todayStats.rows[0].in_progress),
                        revenue: parseFloat(todayStats.rows[0].revenue)
                    },
                    thisMonth: {
                        Bookings: parseInt(monthStats.rows[0].total_Bookings),
                        completed: parseInt(monthStats.rows[0].completed),
                        serviceRevenue: parseFloat(monthStats.rows[0].service_revenue),
                        adRevenue: parseFloat(adRevenue.rows[0].ad_revenue),
                        totalRevenue: parseFloat(monthStats.rows[0].service_revenue) +
                            parseFloat(adRevenue.rows[0].ad_revenue)
                    },
                    resources: {
                        activeTechnicians: parseInt(Technicians.rows[0].active_Technicians)
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
          DATE("bookingScheduledDateTime") as date,
          COUNT(*) as total_Bookings,
          COUNT(CASE WHEN "bookingStatus" = 'Completed' THEN 1 END) as completed,
          COUNT(CASE WHEN "bookingStatus" = 'Cancelled' THEN 1 END) as cancelled
        FROM "Bookings"
        WHERE "bookingScheduledDateTime" >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE("bookingScheduledDateTime")
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
          s."serviceName",
          COUNT(b."bookingId") as booking_count,
          AVG(f."feedbackServiceRating") as avg_rating,
          SUM(b."bookingEstimatedPrice") as total_revenue
        FROM "Services" s
        LEFT JOIN "Bookings" b ON s."serviceId" = b."serviceId"
        LEFT JOIN "Feedbacks" f ON b."bookingId" = f."bookingId"
        WHERE b."bookingStatus" = 'Completed'
        GROUP BY s."serviceId", s."serviceName"
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
          EXTRACT(HOUR FROM ts."timeSlotStartTime") as hour,
          COUNT(b."bookingId") as booking_count
        FROM "TimeSlots" ts
        LEFT JOIN "Bookings" b ON ts."timeSlotId" = b."timeSlotId"
        WHERE b."bookingScheduledDateTime" >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY EXTRACT(HOUR FROM ts."timeSlotStartTime")
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