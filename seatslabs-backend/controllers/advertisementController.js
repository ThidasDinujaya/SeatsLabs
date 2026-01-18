const pool = require('../config/database');

const advertisementController = {
    createCampaign: async (req, res) => {
        try {
            const { pricingPlanId, campaignName, campaignType, startDate, endDate, budget, targetAudience } = req.body;
            const result = await pool.query(
                'INSERT INTO ad_campaigns (advertiser_id, pricing_plan_id, campaign_name, campaign_type, start_date, end_date, budget, target_audience) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [req.user.advertiser_id, pricingPlanId, campaignName, campaignType, startDate, endDate, budget, targetAudience]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAdvertiserCampaigns: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM ad_campaigns WHERE advertiser_id = $1', [req.user.advertiser_id]);
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
                'INSERT INTO advertisements (campaign_id, ad_title, ad_content, media_type, media_url, target_service_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [campaignId, adTitle, adContent, mediaType, mediaUrl, targetServiceType]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCampaignAnalytics: async (req, res) => {
        res.status(501).json({ error: 'Not implemented' });
    },

    pauseCampaign: async (req, res) => {
        try {
            const { campaignId } = req.params;
            await pool.query("UPDATE ad_campaigns SET status = 'Paused' WHERE campaign_id = $1 AND advertiser_id = $2", [campaignId, req.user.advertiser_id]);
            res.json({ success: true, message: 'Campaign paused' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    resumeCampaign: async (req, res) => {
        try {
            const { campaignId } = req.params;
            await pool.query("UPDATE ad_campaigns SET status = 'Active' WHERE campaign_id = $1 AND advertiser_id = $2", [campaignId, req.user.advertiser_id]);
            res.json({ success: true, message: 'Campaign resumed' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllCampaigns: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM ad_campaigns');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    approveAdvertisement: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query("UPDATE advertisements SET is_approved = true, approved_at = CURRENT_TIMESTAMP, approved_by_user_id = $1 WHERE advertisement_id = $2", [req.user.user_id, adId]);
            res.json({ success: true, message: 'Advertisement approved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    rejectAdvertisement: async (req, res) => {
        try {
            const { adId } = req.params;
            await pool.query("UPDATE advertisements SET is_approved = false WHERE advertisement_id = $1", [adId]);
            res.json({ success: true, message: 'Advertisement rejected' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getPricingPlans: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM ad_pricing_plans WHERE is_active = true');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createPricingPlan: async (req, res) => {
        try {
            const { name, type, pricePerDay, maxImpressions, features } = req.body;
            const result = await pool.query(
                'INSERT INTO ad_pricing_plans (plan_name, plan_type, price_per_day, max_impressions, features) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [name, type, pricePerDay, maxImpressions, features]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getActiveAdvertisements: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM advertisements WHERE is_approved = true');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    trackImpression: async (req, res) => {
        res.json({ success: true });
    },

    trackClick: async (req, res) => {
        res.json({ success: true });
    }
};

module.exports = advertisementController;
