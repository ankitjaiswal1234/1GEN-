const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const database = require('./database');

async function checkAdmins() {
    try {
        console.log('🔍 Checking MongoDB for admin records...');
        
        await database.waitForReady();
        
        const admins = await Admin.find();
        
        if (admins && admins.length > 0) {
            console.log(`\n✓ ${admins.length} Admin Record(s) Found:\n`);
            admins.forEach((admin, index) => {
                console.log(`Admin ${index + 1}:`);
                console.log(`  ID: ${admin._id}`);
                console.log(`  Name: ${admin.name}`);
                console.log(`  Email: ${admin.email}`);
                console.log(`  Permissions: ${JSON.stringify(admin.permissions)}`);
                console.log(`  Created: ${admin.createdAt}\n`);
            });
        } else {
            console.log('⚠ No admin records found in database');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking admins:', err);
        process.exit(1);
    }
}

checkAdmins();
