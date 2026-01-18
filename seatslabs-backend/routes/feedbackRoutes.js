const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middlewares/auth');

// Customer routes
router.post('/',
    authenticate,
    authorize('Customer'),
    feedbackController.submitFeedback
);

router.get('/my-feedback',
    authenticate,
    authorize('Customer'),
    feedbackController.getCustomerFeedback
);

// Manager routes
router.get('/',
    authenticate,
    authorize('Manager'),
    feedbackController.getAllFeedback
);

router.get('/service/:serviceId',
    authenticate,
    authorize('Manager'),
    feedbackController.getFeedbackByService
);

router.get('/technician/:technicianId',
    authenticate,
    authorize('Manager'),
    feedbackController.getFeedbackByTechnician
);

// Complaint routes
router.post('/complaints',
    authenticate,
    authorize('Customer'),
    feedbackController.submitComplaint
);

router.get('/complaints',
    authenticate,
    authorize('Manager'),
    feedbackController.getAllComplaints
);

router.put('/complaints/:complaintId/resolve',
    authenticate,
    authorize('Manager'),
    feedbackController.resolveComplaint
);

module.exports = router;