const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    register: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                firstName,
                middleName,
                lastName,
                dob,
                email,
                password,
                phoneNumber,
                userType
            } = req.body;

            // Check if email exists
            const emailCheck = await client.query(
                'SELECT * FROM users WHERE user_email = $1',
                [email]
            );

            if (emailCheck.rows.length > 0) {
                throw new Error('Email already registered');
            }

            // Get user type ID
            const userTypeResult = await client.query(
                'SELECT user_type_id FROM user_types WHERE user_type_name = $1',
                [userType]
            );

            if (userTypeResult.rows.length === 0) {
                throw new Error('Invalid user type');
            }

            const userTypeId = userTypeResult.rows[0].user_type_id;

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create user
            const userResult = await client.query(
                `INSERT INTO users 
        (user_type_id, user_first_name, user_middle_name, user_last_name, 
         user_dob, user_email, user_password_hash, user_phone_number)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING user_id, user_email, user_first_name, user_last_name`,
                [userTypeId, firstName, middleName, lastName, dob, email, passwordHash, phoneNumber]
            );

            const user = userResult.rows[0];

            // Create role-specific entry
            if (userType === 'Customer') {
                await client.query(
                    'INSERT INTO customers (user_id) VALUES ($1)',
                    [user.user_id]
                );
            } else if (userType === 'Advertiser') {
                await client.query(
                    'INSERT INTO advertisers (user_id, business_name) VALUES ($1, $2)',
                    [user.user_id, req.body.businessName || 'Not Specified']
                );
            }

            await client.query('COMMIT');

            // Generate token
            const token = jwt.sign(
                { userId: user.user_id, userType },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                token,
                user: {
                    id: user.user_id,
                    email: user.user_email,
                    firstName: user.user_first_name,
                    lastName: user.user_last_name,
                    userType
                }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const result = await pool.query(
                `SELECT u.*, ut.user_type_name 
         FROM users u
         JOIN user_types ut ON u.user_type_id = ut.user_type_id
         WHERE u.user_email = $1 AND u.is_active = true`,
                [email]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const user = result.rows[0];

            const isValidPassword = await bcrypt.compare(password, user.user_password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { userId: user.user_id, userType: user.user_type_name },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user.user_id,
                    email: user.user_email,
                    firstName: user.user_first_name,
                    lastName: user.user_last_name,
                    userType: user.user_type_name
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    logout: (req, res) => {
        // Since we are using stateless JWT, we can just return success
        // Client side should delete the token
        res.json({ success: true, message: 'Logged out successfully' });
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            // Implementation placeholder
            res.json({ success: true, message: 'Password reset email sent (simulated)' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            // Implementation placeholder
            res.json({ success: true, message: 'Password reset successful (simulated)' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    verifyEmail: async (req, res) => {
        try {
            const { token } = req.body;
            // Implementation placeholder
            res.json({ success: true, message: 'Email verified successfully (simulated)' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    refreshToken: async (req, res) => {
        try {
            const { token } = req.body;
            // Implementation placeholder
            res.json({ success: true, token: 'new-token-simulated' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = authController;