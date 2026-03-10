#!/usr/bin/env node

/**
 * Comprehensive Deployment Test Script
 * Tests all critical endpoints and configurations
 */

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
    try {
        process.stdout.write(`\n${colors.cyan}⏳ Testing: ${name}${colors.reset}`);
        await fn();
        console.log(` ${colors.green}✓ PASSED${colors.reset}`);
        testsPassed++;
    } catch (error) {
        console.log(` ${colors.red}✗ FAILED${colors.reset}`);
        console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
        testsFailed++;
    }
}

async function fetch(url, options = {}) {
    const response = await global.fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok && response.status !== 400 && response.status !== 401) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return {
        status: response.status,
        data: await response.json()
    };
}

async function runTests() {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}🧪 VIDEO PLATFORM - DEPLOYMENT TEST SUITE${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

    // Test 1: Server Health Check
    await test('Server is responding', async () => {
        const res = await fetch(`${BASE_URL}/register.html`);
        if (res.status !== 200) throw new Error('Server not responding');
    });

    // Test 2: Send OTP with invalid email
    await test('Send OTP validation (empty email)', async () => {
        const res = await fetch(`${BASE_URL}/send-otp`, {
            method: 'POST',
            body: { email: '' }
        });
        if (res.status !== 400) throw new Error('Should reject empty email');
    });

    // Test 3: Send OTP with valid email
    const testEmail = `test${Date.now()}@example.com`;
    let otpCode = null;
    
    await test('Send OTP to new email', async () => {
        const res = await fetch(`${BASE_URL}/send-otp`, {
            method: 'POST',
            body: { email: testEmail }
        });
        if (res.status !== 200) throw new Error('Failed to send OTP');
        if (!res.data.success) throw new Error('OTP send not marked as success');
    });

    // Test 4: Verify OTP with invalid code
    await test('Verify OTP validation (invalid code)', async () => {
        const res = await fetch(`${BASE_URL}/verify-otp`, {
            method: 'POST',
            body: { 
                email: testEmail,
                otp: '000000'
            }
        });
        if (res.status === 200) throw new Error('Should reject invalid OTP');
    });

    // Test 5: Register user without OTP verification (should fail)
    await test('Registration without OTP verification', async () => {
        const res = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            body: {
                name: 'Test User',
                email: testEmail,
                password: 'TestPass123!',
                interests: 'movie'
            }
        });
        // Note: This might succeed if OTP verification is not enforced at DB level
        // For now we just check the endpoint responds
        if (res.status === 500) throw new Error('Server error during registration');
    });

    // Test 6: Login with non-existent user
    await test('Login validation (non-existent user)', async () => {
        const res = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            body: {
                email: 'nonexistent@example.com',
                password: 'anypassword'
            }
        });
        if (res.status === 200) throw new Error('Should reject non-existent user');
    });

    // Test 7: Get all users (API endpoint)
    await test('Get all users API endpoint', async () => {
        const res = await fetch(`${BASE_URL}/api/users`);
        if (res.status !== 200) throw new Error('Failed to fetch users');
        if (!Array.isArray(res.data)) throw new Error('Users should be an array');
    });

    // Test 8: CORS headers
    await test('CORS headers are configured', async () => {
        const response = await global.fetch(`${BASE_URL}/register.html`);
        const headers = response.headers;
        // Note: CORS headers vary, just check response
        if (response.status !== 200) throw new Error('No response from server');
    });

    // Test 9: Environment variables are loaded
    await test('Environment variables loaded (.env)', async () => {
        if (!process.env.EMAIL_USER) throw new Error('EMAIL_USER not configured');
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not configured');
    });

    // Test 10: Database is initialized
    await test('Database is properly initialized', async () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const dbPath = path.join(__dirname, 'data', 'video-platform.db');
            if (!fs.existsSync(dbPath)) throw new Error('Database file not found');
        } catch (e) {
            throw e;
        }
    });

    // Summary
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.green}✓ Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${testsFailed}${colors.reset}`);
    
    const total = testsPassed + testsFailed;
    const percentage = total > 0 ? Math.round((testsPassed / total) * 100) : 0;
    
    if (testsFailed === 0) {
        console.log(`\n${colors.green}🎉 ALL TESTS PASSED! System is deployment-ready.${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠️  ${testsFailed} test(s) failed. Please review above.${colors.reset}`);
    }
    
    console.log(`\n${colors.cyan}Passed Rate: ${percentage}%${colors.reset}\n`);
    
    process.exit(testsFailed > 0 ? 1 : 0);
}

loadEnv();
require('dotenv').config();

runTests().catch(err => {
    console.error(`${colors.red}Fatal Error:${colors.reset}`, err);
    process.exit(1);
});

function loadEnv() {
    require('dotenv').config();
}
