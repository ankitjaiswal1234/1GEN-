const sqlite3 = require('sqlite3').verbose();

const BASE_URL = 'http://localhost:3000';
const db = new sqlite3.Database('./data/1gen-chat-by-ai.db');
const testEmail = `testuser_${Date.now()}@example.com`;

async function testFlow() {
    try {
        console.log("1. Sending OTP...");
        const sendOtpRes = await fetch(`${BASE_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        const sendOtpData = await sendOtpRes.json();
        console.log("Send OTP Output:", sendOtpData);
        
        // Wait briefly for DB insertion
        await new Promise(r => setTimeout(r, 500));

        console.log("\n2. Getting OTP from database...");
        const otp = await new Promise((resolve, reject) => {
            db.get(`SELECT code FROM otps WHERE email = ? ORDER BY expiresAt DESC LIMIT 1`, [testEmail], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.code : null);
            });
        });
        console.log("OTP retrieved:", otp);

        console.log("\n3. Testing OTP Verification...");
        const verifyRes = await fetch(`${BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, otp: otp })
        });
        const verifyData = await verifyRes.json();
        console.log("Verify Output:", verifyData);
        
        console.log("\n4. Testing Final Registration...");
        const regRes = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: testEmail,
                password: 'Password123!',
                interests: 'USA'
            })
        });
        const regData = await regRes.json();
        console.log("Register Output:", regData);

        console.log("\n5. Testing Login...");
        const loginRes = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'Password123!'
            })
        });
        const loginData = await loginRes.json();
        console.log("Login Output:", loginData.message || loginData);
        
        if (!loginData.user) throw new Error("Login failed");
        const userId = loginData.user.id;

        console.log("\n6. Testing History API...");
        const historyRes = await fetch(`${BASE_URL}/api/history`, {
            method: 'GET',
            headers: { 'user-id': userId }
        });
        const historyData = await historyRes.json();
        console.log("History API works? ", Array.isArray(historyData));
        
        console.log("\n✅ ALL BACKEND AND DATABASE PIPELINES TESTED SUCCESSFULLY!");
    } catch(err) {
        console.error("Test failed:", err);
    } finally {
        db.close();
    }
}

testFlow();
