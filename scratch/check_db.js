const database = require('../database');
const User = require('../models/User');

async function checkUsers() {
    try {
        await database.waitForReady();
        const users = await User.find();
        console.log('Total users:', users.length);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email})`);
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit(0);
    }
}

checkUsers();
