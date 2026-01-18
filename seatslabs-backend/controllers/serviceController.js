const pool = require('../config/database');

const serviceController = {
    getAllServices: async (req, res) => {
        try {
            const { categoryId, available } = req.query;

            let query = `
        SELECT s.*, sc.service_category_name 
        FROM services s
        LEFT JOIN service_categories sc ON s.service_category_id = sc.service_category_id
        WHERE 1=1
      `;
            const params = [];

            if (categoryId) {
                params.push(categoryId);
                query += ` AND s.service_category_id = $${params.length}`;
            }

            if (available === 'true') {
                query += ' AND s.is_available = true';
            }

            query += ' ORDER BY s.service_name';

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createService: async (req, res) => {
        try {
            const {
                serviceCategoryId,
                serviceName,
                serviceDescription,
                durationMinutes,
                basePrice,
                requirements
            } = req.body;

            const result = await pool.query(
                `INSERT INTO services 
        (service_category_id, service_name, service_description, 
         duration_minutes, base_price, requirements)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
                [serviceCategoryId, serviceName, serviceDescription,
                    durationMinutes, basePrice, requirements]
            );

            res.status(201).json({
                success: true,
                message: 'Service created successfully',
                data: result.rows[0]
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateServicePrice: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const { basePrice } = req.body;

            await pool.query(
                'UPDATE services SET base_price = $1, updated_at = CURRENT_TIMESTAMP WHERE service_id = $2',
                [basePrice, serviceId]
            );

            res.json({
                success: true,
                message: 'Service price updated successfully'
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateServiceDuration: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const { durationMinutes } = req.body;

            await pool.query(
                'UPDATE services SET duration_minutes = $1, updated_at = CURRENT_TIMESTAMP WHERE service_id = $2',
                [durationMinutes, serviceId]
            );

            res.json({
                success: true,
                message: 'Service duration updated successfully'
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getAllCategories: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM service_categories ORDER BY service_category_name');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getServiceById: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const result = await pool.query('SELECT * FROM services WHERE service_id = $1', [serviceId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Service not found' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name, description } = req.body;
            const result = await pool.query(
                'INSERT INTO service_categories (service_category_name, service_category_description) VALUES ($1, $2) RETURNING *',
                [name, description]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            const { name, description, duration, price } = req.body;
            await pool.query(
                'UPDATE services SET service_name = $1, service_description = $2, duration_minutes = $3, base_price = $4, updated_at = CURRENT_TIMESTAMP WHERE service_id = $5',
                [name, description, duration, price, serviceId]
            );
            res.json({ success: true, message: 'Service updated' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteService: async (req, res) => {
        try {
            const { serviceId } = req.params;
            await pool.query('DELETE FROM services WHERE service_id = $1', [serviceId]);
            res.json({ success: true, message: 'Service deleted' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = serviceController;