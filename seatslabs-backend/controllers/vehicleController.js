const pool = require('../config/database');

const vehicleController = {
    addVehicle: async (req, res) => {
        try {
            const { brandId, modelId, bodyTypeId, registrationNumber, manufactureYear, vehicleColor, vehicleMileage } = req.body;
            const customerId = req.user.customerId;
            const result = await pool.query(
                'INSERT INTO "Vehicles" ("vehicleCustomerId", "vehicleVehicleBrandId", "vehicleVehicleModelId", "vehicleVehicleBodyTypeId", "vehicleRegistrationNumber", "vehicleManufactureYear", "vehicleColor", "vehicleMileage") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [customerId, brandId, modelId, bodyTypeId, registrationNumber, manufactureYear, vehicleColor, vehicleMileage]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCustomerVehicles: async (req, res) => {
        try {
            const customerId = req.user.customerId;
            const result = await pool.query('SELECT v.*, vb."vehicleBrandName", vm."vehicleModelName" FROM "Vehicles" v JOIN "VehicleBrands" vb ON v."vehicleVehicleBrandId" = vb."vehicleBrandId" JOIN "VehicleModels" vm ON v."vehicleVehicleModelId" = vm."vehicleModelId" WHERE v."vehicleCustomerId" = $1', [customerId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateVehicle: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            const { vehicleColor, vehicleMileage } = req.body;
            await pool.query('UPDATE "Vehicles" SET "vehicleColor" = $1, "vehicleMileage" = $2, "vehicleUpdatedAt" = CURRENT_TIMESTAMP WHERE "vehicleId" = $3 AND "vehicleCustomerId" = $4', [vehicleColor, vehicleMileage, vehicleId, req.user.customerId]);
            res.json({ success: true, message: 'Vehicle updated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteVehicle: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            await pool.query('DELETE FROM "Vehicles" WHERE "vehicleId" = $1 AND "vehicleCustomerId" = $2', [vehicleId, req.user.customerId]);
            res.json({ success: true, message: 'Vehicle deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllBrands: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "VehicleBrands" ORDER BY "vehicleBrandName"');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getModelsByBrand: async (req, res) => {
        try {
            const { brandId } = req.params;
            const result = await pool.query('SELECT * FROM "VehicleModels" WHERE "vehicleModelVehicleBrandId" = $1 ORDER BY "vehicleModelName"', [brandId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllBodyTypes: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM "VehicleBodyTypes" ORDER BY "vehicleBodyTypeName"');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createBrand: async (req, res) => {
        try {
            const { name, vehicleBrandCountry } = req.body;
            const result = await pool.query('INSERT INTO "VehicleBrands" ("vehicleBrandName", "vehicleBrandCountry") VALUES ($1, $2) RETURNING *', [name, vehicleBrandCountry]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    createModel: async (req, res) => {
        try {
            const { brandId, name, year } = req.body;
            const result = await pool.query('INSERT INTO "VehicleModels" ("vehicleModelVehicleBrandId", "vehicleModelName", "vehicleModelYearIntroduced") VALUES ($1, $2, $3) RETURNING *', [brandId, name, year]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    createBodyType: async (req, res) => {
        try {
            const { name, vehicleDescription } = req.body;
            const result = await pool.query('INSERT INTO "VehicleBodyTypes" ("vehicleBodyTypeName", "vehicleBodyTypeDescription") VALUES ($1, $2) RETURNING *', [name, vehicleDescription]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = vehicleController;
