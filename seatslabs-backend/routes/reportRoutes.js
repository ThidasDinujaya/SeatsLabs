const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middlewares/auth');

// All report routes require authentication
router.use(authenticate);

// Daily Booking Report (Manager only)
router.get('/daily-booking', 
  authorize('Manager'), 
  reportController.generateDailyBookingReport
);

// Monthly Revenue Report (Manager only)
router.get('/monthly-revenue', 
  authorize('Manager'), 
  reportController.generateMonthlyRevenueReport
);

// Technician Performance Report (Manager only)
router.get('/technician-performance', 
  authorize('Manager'), 
  reportController.generateTechnicianPerformanceReport
);

// Customer Satisfaction Report (Manager only)
router.get('/customer-satisfaction', 
  authorize('Manager'), 
  reportController.generateCustomerSatisfactionReport
);

// Advertisement Performance Report (Manager, Advertiser)
router.get('/advertisement-performance', 
  authorize('Manager', 'Advertiser'), 
  reportController.generateAdvertisementPerformanceReport
);

// Download Report
router.get('/download/:filename', reportController.downloadReport);

module.exports = router;
