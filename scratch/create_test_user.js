const database = require('../database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestUser() {
    try {
        await database.waitForReady();
        
        const email = 'testuser@example.com';
        const password = 'Password123';
        const name = 'Test User';

        // Check if exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log('Test user already exists:', email);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        await User.create({
            name,
            email,
            password: hashedPassword,
            interests: ['study', 'random'],
            isVerified: 1
        });

        console.log('✅ Test user created successfully');
        console.log('📧 Email:', email);
        console.log('🔒 Password:', password);
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

createTestUser();
