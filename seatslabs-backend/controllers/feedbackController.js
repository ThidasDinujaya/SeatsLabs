const pool = require('../config/database');

const feedbackController = {
    submitFeedback: async (req, res) => {
        try {
            const { bookingId, technicianId, serviceRating, technicianRating, feedbackComments } = req.body;
            const result = await pool.query(
                'INSERT INTO "Feedbacks" ("feedbackBookingId", "feedbackCustomerId", "feedbackTechnicianId", "feedbackServiceRating", "feedbackTechnicianRating", "feedbackComments") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [bookingId, req.user.customerId, technicianId, serviceRating, technicianRating, feedbackComments]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCustomerFeedback: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "Feedbacks" WHERE "feedbackCustomerId" = $1', [req.user.customerId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllFeedback: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "Feedbacks"');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getFeedbackByService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const result = await pool.query('SELECT f.* FROM "Feedbacks" f JOIN "Bookings" b ON f."feedbackBookingId" = b."bookingId" WHERE b."bookingServiceId" = $1', [serviceId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getFeedbackByTechnician: async (req, res) => {
        try {
            const { technicianId } = req.params;
            const result = await pool.query('SELECT * FROM "Feedbacks" WHERE "feedbackTechnicianId" = $1', [technicianId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    submitComplaint: async (req, res) => {
        try {
            const { bookingId, complaintType, feedbackDescription } = req.body;
            const result = await pool.query(
                'INSERT INTO "Complaints" ("complaintBookingId", "complaintCustomerId", "complaintType", "complaintDescription") VALUES ($1, $2, $3, $4) RETURNING *',
                [bookingId, req.user.customerId, complaintType, feedbackDescription]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllComplaints: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "Complaints"');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    resolveComplaint: async (req, res) => {
        try {
            const { complaintId } = req.params;
            const { complaintResolution } = req.body;
            await pool.query(
                "UPDATE \"Complaints\" SET \"complaintResolution\" = $1, \"complaintStatus\" = 'Resolved', \"complaintResolvedByUserId\" = $2, \"complaintResolvedAt\" = CURRENT_TIMESTAMP WHERE \"complaintId\" = $3",
                [complaintResolution, req.user.userId, complaintId]
            );
            res.json({ success: true, message: 'Complaint resolved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = feedbackController;
