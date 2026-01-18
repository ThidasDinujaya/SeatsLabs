const pool = require('../config/database');

const vehicleController = {
    addVehicle: async (req, res) => {
        try {
            const { brandId, modelId, bodyTypeId, registrationNumber, manufactureYear, color, mileage } = req.body;
            const customerId = req.user.customer_id;
            const result = await pool.query(
                'INSERT INTO vehicles (customer_id, vehicle_brand_id, vehicle_model_id, vehicle_body_type_id, registration_number, manufacture_year, color, mileage) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [customerId, brandId, modelId, bodyTypeId, registrationNumber, manufactureYear, color, mileage]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getCustomerVehicles: async (req, res) => {
        try {
            const customerId = req.user.customer_id;
            const result = await pool.query('SELECT v.*, vb.vehicle_brand_name, vm.vehicle_model_name FROM vehicles v JOIN vehicle_brands vb ON v.vehicle_brand_id = vb.vehicle_brand_id JOIN vehicle_models vm ON v.vehicle_model_id = vm.vehicle_model_id WHERE v.customer_id = $1', [customerId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    updateVehicle: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            const { color, mileage } = req.body;
            await pool.query('UPDATE vehicles SET color = $1, mileage = $2, updated_at = CURRENT_TIMESTAMP WHERE vehicle_id = $3 AND customer_id = $4', [color, mileage, vehicleId, req.user.customer_id]);
            res.json({ success: true, message: 'Vehicle updated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteVehicle: async (req, res) => {
        try {
            const { vehicleId } = req.params;
            await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1 AND customer_id = $2', [vehicleId, req.user.customer_id]);
            res.json({ success: true, message: 'Vehicle deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllBrands: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM vehicle_brands ORDER BY vehicle_brand_name');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getModelsByBrand: async (req, res) => {
        try {
            const { brandId } = req.params;
            const result = await pool.query('SELECT * FROM vehicle_models WHERE vehicle_brand_id = $1 ORDER BY vehicle_model_name', [brandId]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAllBodyTypes: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM vehicle_body_types ORDER BY vehicle_body_type_name');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createBrand: async (req, res) => {
        try {
            const { name, country } = req.body;
            const result = await pool.query('INSERT INTO vehicle_brands (vehicle_brand_name, country) VALUES ($1, $2) RETURNING *', [name, country]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    createModel: async (req, res) => {
        try {
            const { brandId, name, year } = req.body;
            const result = await pool.query('INSERT INTO vehicle_models (vehicle_brand_id, vehicle_model_name, year_introduced) VALUES ($1, $2, $3) RETURNING *', [brandId, name, year]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    createBodyType: async (req, res) => {
        try {
            const { name, description } = req.body;
            const result = await pool.query('INSERT INTO vehicle_body_types (vehicle_body_type_name, description) VALUES ($1, $2) RETURNING *', [name, description]);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = vehicleController;
