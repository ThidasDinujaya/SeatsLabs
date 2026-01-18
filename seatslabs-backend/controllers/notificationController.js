const pool = require('../config/database');
const { sendEmail } = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');

const notificationController = {
    // Get user notifications
    getUserNotifications: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { limit = 20, offset = 0 } = req.query;

            const result = await pool.query(`
        SELECT *
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
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
        UPDATE notifications
        SET is_read = true
        WHERE notification_id = $1 AND user_id = $2
      `, [notificationId, req.user.user_id]);

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
        INSERT INTO notifications
        (user_id, notification_type, notification_title, notification_message, delivery_status)
        VALUES ($1, $2, $3, $4, 'Pending')
        RETURNING *
      `, [userId, notificationType, title, message]);

            const notification = notifResult.rows[0];

            // Get user details
            const userResult = await client.query(
                'SELECT user_email, user_phone_number FROM users WHERE user_id = $1',
                [userId]
            );
            const user = userResult.rows[0];

            // Send email if requested
            if (shouldSendEmail && user.user_email) {
                await sendEmail(user.user_email, title, message);
            }

            // Send SMS if requested
            if (shouldSendSMS && user.user_phone_number) {
                await sendSMS(user.user_phone_number, message);
            }

            // Update notification status
            await client.query(`
        UPDATE notifications
        SET delivery_status = 'Sent', sent_time = CURRENT_TIMESTAMP
        WHERE notification_id = $1
      `, [notification.notification_id]);

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
            await pool.query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.user_id]);
            res.json({ success: true, message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.params;
            await pool.query('DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2', [notificationId, req.user.user_id]);
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    broadcastNotification: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    getTemplates: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM notification_templates');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createTemplate: async (req, res) => {
        try {
            const { name, type, subject, body } = req.body;
            const result = await pool.query(
                'INSERT INTO notification_templates (template_name, template_type, subject, message_body) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, type, subject, body]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = notificationController;