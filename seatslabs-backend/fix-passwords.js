const pool = require('./config/database');
const bcrypt = require('bcryptjs');

const updatePasswords = async () => {
    try {
        const managerPass = await bcrypt.hash('manager123', 10);
        const techPass = await bcrypt.hash('tech123', 10);
        const adPass = await bcrypt.hash('ad123', 10);
        const customerPass = await bcrypt.hash('customer123', 10);

        await pool.query('UPDATE users SET user_password_hash = $1 WHERE user_email = $2', [managerPass, 'manager@seatslabs.com']);
        await pool.query('UPDATE users SET user_password_hash = $1 WHERE user_email = $2', [techPass, 'tech@seatslabs.com']);
        await pool.query('UPDATE users SET user_password_hash = $1 WHERE user_email = $2', [adPass, 'ad@seatslabs.com']);
        await pool.query('UPDATE users SET user_password_hash = $1 WHERE user_email = $2', [customerPass, 'customer@seatslabs.com']);

        console.log('✅ Passwords updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updatePasswords();
