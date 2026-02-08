const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateBooking } = require('../validators/bookingValidator');

// Public/Shared Routes
router.get('/available-slots', bookingController.getAvailableSlots);

// Customer Routes
router.post('/',
    authenticate,
    authorize('Customer'),
    validateBooking,
    bookingController.createBooking
);

router.get('/my-bookings',
    authenticate,
    authorize('Customer'),
    bookingController.getCustomerBookings
);

router.put('/:bookingId/cancel',
    authenticate,
    authorize('Customer'),
    bookingController.cancelBooking
);

router.put('/:bookingId/reschedule',
    authenticate,
    authorize('Customer'),
    bookingController.rescheduleBooking
);

// Manager Routes
router.get('/',
    authenticate,
    authorize('Manager'),
    bookingController.getAllBookings
);

router.get('/:bookingId',
    authenticate,
    bookingController.getBookingById
);

router.put('/:bookingId/approve',
    authenticate,
    authorize('Manager'),
    bookingController.approveBooking
);

router.put('/:bookingId/reject',
    authenticate,
    authorize('Manager'),
    bookingController.rejectBooking
);

router.put('/:bookingId/assign-technician',
    authenticate,
    authorize('Manager'),
    bookingController.assignTechnician
);

// Technician Routes
router.get('/technician/my-jobs',
    authenticate,
    authorize('Technician'),
    bookingController.getTechnicianJobs
);

router.put('/:bookingId/status',
    authenticate,
    authorize('Technician', 'Manager'),
    bookingController.updateBookingStatus
);

router.post('/:bookingId/notes',
    authenticate,
    authorize('Technician'),
    bookingController.addServiceNotes
);

module.exports = router;
