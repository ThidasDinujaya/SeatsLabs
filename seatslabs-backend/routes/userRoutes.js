const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/auth');

// Profile routes (all authenticated users)
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);
router.delete('/account', authenticate, userController.deleteAccount);

// Manager routes
router.get('/',
    authenticate,
    authorize('Manager'),
    userController.getAllUsers
);

router.get('/customers',
    authenticate,
    authorize('Manager'),
    userController.getAllCustomers
);

router.get('/technicians',
    authenticate,
    authorize('Manager'),
    userController.getAllTechnicians
);

router.post('/technicians',
    authenticate,
    authorize('Manager'),
    userController.createTechnician
);

router.put('/technicians/:technicianId',
    authenticate,
    authorize('Manager'),
    userController.updateTechnician
);

router.delete('/technicians/:technicianId',
    authenticate,
    authorize('Manager'),
    userController.deleteTechnician
);

router.get('/advertisers',
    authenticate,
    authorize('Manager'),
    userController.getAllAdvertisers
);

router.put('/advertisers/:advertiserId/approve',
    authenticate,
    authorize('Manager'),
    userController.approveAdvertiser
);

router.put('/users/:userId/activate',
    authenticate,
    authorize('Manager'),
    userController.activateUser
);

router.put('/users/:userId/deactivate',
    authenticate,
    authorize('Manager'),
    userController.deactivateUser
);

module.exports = router;