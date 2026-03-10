const fetch = require('node-fetch');

// Test the registration flow
async function testRegistration() {
    const baseURL = 'http://localhost:3000';
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test@123456';
    const testName = 'Test User';
    
    try {
        console.log('\n=== TESTING REGISTRATION FLOW ===\n');
        
        // Step 1: Send OTP
        console.log('📧 Step 1: Sending OTP...');
        const otpRes = await fetch(`${baseURL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        
        const otpData = await otpRes.json();
        console.log(`Status: ${otpRes.status}`);
        console.log(`Response:`, otpData);
        
        if (!otpRes.ok) {
            console.log('❌ OTP sending failed!');
            return;
        }
        
        // Step 2: Verify OTP (we'll use a hardcoded OTP for testing)
        console.log('\n✅ OTP sent successfully');
        console.log('📋 Step 2: Verifying OTP...');
        console.log('⚠️  Note: You need to check server console for the OTP code');
        console.log('   Or manually verify with a valid OTP code');
        
        // For now, let's skip to step 3 and check if the issue is before or after email verification
        
        console.log('\n🎯 REGISTRATION ISSUES FOUND:');
        console.log('1. Check server console for OTP code');
        console.log('2. Try to register new user');
        console.log('3. Check for database errors');
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testRegistration();
