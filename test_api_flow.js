const fetch = require('node-fetch'); // Needs node-fetch

async function testFlow() {
    const email = 'testuser' + Date.now() + '@gmail.com';
    const baseUrl = 'http://localhost:3000';
    
    console.log(`1. Sending OTP to ${email}...`);
    let res = await fetch(`${baseUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    
    let result = await res.json();
    console.log('Send OTP Response:', result);
    
    // We need to fetch the OTP from the database because we can't extract it from email in this script
    const sqlite3 = require('sqlite3');
    const db = new sqlite3.Database('./data/1gen-chat-by-ai.db');
    
    db.get('SELECT code FROM otps WHERE email = ? ORDER BY createdAt DESC LIMIT 1', [email], async (err, row) => {
        if (err || !row) {
            console.error('Failed to get OTP from DB', err);
            process.exit(1);
        }
        
        const code = row.code;
        console.log(`2. Retrieved OTP from DB: ${code}`);
        
        console.log(`3. Verifying OTP...`);
        let vRes = await fetch(`${baseUrl}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp: code })
        });
        
        let vResult = await vRes.json();
        console.log('Verify OTP Response:', vResult);
        
        if (vRes.ok) {
            console.log(`4. Completing Registration...`);
            let regRes = await fetch(`${baseUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test flow',
                    email,
                    password: 'Password123!',
                    interests: 'usa'
                })
            });
            let regResult = await regRes.json();
            console.log('Register Response:', regResult);
        }
        
    });
}
testFlow();
