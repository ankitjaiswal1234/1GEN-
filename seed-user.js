require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const database = require('./database');

async function createUser() {
    try {
        console.log('Waiting for database...');
        await database.waitForReady();
        
        const email = 'ankitjaiswalupd@gmail.com';
        const rawPassword = '123qweasE@';


        const existing = await User.findOne({email});
        if (existing) {
            console.log('User already exists. Updating password and verifying email...');
            const hash = await bcrypt.hash(rawPassword, 10);
            existing.password = hash;
            existing.emailVerified = 1;
            await existing.save();
            console.log('User updated successfully.');
        } else {
            console.log('Creating new user...');
            const hash = await bcrypt.hash(rawPassword, 10);
            await User.create({
                name: 'Ankit Jaiswal',
                email: email,
                password: hash,
                interests: ['Video Chat', 'Technology'],
                emailVerified: 1 // Bypass verification so user can login immediately
            });
            console.log('User created successfully.');
        }
    } catch(err) {
        console.error('Error seeding user:', err);
    } finally {
        // Give SQLite a moment to flush writes
        setTimeout(() => process.exit(0), 1000);
    }
}

createUser();
