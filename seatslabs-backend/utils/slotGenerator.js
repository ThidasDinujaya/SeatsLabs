const pool = require('../config/database');

/**
 * Utility to generate time slots for a given date
 * Slots are from 08:00 to 17:00, 1 hour each
 */
const generateSlotsForDate = async (dateStr) => {
    const slots = [
        '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
    ];

    for (const start of slots) {
        const [hour, min] = start.split(':');
        const endHour = parseInt(hour) + 1;
        const end = `${endHour.toString().padStart(2, '0')}:${min}`;

        try {
            await pool.query(
                `INSERT INTO "TimeSlots" ("timeSlotDate", "timeSlotStartTime", "timeSlotEndTime", "timeSlotMaxCapacity") 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT ("timeSlotDate", "timeSlotStartTime") DO NOTHING`,
                [dateStr, start, end, 3] // Capacity of 3 per hour
            );
        } catch (err) {
            console.error(`Error creating slot ${start} on ${dateStr}:`, err.message);
        }
    }
};

const seedSlots = async (days = 30) => {
    console.log(`Seeding slots for the next ${days} days...`);
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        await generateSlotsForDate(dateStr);
    }
    console.log('Slots seeded successfully!');
};

module.exports = { seedSlots };
