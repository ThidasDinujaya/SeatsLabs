const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisementController');
const { authenticate, authorize } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Advertiser routes
router.post('/campaigns',
    authenticate,
    authorize('Advertiser'),
    advertisementController.createCampaign
);

router.get('/campaigns/my-campaigns',
    authenticate,
    authorize('Advertiser'),
    advertisementController.getAdvertiserCampaigns
);

router.post('/campaigns/:campaignId/ads',
    authenticate,
    authorize('Advertiser'),
    upload.single('media'),
    advertisementController.createAdvertisement
);

router.get('/campaigns/:campaignId/analytics',
    authenticate,
    authorize('Advertiser'),
    advertisementController.getCampaignAnalytics
);

router.put('/campaigns/:campaignId/pause',
    authenticate,
    authorize('Advertiser'),
    advertisementController.pauseCampaign
);

router.put('/campaigns/:campaignId/resume',
    authenticate,
    authorize('Advertiser'),
    advertisementController.resumeCampaign
);

// Manager routes
router.get('/campaigns',
    authenticate,
    authorize('Manager'),
    advertisementController.getAllCampaigns
);

router.get('/all-ads',
    authenticate,
    authorize('Manager'),
    advertisementController.getAllAdvertisements
);

router.put('/ads/:adId/approve',
    authenticate,
    authorize('Manager'),
    advertisementController.approveAdvertisement
);

router.put('/ads/:adId/reject',
    authenticate,
    authorize('Manager'),
    advertisementController.rejectAdvertisement
);

router.get('/pricing-plans', advertisementController.getPricingPlans);

router.post('/pricing-plans',
    authenticate,
    authorize('Manager'),
    advertisementController.createPricingPlan
);

// Public routes (for displaying ads)
router.get('/active', advertisementController.getActiveAdvertisements);
router.post('/track-impression', advertisementController.trackImpression);
router.post('/track-click', advertisementController.trackClick);

module.exports = router;