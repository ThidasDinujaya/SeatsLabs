const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middlewares/auth');

// User routes
router.get('/my-notifications',
    authenticate,
    notificationController.getUserNotifications
);

router.put('/:notificationId/read',
    authenticate,
    notificationController.markAsRead
);

router.put('/mark-all-read',
    authenticate,
    notificationController.markAllAsRead
);

router.delete('/:notificationId',
    authenticate,
    notificationController.deleteNotification
);

// Manager routes
router.post('/send',
    authenticate,
    authorize('Manager'),
    notificationController.sendNotification
);

router.post('/broadcast',
    authenticate,
    authorize('Manager'),
    notificationController.broadcastNotification
);

router.get('/templates',
    authenticate,
    authorize('Manager'),
    notificationController.getTemplates
);

router.post('/templates',
    authenticate,
    authorize('Manager'),
    notificationController.createTemplate
);

module.exports = router;