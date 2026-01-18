const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const userController = {
    getProfile: async (req, res) => {
        try {
            res.json({ success: true, data: req.user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { firstName, lastName, phoneNumber } = req.body;
            await pool.query(
                'UPDATE users SET user_first_name = $1, user_last_name = $2, user_phone_number = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
                [firstName, lastName, phoneNumber, req.user.user_id]
            );
            res.json({ success: true, message: 'Profile updated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            // Verify old password
            const userResult = await pool.query('SELECT user_password_hash FROM users WHERE user_id = $1', [req.user.user_id]);
            const isMatch = await bcrypt.compare(oldPassword, userResult.rows[0].user_password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: 'Invalid old password' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await pool.query('UPDATE users SET user_password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', [hashedPassword, req.user.user_id]);
            res.json({ success: true, message: 'Password changed' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteAccount: async (req, res) => {
        try {
            await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [req.user.user_id]);
            res.json({ success: true, message: 'Account deactivated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const result = await pool.query('SELECT user_id, user_email, user_first_name, user_last_name, is_active FROM users');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllCustomers: async (req, res) => {
        try {
            const result = await pool.query('SELECT u.*, c.customer_id FROM users u JOIN customers c ON u.user_id = c.user_id');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllTechnicians: async (req, res) => {
        try {
            const result = await pool.query('SELECT u.*, t.technician_id, t.specialization FROM users u JOIN technicians t ON u.user_id = t.user_id');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createTechnician: async (req, res) => {
        // Implementation for creating technician
        res.status(501).json({ error: 'Not implemented' });
    },

    updateTechnician: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    deleteTechnician: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getAllAdvertisers: async (req, res) => {
        try {
            const result = await pool.query('SELECT u.*, ad.advertiser_id, ad.business_name FROM users u JOIN advertisers ad ON u.user_id = ad.user_id');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approveAdvertiser: async (req, res) => {
        try {
            const { advertiserId } = req.params;
            await pool.query('UPDATE advertisers SET is_approved = true WHERE advertiser_id = $1', [advertiserId]);
            res.json({ success: true, message: 'Advertiser approved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    activateUser: async (req, res) => {
        try {
            const { userId } = req.params;
            await pool.query('UPDATE users SET is_active = true WHERE user_id = $1', [userId]);
            res.json({ success: true, message: 'User activated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deactivateUser: async (req, res) => {
        try {
            const { userId } = req.params;
            await pool.query('UPDATE users SET is_active = false WHERE user_id = $1', [userId]);
            res.json({ success: true, message: 'User deactivated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = userController;
