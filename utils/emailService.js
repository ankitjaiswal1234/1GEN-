const nodemailer = require('nodemailer');

// Configure your email service here
// For Gmail, you'll need to use an App Password or enable Less Secure App Access
// For other providers, update accordingly

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// Fallback to console logging if email is not configured properly
const sendEmail = async (to, subject, htmlContent, textContent) => {
    try {
        // Check if email credentials are configured
        if (process.env.EMAIL_USER === undefined || process.env.EMAIL_PASSWORD === undefined) {
            // If not configured, log to console (for development)
            console.log('📧 Email Service (Dev Mode - Not Configured)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Content:', textContent);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            return { success: true, devMode: true };
        }

        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: textContent,
            html: htmlContent
        });

        console.log('✓ Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('✗ Error sending email:', error.message);
        throw new Error('Failed to send email: ' + error.message);
    }
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
    const expireTime = '10 minutes';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .otp-code { background: #f8f9fa; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-code h2 { font-size: 2.5em; letter-spacing: 5px; color: #667eea; margin: 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
                .warning { color: #ff6b6b; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎥 Video Chat Platform</h1>
                    <p>Email Verification</p>
                </div>
                <div class="content">
                    <h2>Verify Your Email Address</h2>
                    <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>
                    
                    <div class="otp-code">
                        <p style="margin-top: 0; color: #666; font-size: 0.9em;">Your Verification Code:</p>
                        <h2>${otp}</h2>
                    </div>
                    
                    <p style="color: #666; font-size: 0.95em;">
                        <strong>This code will expire in ${expireTime}</strong>
                    </p>
                    
                    <p style="color: #666;">
                        If you didn't request this verification code, please ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p><strong>Security Notice:</strong> Never share your OTP with anyone. We will never ask for it.</p>
                    <p>&copy; 2026 Video Chat Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
    🎥 Video Chat Platform - Email Verification

    Verify Your Email Address

    Your Verification Code: ${otp}

    This code will expire in ${expireTime}.

    If you didn't request this verification code, please ignore this email.

    Security Notice: Never share your OTP with anyone. We will never ask for it.

    © 2026 Video Chat Platform. All rights reserved.
    `;

    return sendEmail(email, '🔐 Verify Your Email - Video Chat Platform', htmlContent, textContent);
};

// Send Welcome Email
const sendWelcomeEmail = async (email, name) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 0.9em; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎥 Video Chat Platform</h1>
                    <p>Welcome!</p>
                </div>
                <div class="content">
                    <h2>Welcome, ${name}! 🎉</h2>
                    <p>Your account has been successfully created and verified. You can now start connecting with others.</p>
                    
                    <p style="text-align: center;">
                        <a href="http://localhost:3000/login.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0;">
                            Go to Login
                        </a>
                    </p>
                    
                    <p style="color: #666;">
                        <strong>What you can do:</strong>
                    </p>
                    <ul style="color: #666;">
                        <li>Connect with users who share your interests</li>
                        <li>Start video calls instantly</li>
                        <li>Manage your profile and preferences</li>
                        <li>Enjoy a seamless video chatting experience</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <p>&copy; 2026 Video Chat Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
    🎥 Video Chat Platform - Welcome

    Welcome, ${name}! 🎉

    Your account has been successfully created and verified. You can now start connecting with others.

    Visit: http://localhost:3000/login.html

    © 2026 Video Chat Platform. All rights reserved.
    `;

    return sendEmail(email, '🎉 Welcome to Video Chat Platform!', htmlContent, textContent);
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendEmail
};
