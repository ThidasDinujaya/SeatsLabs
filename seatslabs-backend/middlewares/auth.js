const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1] || req.query.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            `SELECT u."userId", u."userEmail", u."userFirstName", u."userLastName", u."userTypeId", u."userIsActive",
                    ut."userTypeName", 
                    c."customerId", ad."advertiserId", t."technicianId", m."managerId"
             FROM "Users" u 
             JOIN "UserTypes" ut ON u."userTypeId" = ut."userTypeId" 
             LEFT JOIN "Customers" c ON u."userId" = c."customerUserId"
             LEFT JOIN "Advertisers" ad ON u."userId" = ad."advertiserUserId"
             LEFT JOIN "Technicians" t ON u."userId" = t."technicianUserId"
             LEFT JOIN "Managers" m ON u."userId" = m."managerUserId"
             WHERE u."userId" = $1 AND u."userIsActive" = true`,
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
        if (!roles.includes(req.user.userTypeName)) {
            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.'
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };