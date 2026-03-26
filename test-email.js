require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function test() {
    console.log('Testing email to: peatallen23@gmail.com');
    try {
        const res = await sendOTPEmail('peatallen23@gmail.com', '123456');
        console.log('Success:', res);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
