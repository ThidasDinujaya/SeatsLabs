const pool = require('./config/database');
const bcrypt = require('bcryptjs');

const checkUsers = async () => {
    try {
        const res = await pool.query('SELECT user_email, user_password_hash FROM users');
        console.log('--- Current Users in DB ---');
        res.rows.forEach(user => {
            console.log(`Email: ${user.user_email}`);
            console.log(`Hash: ${user.user_password_hash}`);
        });

        const testPass = 'manager123';
        for (let user of res.rows) {
            const match = await bcrypt.compare(testPass, user.user_password_hash);
            console.log(`Testing '${testPass}' against ${user.user_email}: ${match ? 'MATCH' : 'FAIL'}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
