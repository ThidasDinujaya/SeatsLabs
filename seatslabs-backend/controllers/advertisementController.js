const pool = require('../config/database');

const advertisementController = {
    createCampaign: async (req, res) => {
        try {
            const { pricingPlanId, campaignName, campaignType, startDate, endDate, adCampaignBudget, targetAudience } = req.body;
            const result = await pool.query(
                'INSERT INTO "AdCampaigns" ("advertiserId", "adPricingPlanId", "adCampaignName", "adCampaignType", "adCampaignStartDate", "adCampaignEndDate", "adCampaignBudget", "adCampaignTargetAudience") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [req.user.advertiserId, pricingPlanId, campaignName, campaignType, startDate, endDate, adCampaignBudget, targetAudience]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAdvertiserCampaigns: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "AdCampaigns" WHERE "advertiserId" = $1', [req.user.advertiserId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createAdvertisement: async (req, res) => {
        try {
            const { campaignId } = req.params;
            const { adTitle, adContent, mediaType, targetServiceType } = req.body;
            const mediaUrl = req.file ? req.file.path : null;
            const result = await pool.query(
                'INSERT INTO "Advertisements" ("advertisementCampaignId", "advertisementTitle", "advertisementContent", "advertisementMediaType", "advertisementMediaUrl", "advertisementTargetServiceType") VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [campaignId, adTitle, adContent, mediaType, mediaUrl, targetServiceType]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCampaignAnalytics: async (req, res) => {
        try {
            const { campaignId } = req.params;
            const result = await pool.query(`
                SELECT a."advertisementId", a."advertisementTitle", 
                       SUM(an."adAnalyticsImpressions") as total_impressions, 
                       SUM(an."adAnalyticsClicks") as total_clicks
                FROM "Advertisements" a
                LEFT JOIN "AdAnalytics" an ON a."advertisementId" = an."adAnalyticsAdvertisementId"
                WHERE a."advertisementCampaignId" = $1
                GROUP BY a."advertisementId", a."advertisementTitle"
            `, [campaignId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    pauseCampaign: async (req, res) => {
        try {
            const { campaignId } = req.params;
            await pool.query("UPDATE \"AdCampaigns\" SET \"adCampaignStatus\" = 'Paused' WHERE \"adCampaignId\" = $1 AND \"advertiserId\" = $2", [campaignId, req.user.advertiserId]);
            res.json({ success: true, message: 'Campaign paused' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    resumeCampaign: async (req, res) => {
        try {
            const { campaignId } = req.params;
            await pool.query("UPDATE \"AdCampaigns\" SET \"adCampaignStatus\" = 'Active' WHERE \"adCampaignId\" = $1 AND \"advertiserId\" = $2", [campaignId, req.user.advertiserId]);
            res.json({ success: true, message: 'Campaign resumed' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllCampaigns: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT ac.*, ad."advertiserBusinessName" 
                FROM "AdCampaigns" ac
                JOIN "Advertisers" ad ON ac."advertiserId" = ad."advertiserId"
                ORDER BY ac."adCampaignCreatedAt" DESC
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllAdvertisements: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT a.*, ac."adCampaignName", ad."advertiserBusinessName"
                FROM "Advertisements" a
                JOIN "AdCampaigns" ac ON a."advertisementCampaignId" = ac."adCampaignId"
                JOIN "Advertisers" ad ON ac."advertiserId" = ad."advertiserId"
                ORDER BY a."advertisementCreatedAt" DESC
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approveAdvertisement: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query('UPDATE "Advertisements" SET "advertisementIsApproved" = true, "advertisementApprovedAt" = CURRENT_TIMESTAMP, "advertisementApprovedByUserId" = $1 WHERE "advertisementId" = $2', [req.user.userId, adId]);
            res.json({ success: true, message: 'Advertisement approved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    rejectAdvertisement: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query('UPDATE "Advertisements" SET "advertisementIsApproved" = false WHERE "advertisementId" = $1', [adId]);
            res.json({ success: true, message: 'Advertisement rejected' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getPricingPlans: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "AdPricingPlans" WHERE "adPricingPlanIsActive" = true');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createPricingPlan: async (req, res) => {
        try {
            const { name, type, pricePerDay, maxImpressions, adPricingPlanFeatures } = req.body;
            const result = await pool.query(
                'INSERT INTO "AdPricingPlans" ("adPricingPlanName", "adPricingPlanType", "adPricingPlanPricePerDay", "adPricingPlanMaxImpressions", "adPricingPlanFeatures") VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, type, pricePerDay, maxImpressions, adPricingPlanFeatures]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getActiveAdvertisements: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "Advertisements" WHERE "advertisementIsApproved" = true');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    trackImpression: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query(`
                INSERT INTO "AdAnalytics" ("adAnalyticsAdvertisementId", "adAnalyticsDate", "adAnalyticsImpressions")
                VALUES ($1, CURRENT_DATE, 1)
                ON CONFLICT ("adAnalyticsAdvertisementId", "adAnalyticsDate")
                DO UPDATE SET "adAnalyticsImpressions" = "AdAnalytics"."adAnalyticsImpressions" + 1
            `, [adId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    trackClick: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query(`
                INSERT INTO "AdAnalytics" ("adAnalyticsAdvertisementId", "adAnalyticsDate", "adAnalyticsClicks")
                VALUES ($1, CURRENT_DATE, 1)
                ON CONFLICT ("adAnalyticsAdvertisementId", "adAnalyticsDate")
                DO UPDATE SET "adAnalyticsClicks" = "AdAnalytics"."adAnalyticsClicks" + 1
            `, [adId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = advertisementController;
