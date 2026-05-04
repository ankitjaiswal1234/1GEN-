const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 as the first choice for DNS lookups to avoid ENETUNREACH (IPv6) errors on cloud hosts like Render
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// Configure your email service here
// For Gmail, you'll need to use an App Password or enable Less Secure App Access
// For other providers, update accordingly

const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;

// On Render, we aggressively force Port 587 and IPv4 to avoid common network reachability issues




// SMTP configuration
const smtpConfig = {
    service: 'gmail', // Using the built-in service helper for Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    dnsTimeout: 15000
};

// Lazy transporter initialization to support test account when credentials are missing
let transporterInstance = null;
async function getTransporter() {
    if (transporterInstance) return transporterInstance;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        transporterInstance = nodemailer.createTransport(smtpConfig);
    } else {
        console.warn('⚠️ EMAIL credentials not set. Creating Ethereal test account for development.');
        const testAccount = await nodemailer.createTestAccount();
        transporterInstance = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('📧 Ethereal test account created. Preview URL will be logged after sending emails.');
    }
    console.log('📧 Email transporter configured:', JSON.stringify(transporterInstance.options || smtpConfig, null, 2));
    return transporterInstance;
}

// Get the base URL for emails
const getBaseUrl = () => {
    if (process.env.RENDER_EXTERNAL_URL) {
        return process.env.RENDER_EXTERNAL_URL;
    }
    return `http://localhost:${process.env.PORT || 3000}`;
};

// Verify connection on startup with more detail
// Verify connection on startup with more detail using lazy transporter
(async () => {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log('✓ Email Service Connectivity Verified');
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ EMAIL SERVICE CONNECTION FAILED');
    console.log('Error Code:', error.code || 'N/A');
    console.log('Error Message:', error.message || 'Unknown error');
    console.log('Host/Port:', (error.host || process.env.EMAIL_HOST || 'smtp.gmail.com') + ':' + (error.port || process.env.EMAIL_PORT || 465));
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
})();


// Fallback to console logging if email is not configured properly
const sendEmail = async (to, subject, htmlContent, textContent) => {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            console.error('❌ CRITICAL: Email credentials missing in production environment!');
            throw new Error('Email service is not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
        }

        // If not configured in development, log to console and continue using test account
        console.log('⚠️ Email Service Not Configured! Using Ethereal test account (Development Mode).');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content Summary:', textContent.substring(0, 100) + '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        // Do not return; allow getTransporter to create test account
    }

    try {
        // Initialize transporter (real or test)
        const transporter = await getTransporter();
        const result = await transporter.sendMail({
            from: process.env.EMAIL_USER || transporter.options.auth.user,
            to,
            subject,
            text: textContent,
            html: htmlContent
        });
        console.log('✓ Email sent successfully:', result.messageId);
        // If using Ethereal, log preview URL
        if (result.previewUrl) {
            console.log('📩 Preview URL:', result.previewUrl);
        }
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('✗ Error sending email:', error);
        if (error.response) console.error('SMTP response:', error.response);
        if (error.stack) console.error('Stack trace:', error.stack);
        const errorDetails = {
            message: error.message,
            code: error.code,
            command: error.command,
            address: error.address,
            port: error.port,
            host: error.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
            response: error.response,
            stack: error.stack
        };
        console.error('Error Details:', JSON.stringify(errorDetails, null, 2));
        throw new Error(`Email failed: ${error.message} (${error.code || 'NO_CODE'})`);
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
                    <h1>🎥 1GEN CHAT WITH AI</h1>
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
                    <p>&copy; 2026 1GEN CHAT WITH AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
    🎥 1GEN CHAT WITH AI - Email Verification

    Verify Your Email Address

    Your Verification Code: ${otp}

    This code will expire in ${expireTime}.

    If you didn't request this verification code, please ignore this email.

    Security Notice: Never share your OTP with anyone. We will never ask for it.

    © 2026 1GEN CHAT WITH AI. All rights reserved.
    `;

    return sendEmail(email, '🔐 Verify Your Email - 1GEN CHAT WITH AI', htmlContent, textContent);
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
                    <h1>🎥 1GEN CHAT WITH AI</h1>
                    <p>Welcome!</p>
                </div>
                <div class="content">
                    <h2>Welcome, ${name}! 🎉</h2>
                    <p>Your account has been successfully created and verified. You can now start connecting with others.</p>
                    
                    <p style="text-align: center;">
                        <a href="${getBaseUrl()}/login.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0;">
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
                    <p>&copy; 2026 1GEN CHAT WITH AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
    🎥 1GEN CHAT WITH AI - Welcome

    Welcome, ${name}! 🎉

    Your account has been successfully created and verified. You can now start connecting with others.

    Visit: ${getBaseUrl()}/login.html

    © 2026 1GEN CHAT WITH AI. All rights reserved.
    `;

    return sendEmail(email, '🎉 Welcome to 1GEN CHAT WITH AI!', htmlContent, textContent);
};

// Send Password Reset Email
const sendPasswordResetEmail = async (email, token) => {
    const resetUrl = `${getBaseUrl()}/reset-password.html?token=${token}`;

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
                    <h1>🎥 1GEN CHAT WITH AI</h1>
                    <p>Password Reset</p>
                </div>
                <div class="content">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the button below to set a new password:</p>
                    
                    <p style="text-align: center;">
                        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin: 20px 0;">
                            Reset Password
                        </a>
                    </p>
                    
                    <p style="color: #666; font-size: 0.9em;">
                        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>For security, never share your reset link with anyone.</p>
                    <p>&copy; 2026 1GEN CHAT WITH AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
    🎥 1GEN CHAT WITH AI - Password Reset

    Reset Your Password

    We received a request to reset your password. Use the link below to set a new password:

    ${resetUrl}

    This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.

    © 2026 1GEN CHAT WITH AI. All rights reserved.
    `;

    return sendEmail(email, '🔐 Reset Your Password - 1GEN CHAT WITH AI', htmlContent, textContent);
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendEmail
};
