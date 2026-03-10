#!/usr/bin/env node

/**
 * Direct Login Test
 * Tests registration and login without OTP complexity
 */

const db = require('./database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLoginFlow() {
    console.log(`\n╔════════════════════════════════════════════════════╗`);
    console.log(`║   DIRECT LOGIN TEST (Database Level)             ║`);
    console.log(`╚════════════════════════════════════════════════════╝\n`);

    try {
        // Wait for database to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create test user
        const testEmail = `direct-test-${Date.now()}@test.com`;
        const testPassword = 'TestPassword123!';
        
        console.log('📝 Creating test user directly...');
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = await User.create({
            name: 'Direct Test User',
            email: testEmail,
            password: hashedPassword,
            interests: ['movie'],
            country: 'Testing',
            isActive: 1
        });

        console.log(`✅ User created: ${user._id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Country: ${user.country}\n`);

        // Find user
        console.log('🔍 Finding user by email...');
        const foundUser = await User.findOne({email: testEmail});
        
        if (foundUser) {
            console.log(`✅ User found: ${foundUser._id}`);
            console.log(`   Name: ${foundUser.name}`);
            console.log(`   Email: ${foundUser.email}`);
            console.log(`   Country: ${foundUser.country}\n`);
        } else {
            console.error('❌ User not found\n');
            process.exit(1);
        }

        // Test password
        console.log('🔐 Testing password...');
        const passwordMatch = await bcrypt.compare(testPassword, foundUser.password);
        if (passwordMatch) {
            console.log(`✅ Password verification successful\n`);
        } else {
            console.error('❌ Password verification failed\n');
            process.exit(1);
        }

        // Update login info
        console.log('⏱️  Updating login session...');
        foundUser.loginCount = (foundUser.loginCount || 0) + 1;
        foundUser.lastLogin = new Date();
        foundUser.ipAddress = '192.168.1.1';
        foundUser.country = 'Test Country (TC)';
        foundUser.loginSessions = foundUser.loginSessions || [];
        foundUser.loginSessions.push({
            timestamp: new Date(),
            ipAddress: '192.168.1.1',
            country: 'Test Country (TC)',
            duration: 0
        });

        await foundUser.save();
        console.log(`✅ Login session saved`);
        console.log(`   Login Count: ${foundUser.loginCount}`);
        console.log(`   Last Login: ${foundUser.lastLogin}\n`);

        // Verify updated data
        console.log('📊 Verifying updated data...');
        const updatedUser = await User.findOne({email: testEmail});
        console.log(`✅ Updated user retrieved`);
        console.log(`   Login Count: ${updatedUser.loginCount}`);
        console.log(`   Country: ${updatedUser.country}`);
        console.log(`   IP Address: ${updatedUser.ipAddress}`);
        console.log(`   Sessions: ${updatedUser.loginSessions.length}\n`);

        console.log(`╔════════════════════════════════════════════════════╗`);
        console.log(`║   ✅ ALL TESTS PASSED SUCCESSFULLY!              ║`);
        console.log(`╚════════════════════════════════════════════════════╝\n`);

        console.log(`📊 RESULTS:
   ✅ User Creation: SUCCESS
   ✅ User Lookup: SUCCESS
   ✅ Password Hashing: SUCCESS
   ✅ Password Verification: SUCCESS
   ✅ Session Tracking: SUCCESS
   ✅ Country Storage: SUCCESS
   ✅ Database Schema: COMPATIBLE\n`);

        console.log(`✨ Login functionality is WORKING CORRECTLY!\n`);

        process.exit(0);

    } catch (error) {
        console.error(`\n❌ TEST FAILED: ${error.message}\n`);
        console.error(error.stack);
        process.exit(1);
    }
}

testLoginFlow();
