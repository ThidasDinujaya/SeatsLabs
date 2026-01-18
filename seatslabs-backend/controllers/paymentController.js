const pool = require('../config/database');

const paymentController = {
    processBookingPayment: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { amount, paymentMethodId, transactionId } = req.body;
            const result = await pool.query(
                "INSERT INTO payments (booking_id, payment_method_id, amount, payment_status, transaction_id) VALUES ($1, $2, $3, 'Completed', $4) RETURNING *",
                [bookingId, paymentMethodId, amount, transactionId]
            );
            // Update booking status
            await pool.query("UPDATE bookings SET booking_status = 'Paid' WHERE booking_id = $1", [bookingId]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCustomerPayments: async (req, res) => {
        try {
            const result = await pool.query('SELECT p.* FROM payments p JOIN bookings b ON p.booking_id = b.booking_id WHERE b.customer_id = $1', [req.user.customer_id]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    processAdPayment: async (req, res) => {
        // Implementation for ad payment
        res.status(501).json({ error: 'Not implemented' });
    },

    getAdvertiserPayments: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getAllPayments: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM payments');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getPaymentMethods: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM payment_methods WHERE is_active = true');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createPaymentMethod: async (req, res) => {
        try {
            const { name, type } = req.body;
            const result = await pool.query('INSERT INTO payment_methods (method_name, method_type) VALUES ($1, $2) RETURNING *', [name, type]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    verifyPayment: async (req, res) => {
        try {
            const { paymentId } = req.params;
            await pool.query("UPDATE payments SET payment_status = 'Verified' WHERE payment_id = $1", [paymentId]);
            res.json({ success: true, message: 'Payment verified' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    processRefund: async (req, res) => {
        try {
            const { paymentId } = req.params;
            await pool.query("UPDATE payments SET payment_status = 'Refunded' WHERE payment_id = $1", [paymentId]);
            res.json({ success: true, message: 'Refund processed' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = paymentController;
