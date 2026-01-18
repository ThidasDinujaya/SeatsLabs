const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middlewares/auth');

// Customer routes
router.post('/',
    authenticate,
    authorize('Customer'),
    vehicleController.addVehicle
);

router.get('/my-vehicles',
    authenticate,
    authorize('Customer'),
    vehicleController.getCustomerVehicles
);

router.put('/:vehicleId',
    authenticate,
    authorize('Customer'),
    vehicleController.updateVehicle
);

router.delete('/:vehicleId',
    authenticate,
    authorize('Customer'),
    vehicleController.deleteVehicle
);

// Public/utility routes
router.get('/brands', vehicleController.getAllBrands);
router.get('/brands/:brandId/models', vehicleController.getModelsByBrand);
router.get('/body-types', vehicleController.getAllBodyTypes);

// Manager routes (for managing brands/models)
router.post('/brands',
    authenticate,
    authorize('Manager'),
    vehicleController.createBrand
);

router.post('/models',
    authenticate,
    authorize('Manager'),
    vehicleController.createModel
);

router.post('/body-types',
    authenticate,
    authorize('Manager'),
    vehicleController.createBodyType
);

module.exports = router;