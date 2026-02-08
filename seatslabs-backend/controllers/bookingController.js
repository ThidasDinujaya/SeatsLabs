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

            const customerId = req.user.customerId;

            // Check time slot availability
            const slotCheck = await client.query(
                'SELECT * FROM "TimeSlots" WHERE "timeSlotId" = $1 AND "timeSlotIsAvailable" = true',
                [timeSlotId]
            );

            if (slotCheck.rows.length === 0) {
                throw new Error('Time slot not available');
            }

            const slot = slotCheck.rows[0];
            if (slot.timeSlotCurrentBookings >= slot.timeSlotMaxCapacity) {
                throw new Error('Time slot is fully booked');
            }

            // Get service details for pricing
            const serviceResult = await client.query(
                'SELECT * FROM "Services" WHERE "serviceId" = $1',
                [serviceId]
            );
            const service = serviceResult.rows[0];

            // Generate booking reference
            const bookingReference = generateBookingReference();

            // Create booking
            const scheduledDateTime = new Date(
                `${slot.timeSlotDate}T${slot.timeSlotStartTime}`
            );

            const bookingResult = await client.query(
                `INSERT INTO "Bookings" 
        ("customerId", "vehicleId", "serviceId", "timeSlotId", "bookingReference", 
         "bookingScheduledDateTime", "bookingStatus", "bookingSpecialNotes", "bookingEstimatedPrice")
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
                    service.serviceBasePrice
                ]
            );

            const booking = bookingResult.rows[0];

            // Update time slot
            await client.query(
                'UPDATE "TimeSlots" SET "timeSlotCurrentBookings" = "timeSlotCurrentBookings" + 1 WHERE "timeSlotId" = $1',
                [timeSlotId]
            );

            // Create initial status
            await client.query(
                `INSERT INTO "BookingStatuses" ("bookingId", "bookingStatusStatus", "bookingStatusNotes", "bookingStatusUpdatedByUserId")
         VALUES ($1, $2, $3, $4)`,
                [booking.bookingId, 'Pending', 'Booking created', req.user.userId]
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

    // Get all Bookings for customer
    getCustomerBookings: async (req, res) => {
        try {
            const customerId = req.user.customerId;
            const { status, limit = 10, offset = 0 } = req.query;

            let query = `
        SELECT b.*, s."serviceName", s."serviceDurationMinutes",
               v."vehicleRegistrationNumber", v."vehicleManufactureYear",
               vb."vehicleBrandName", vm."vehicleModelName",
               ts.timeSlotSlotDate, ts."timeSlotStartTime", ts."timeSlotEndTime",
               t."userId" as tech_userId, 
               u."userFirstName" as tech_first_name,
               u."userLastName" as tech_last_name
        FROM "Bookings" b
        JOIN "Services" s ON b."serviceId" = s."serviceId"
        JOIN "Vehicles" v ON b."vehicleId" = v."vehicleId"
        JOIN "VehicleBrands" vb ON v."vehicleBrandId" = vb."vehicleBrandId"
        JOIN "VehicleModels" vm ON v."vehicleModelId" = vm."vehicleModelId"
        JOIN "TimeSlots" ts ON b."timeSlotId" = ts."timeSlotId"
        LEFT JOIN "Technicians" t ON b."technicianId" = t."technicianId"
        LEFT JOIN "Users" u ON t."userId" = u."userId"
        WHERE b."customerId" = $1
      `;

            const params = [customerId];

            if (status) {
                query += ' AND b.bookingStatus = $2';
                params.push(status);
            }

            query += ' ORDER BY b.bookingScheduledDateTime DESC LIMIT $' +
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
            const { status, bookingStatusNotes } = req.body;

            // Update booking status
            await client.query(
                'UPDATE "Bookings" SET "bookingStatus" = $1, "bookingUpdatedAt" = CURRENT_TIMESTAMP WHERE "bookingId" = $2',
                [status, bookingId]
            );

            // Add status history
            await client.query(
                `INSERT INTO "BookingStatuses" ("bookingId", "bookingStatusStatus", "bookingStatusNotes", "bookingStatusUpdatedByUserId")
         VALUES ($1, $2, $3, $4)`,
                [bookingId, status, bookingStatusNotes, req.user.userId]
            );

            // If status is "In Progress", set actual start time
            if (status === 'In Progress') {
                await client.query(
                    'UPDATE "Bookings" SET "bookingActualStartTime" = CURRENT_TIMESTAMP WHERE "bookingId" = $1',
                    [bookingId]
                );
            }

            // If status is "Completed", set actual end time
            if (status === 'Completed') {
                await client.query(
                    'UPDATE "Bookings" SET "bookingActualEndTime" = CURRENT_TIMESTAMP WHERE "bookingId" = $1',
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
                'SELECT * FROM "Technicians" WHERE "technicianId" = $1 AND "technicianIsAvailable" = true',
                [technicianId]
            );

            if (techCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Technician not available' });
            }

            await pool.query(
                'UPDATE "Bookings" SET "technicianId" = $1, "bookingUpdatedAt" = CURRENT_TIMESTAMP WHERE "bookingId" = $2',
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
            const customerId = req.user.customerId;

            await pool.query(
                `UPDATE "Bookings" SET "bookingStatus" = 'Cancelled', "bookingUpdatedAt" = CURRENT_TIMESTAMP 
                 WHERE "bookingId" = $1 AND "customerId" = $2`,
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
            const customerId = req.user.customerId;

            // Simple update for now
            await pool.query(
                `UPDATE "Bookings" SET "timeSlotId" = $1, "bookingUpdatedAt" = CURRENT_TIMESTAMP 
                 WHERE "bookingId" = $2 AND "customerId" = $3`,
                [timeSlotId, bookingId, customerId]
            );

            res.json({ success: true, message: 'Booking rescheduled successfully' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Get all Bookings (Manager)
    getAllBookings: async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT b.*, 
                       u."userFirstName" as customer_first_name, u."userLastName" as customer_last_name,
                       s."serviceName", v."vehicleRegistrationNumber",
                       tu."userFirstName" as tech_first_name, tu."userLastName" as tech_last_name
                FROM "Bookings" b
                LEFT JOIN "Customers" c ON b."customerId" = c."customerId"
                LEFT JOIN "Users" u ON c."userId" = u."userId"
                LEFT JOIN "Services" s ON b."serviceId" = s."serviceId"
                LEFT JOIN "Vehicles" v ON b."vehicleId" = v."vehicleId"
                LEFT JOIN "Technicians" t ON b."technicianId" = t."technicianId"
                LEFT JOIN "Users" tu ON t."userId" = tu."userId"
                ORDER BY b."bookingScheduledDateTime" DESC
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Get booking by ID
    getBookingById: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const result = await pool.query('SELECT * FROM "Bookings" WHERE "bookingId" = $1', [bookingId]);
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
                "UPDATE Bookings SET bookingStatus = 'Approved', bookingUpdatedAt = CURRENT_TIMESTAMP WHERE bookingId = $1",
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
                "UPDATE Bookings SET bookingStatus = 'Rejected', bookingUpdatedAt = CURRENT_TIMESTAMP WHERE bookingId = $1",
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
            const technicianId = req.user.technicianId;
            const result = await pool.query(
                'SELECT * FROM "Bookings" WHERE "technicianId" = $1 ORDER BY "bookingScheduledDateTime" ASC',
                [technicianId]
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Add service bookingStatuseNotes
    addServiceNotes: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { bookingStatusNotes } = req.body;
            await pool.query(
                'UPDATE "Bookings" SET "bookingSpecialNotes" = $1, "bookingUpdatedAt" = CURRENT_TIMESTAMP WHERE "bookingId" = $2',
                [bookingStatusNotes, bookingId]
            );
            res.json({ success: true, message: 'Service bookingStatuseNotes added' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
    // Get available slots for a date
    // Get available slots for a date
    getAvailableSlots: async (req, res) => {
        try {
            const { date } = req.query;
            const result = await pool.query(
                `SELECT * FROM "TimeSlots" 
                 WHERE "timeSlotDate" = $1 
                 AND "timeSlotIsAvailable" = true 
                 AND "timeSlotCurrentBookings" < "timeSlotMaxCapacity"
                 ORDER BY "timeSlotStartTime"`,
                [date]
            );
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = bookingController;