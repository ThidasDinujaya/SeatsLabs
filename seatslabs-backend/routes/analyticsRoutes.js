const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middlewares/auth');

// All analytics routes require Manager authentication
router.use(authenticate);
router.use(authorize('Manager'));

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/booking-trends', analyticsController.getBookingTrends);
router.get('/revenue-analysis', analyticsController.getRevenueAnalysis);
router.get('/service-popularity', analyticsController.getServicePopularity);
router.get('/peak-hours', analyticsController.getPeakHours);
router.get('/customer-retention', analyticsController.getCustomerRetention);
router.get('/technician-utilization', analyticsController.getTechnicianUtilization);
router.get('/advertisement-roi', analyticsController.getAdvertisementROI);

module.exports = router;