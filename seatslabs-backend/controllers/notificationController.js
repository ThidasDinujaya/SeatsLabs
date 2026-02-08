const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');

const notificationController = {
    // Get user Notifications
    getUserNotifications: async (req, res) => {
        try {
            const userId = req.user.userId;
            const { limit = 20, offset = 0 } = req.query;

            const result = await pool.query(`
        SELECT *
        FROM "Notifications"
        WHERE "userId" = $1
        ORDER BY "notificationCreatedAt" DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]);

            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Mark notification as read
    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;

            await pool.query(`
        UPDATE "Notifications"
        SET "notificationIsRead" = true
        WHERE "notificationId" = $1 AND "userId" = $2
      `, [notificationId, req.user.userId]);

            res.json({
                success: true,
                message: 'Notification marked as read'
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Send notification
    sendNotification: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                userId,
                notificationType,
                title,
                message,
                sendEmail: shouldSendEmail,
                sendSMS: shouldSendSMS
            } = req.body;

            // Create notification record
            const notifResult = await client.query(`
        INSERT INTO "Notifications"
        ("userId", "notificationType", "notificationTitle", "notificationMessage", "notificationDeliveryStatus")
        VALUES ($1, $2, $3, $4, 'Pending')
        RETURNING *
      `, [userId, notificationType, title, message]);

            const notification = notifResult.rows[0];

            // Get user details
            const userResult = await client.query(
                'SELECT "userEmail", "userPhoneNumber" FROM "Users" WHERE "userId" = $1',
                [userId]
            );
            const user = userResult.rows[0];

            // Send email if requested
            if (shouldSendEmail && user.userEmail) {
                await sendEmail(user.userEmail, title, message);
            }

            // Send SMS if requested
            if (shouldSendSMS && user.userPhoneNumber) {
                await sendSMS(user.userPhoneNumber, message);
            }

            // Update notification status
            await client.query(`
        UPDATE "Notifications"
        SET "notificationDeliveryStatus" = 'Sent', "notificationSentTime" = CURRENT_TIMESTAMP
        WHERE "notificationId" = $1
      `, [notification.notificationId]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Notification sent successfully',
                data: notification
            });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    markAllAsRead: async (req, res) => {
        try {
            await pool.query('UPDATE "Notifications" SET "notificationIsRead" = true WHERE "userId" = $1', [req.user.userId]);
            res.json({ success: true, message: 'All Notifications marked as read' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;
            await pool.query('DELETE FROM "Notifications" WHERE "notificationId" = $1 AND "userId" = $2', [notificationId, req.user.userId]);
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    broadcastNotification: async (req, res) => {
        try {
            const { title, message, userType } = req.body;
            let query = 'SELECT "userId" FROM "Users" WHERE notificationIsActive = true';
            const params = [];

            if (userType) {
                query += ' AND "userTypeId" = (SELECT "userTypeId" FROM "UserTypes" WHERE "userTypeName" = $1)';
                params.push(userType);
            }

            const Users = await pool.query(query, params);

            for (const user of Users.rows) {
                await pool.query(
                    'INSERT INTO "Notifications" ("userId", "notificationType", "notificationTitle", "notificationMessage") VALUES ($1, $2, $3, $4)',
                    [user.userId, 'Broadcast', title, message]
                );
            }

            res.json({ success: true, message: `Broadcast sent to ${Users.rows.length} Users` });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getTemplates: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "NotificationTemplates"');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createTemplate: async (req, res) => {
        try {
            const { name, type, notificationTemplateSubject, body } = req.body;
            const result = await pool.query(
                'INSERT INTO "NotificationTemplates" (notificationTemplateTemplateName, notificationTemplateTemplateType, "notificationTemplateSubject", "notificationTemplateMessageBody") VALUES ($1, $2, $3, $4) RETURNING *',
                [name, type, notificationTemplateSubject, body]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = notificationController;