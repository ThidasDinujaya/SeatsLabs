const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middlewares/auth');

// Customer payment routes
router.post('/booking/:bookingId',
    authenticate,
    authorize('Customer'),
    paymentController.processBookingPayment
);

router.get('/my-payments',
    authenticate,
    authorize('Customer'),
    paymentController.getCustomerPayments
);

// Advertiser payment routes
router.post('/advertisement/:campaignId',
    authenticate,
    authorize('Advertiser'),
    paymentController.processAdPayment
);

router.get('/advertisement/my-payments',
    authenticate,
    authorize('Advertiser'),
    paymentController.getAdvertiserPayments
);

// Manager routes
router.get('/',
    authenticate,
    authorize('Manager'),
    paymentController.getAllPayments
);

router.get('/methods', paymentController.getPaymentMethods);

router.post('/methods',
    authenticate,
    authorize('Manager'),
    paymentController.createPaymentMethod
);

router.put('/:paymentId/verify',
    authenticate,
    authorize('Manager'),
    paymentController.verifyPayment
);

router.post('/:paymentId/refund',
    authenticate,
    authorize('Manager'),
    paymentController.processRefund
);

module.exports = router;