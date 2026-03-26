const database = require('../database');
const crypto = require('crypto');

class OTP {
    static async create(email) {
        const _id = 'otp_' + Date.now();
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

        try {
            console.log(`📝 Creating OTP record for ${email}`);
            await database.run(
                'INSERT INTO otps (_id, email, code, expiresAt, verified) VALUES (?, ?, ?, ?, ?)',
                [_id, email, code, expiresAt.toISOString(), 0]
            );
            console.log(`✓ OTP record created: ${_id}`);
            return { _id, code, expiresAt };
        } catch (error) {
            console.error(`❌ Error creating OTP record: ${error.message}`);
            throw new Error('Error creating OTP: ' + error.message);
        }
    }

    static async findByEmailAndCode(email, code) {
        try {
            console.log(`🔍 Searching for OTP: email=${email}, code=${code}`);
            const otp = await database.get(
                'SELECT * FROM otps WHERE email = ? AND code = ? AND verified = 0 ORDER BY createdAt DESC LIMIT 1',
                [email, code]
            );
            
            if (!otp) {
                console.log(`⚠️ OTP NOT FOUND or already verified for ${email}`);
                return null;
            }

            // Check if OTP has expired
            const expiresAt = new Date(otp.expiresAt);
            const now = new Date();
            console.log(`🕒 OTP check: expiresAt=${otp.expiresAt}, current=${now.toISOString()}`);
            
            if (expiresAt < now) {
                console.log(`⚠️ OTP EXPIRED for ${email}`);
                return null; // OTP expired
            }

            console.log(`✓ Valid OTP found for ${email}`);
            return otp;
        } catch (error) {
            console.error(`❌ Error finding OTP: ${error.message}`);
            throw new Error('Error finding OTP: ' + error.message);
        }
    }

    static async verify(email, code) {
        try {
            const otp = await this.findByEmailAndCode(email, code);
            
            if (!otp) {
                throw new Error('Invalid or expired OTP');
            }

            // Mark as verified
            await database.run(
                'UPDATE otps SET verified = 1 WHERE _id = ?',
                [otp._id]
            );

            return true;
        } catch (error) {
            throw new Error('Error verifying OTP: ' + error.message);
        }
    }

    static async deleteExpired() {
        try {
            await database.run(
                'DELETE FROM otps WHERE expiresAt < datetime("now")'
            );
        } catch (error) {
            console.error('Error deleting expired OTPs:', error.message);
        }
    }

    static async getByEmail(email) {
        try {
            const otp = await database.get(
                'SELECT * FROM otps WHERE email = ? ORDER BY createdAt DESC LIMIT 1',
                [email]
            );
            return otp;
        } catch (error) {
            throw new Error('Error fetching OTP: ' + error.message);
        }
    }
}

module.exports = OTP;
