const pool = require('../config/database');

const feedbackController = {
    submitFeedback: async (req, res) => {
        try {
            const { bookingId, technicianId, serviceRating, technicianRating, comments } = req.body;
            const result = await pool.query(
                'INSERT INTO feedbacks (booking_id, customer_id, technician_id, service_rating, technician_rating, comments) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [bookingId, req.user.customer_id, technicianId, serviceRating, technicianRating, comments]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCustomerFeedback: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM feedbacks WHERE customer_id = $1', [req.user.customer_id]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllFeedback: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM feedbacks');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getFeedbackByService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const result = await pool.query('SELECT f.* FROM feedbacks f JOIN bookings b ON f.booking_id = b.booking_id WHERE b.service_id = $1', [serviceId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getFeedbackByTechnician: async (req, res) => {
        try {
            const { technicianId } = req.params;
            const result = await pool.query('SELECT * FROM feedbacks WHERE technician_id = $1', [technicianId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    submitComplaint: async (req, res) => {
        try {
            const { bookingId, complaintType, description } = req.body;
            const result = await pool.query(
                'INSERT INTO complaints (booking_id, customer_id, complaint_type, complaint_description) VALUES ($1, $2, $3, $4) RETURNING *',
                [bookingId, req.user.customer_id, complaintType, description]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllComplaints: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM complaints');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    resolveComplaint: async (req, res) => {
        try {
            const { complaintId } = req.params;
            const { resolution } = req.body;
            await pool.query(
                "UPDATE complaints SET resolution = $1, status = 'Resolved', resolved_by_user_id = $2, resolved_at = CURRENT_TIMESTAMP WHERE complaint_id = $3",
                [resolution, req.user.user_id, complaintId]
            );
            res.json({ success: true, message: 'Complaint resolved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = feedbackController;
