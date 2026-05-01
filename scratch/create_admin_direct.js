const database = require('../database');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        await database.waitForReady();
        
        const email = 'admin@1gen.chat';
        const password = 'Admin@123';
        const name = 'System Admin';

        // Check if exists
        const existing = await Admin.findOne({ where: { email } });
        if (existing) {
            console.log('Admin already exists:', email);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await Admin.create({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            permissions: ["view-users", "view-sessions", "manage-users"]
        });

        console.log('✅ Admin created successfully');
        console.log('📧 Email:', email);
        console.log('🔒 Password:', password);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createAdmin();
