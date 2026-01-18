const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT u.user_id, u.user_email, u.user_first_name, u.user_last_name, u.user_type_id, u.is_active,
                    ut.user_type_name, 
                    c.customer_id, ad.advertiser_id, t.technician_id, m.manager_id
             FROM users u 
             JOIN user_types ut ON u.user_type_id = ut.user_type_id 
             LEFT JOIN customers c ON u.user_id = c.user_id
             LEFT JOIN advertisers ad ON u.user_id = ad.user_id
             LEFT JOIN technicians t ON u.user_id = t.user_id
             LEFT JOIN managers m ON u.user_id = m.user_id
             WHERE u.user_id = $1 AND u.is_active = true`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.user_type_name)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };