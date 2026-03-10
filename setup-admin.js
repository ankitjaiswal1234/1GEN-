#!/usr/bin/env node

/**
 * Admin Setup Script
 * This script creates an initial admin account for the video platform
 * Run: node setup-admin.js
 */

const https = require('https');
const http = require('http');

// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrator';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

console.log('\n=== 🔧 Video Platform - Admin Setup Script ===\n');

// Helper function to make HTTP requests
function makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, SERVER_URL);
        const isHttps = url.protocol === 'https:';
        const requestLib = isHttps ? https : http;

        const options = {
            method: method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const request = requestLib.request(options, (response) => {
            let body = '';
            response.on('data', chunk => body += chunk);
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({
                        status: response.statusCode,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        status: response.statusCode,
                        data: body
                    });
                }
            });
        });

        request.on('error', reject);

        if (data) {
            request.write(JSON.stringify(data));
        }

        request.end();
    });
}

// Main setup function
async function setupAdmin() {
    try {
        console.log('📝 Creating admin account...');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Name: ${ADMIN_NAME}`);
        console.log(`   Server: ${SERVER_URL}\n`);

        // Step 1: Check if server is running
        try {
            await makeRequest('GET', '/');
        } catch (error) {
            console.error(`❌ Error: Cannot connect to server at ${SERVER_URL}`);
            console.error('📌 Make sure the server is running: npm start\n');
            process.exit(1);
        }

        // Step 2: Register admin
        const response = await makeRequest('POST', '/api/register-admin', {
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        if (response.status === 200 || response.status === 201) {
            console.log('✅ Admin account created successfully!\n');
            console.log('📋 Login Credentials:');
            console.log(`   URL: ${SERVER_URL}/admin-login.html`);
            console.log(`   Email: ${ADMIN_EMAIL}`);
            console.log(`   Password: ${ADMIN_PASSWORD}\n`);
            console.log('🎉 You can now login to the admin dashboard!\n');
        } else if (response.status === 400 && response.data.message?.includes('already exists')) {
            console.log('ℹ️  Admin account already exists.');
            console.log(`   Email: ${ADMIN_EMAIL}\n`);
            console.log('📌 You can login with your existing credentials.\n');
        } else {
            console.error(`❌ Error creating admin: ${response.data.message || 'Unknown error'}\n`);
            process.exit(1);
        }

    } catch (error) {
        console.error(`❌ Setup failed: ${error.message}\n`);
        process.exit(1);
    }
}

// Run setup
setupAdmin();
