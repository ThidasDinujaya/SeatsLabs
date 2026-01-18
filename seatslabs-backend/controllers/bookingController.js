const pool = require('../config/database');
const { generateBookingReference } = require('../utils/helpers');

const bookingController = {
    // Create new booking
    createBooking: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const {
                vehicleId,
                serviceId,
                timeSlotId,
                specialNotes
            } = req.body;

            const customerId = req.user.customer_id;

            // Check time slot availability
            const slotCheck = await client.query(
                'SELECT * FROM time_slots WHERE time_slot_id = $1 AND is_available = true',
                [timeSlotId]
            );

            if (slotCheck.rows.length === 0) {
                throw new Error('Time slot not available');
            }

            const slot = slotCheck.rows[0];
            if (slot.current_bookings >= slot.max_capacity) {
                throw new Error('Time slot is fully booked');
            }

            // Get service details for pricing
            const serviceResult = await client.query(
                'SELECT * FROM services WHERE service_id = $1',
                [serviceId]
            );
            const service = serviceResult.rows[0];

            // Generate booking reference
            const bookingReference = generateBookingReference();

            // Create booking
            const scheduledDateTime = new Date(
                `${slot.slot_date}T${slot.start_time}`
            );

            const bookingResult = await client.query(
                `INSERT INTO bookings 
        (customer_id, vehicle_id, service_id, time_slot_id, booking_reference, 
         scheduled_date_time, booking_status, special_notes, estimated_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
                [
                    customerId,
                    vehicleId,
                    serviceId,
                    timeSlotId,
                    bookingReference,
                    scheduledDateTime,
                    'Pending',
                    specialNotes,
                    service.base_price
                ]
            );

            const booking = bookingResult.rows[0];

            // Update time slot
            await client.query(
                'UPDATE time_slots SET current_bookings = current_bookings + 1 WHERE time_slot_id = $1',
                [timeSlotId]
            );

            // Create initial status
            await client.query(
                `INSERT INTO booking_statuses (booking_id, status, notes, updated_by_user_id)
         VALUES ($1, $2, $3, $4)`,
                [booking.booking_id, 'Pending', 'Booking created', req.user.user_id]
            );

            await client.query('COMMIT');

            res.status(201).json({
                success: true,
                message: 'Booking created successfully',
                data: booking
            });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    // Get all bookings for customer
    getCustomerBookings: async (req, res) => {
        try {
            const customerId = req.user.customer_id;
            const { status, limit = 10, offset = 0 } = req.query;

            let query = `
        SELECT b.*, s.service_name, s.duration_minutes,
               v.registration_number, v.manufacture_year,
               vb.vehicle_brand_name, vm.vehicle_model_name,
               ts.slot_date, ts.start_time, ts.end_time,
               t.user_id as tech_user_id, 
               u.user_first_name as tech_first_name,
               u.user_last_name as tech_last_name
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN vehicles v ON b.vehicle_id = v.vehicle_id
        JOIN vehicle_brands vb ON v.vehicle_brand_id = vb.vehicle_brand_id
        JOIN vehicle_models vm ON v.vehicle_model_id = vm.vehicle_model_id
        JOIN time_slots ts ON b.time_slot_id = ts.time_slot_id
        LEFT JOIN technicians t ON b.technician_id = t.technician_id
        LEFT JOIN users u ON t.user_id = u.user_id
        WHERE b.customer_id = $1
      `;

            const params = [customerId];

            if (status) {
                query += ' AND b.booking_status = $2';
                params.push(status);
            }

            query += ' ORDER BY b.scheduled_date_time DESC LIMIT $' +
                (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(limit, offset);

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

    // Update booking status (Manager/Technician)
    updateBookingStatus: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { bookingId } = req.params;
            const { status, notes } = req.body;

            // Update booking status
            await client.query(
                'UPDATE bookings SET booking_status = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2',
                [status, bookingId]
            );

            // Add status history
            await client.query(
                `INSERT INTO booking_statuses (booking_id, status, notes, updated_by_user_id)
         VALUES ($1, $2, $3, $4)`,
                [bookingId, status, notes, req.user.user_id]
            );

            // If status is "In Progress", set actual start time
            if (status === 'In Progress') {
                await client.query(
                    'UPDATE bookings SET actual_start_time = CURRENT_TIMESTAMP WHERE booking_id = $1',
                    [bookingId]
                );
            }

            // If status is "Completed", set actual end time
            if (status === 'Completed') {
                await client.query(
                    'UPDATE bookings SET actual_end_time = CURRENT_TIMESTAMP WHERE booking_id = $1',
                    [bookingId]
                );
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Booking status updated successfully'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            res.status(400).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    // Assign technician to booking (Manager)
    assignTechnician: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { technicianId } = req.body;

            // Check if technician is available
            const techCheck = await pool.query(
                'SELECT * FROM technicians WHERE technician_id = $1 AND is_available = true',
                [technicianId]
            );

            if (techCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Technician not available' });
            }

            await pool.query(
                'UPDATE bookings SET technician_id = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2',
                [technicianId, bookingId]
            );

            res.json({
                success: true,
                message: 'Technician assigned successfully'
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Cancel booking
    cancelBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const customerId = req.user.customer_id;

            await pool.query(
                `UPDATE bookings SET booking_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP 
                 WHERE booking_id = $1 AND customer_id = $2`,
                [bookingId, customerId]
            );

            res.json({ success: true, message: 'Booking cancelled successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Reschedule booking
    rescheduleBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { timeSlotId } = req.body;
            const customerId = req.user.customer_id;

            // Simple update for now
            await pool.query(
                `UPDATE bookings SET time_slot_id = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE booking_id = $2 AND customer_id = $3`,
                [timeSlotId, bookingId, customerId]
            );

            res.json({ success: true, message: 'Booking rescheduled successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Get all bookings (Manager)
    getAllBookings: async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get booking by ID
    getBookingById: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const result = await pool.query('SELECT * FROM bookings WHERE booking_id = $1', [bookingId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Approve booking
    approveBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            await pool.query(
                "UPDATE bookings SET booking_status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1",
                [bookingId]
            );
            res.json({ success: true, message: 'Booking approved' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Reject booking
    rejectBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            await pool.query(
                "UPDATE bookings SET booking_status = 'Rejected', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1",
                [bookingId]
            );
            res.json({ success: true, message: 'Booking rejected' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Get technician jobs
    getTechnicianJobs: async (req, res) => {
        try {
            const technicianId = req.user.technician_id;
            const result = await pool.query(
                'SELECT * FROM bookings WHERE technician_id = $1 ORDER BY scheduled_date_time ASC',
                [technicianId]
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Add service notes
    addServiceNotes: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { notes } = req.body;
            await pool.query(
                'UPDATE bookings SET special_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE booking_id = $2',
                [notes, bookingId]
            );
            res.json({ success: true, message: 'Service notes added' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = bookingController;