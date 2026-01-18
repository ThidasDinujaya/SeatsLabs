const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/categories', serviceController.getAllCategories);
router.get('/:serviceId', serviceController.getServiceById);

// Manager only routes
router.post('/categories',
    authenticate,
    authorize('Manager'),
    serviceController.createCategory
);

router.post('/',
    authenticate,
    authorize('Manager'),
    serviceController.createService
);

router.put('/:serviceId',
    authenticate,
    authorize('Manager'),
    serviceController.updateService
);

router.delete('/:serviceId',
    authenticate,
    authorize('Manager'),
    serviceController.deleteService
);

router.put('/:serviceId/price',
    authenticate,
    authorize('Manager'),
    serviceController.updateServicePrice
);

router.put('/:serviceId/duration',
    authenticate,
    authorize('Manager'),
    serviceController.updateServiceDuration
);

module.exports = router;