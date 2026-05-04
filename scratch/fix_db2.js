const { Sequelize } = require('sequelize');
const path = require('path');

async function fixDB() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    
    // Import database and models using correct paths
    const database = require('../database');
    const Admin = require('../models/Admin');

    console.log('Waiting for database ready and sync...');
    await database.waitForReady();
    
    // Explicitly sync the Admin model
    await Admin.sync({ alter: true });
    
    // Set a known admin in the active database
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('123qweasE@ADMIN', 10);
    
    // Upsert admin to ensure it exists with correct password
    const [admin, created] = await Admin.findOrCreate({
        where: { email: 'admin@1gen.chat' },
        defaults: {
            name: 'System Admin',
            password: hash,
            role: 'admin',
            permissions: ["view-users", "view-sessions", "manage-users"]
        }
    });

    if (!created) {
        admin.password = hash;
        admin.email = 'admin@1gen.chat'; // Ensure it's this one
        await admin.save();
        console.log('Updated existing admin password and email');
    } else {
        console.log('Created new admin account');
    }

    console.log('Database fix completed successfully.');
    process.exit(0);
}

fixDB().catch(err => {
    console.error('Error during database fix:', err);
    process.exit(1);
});
