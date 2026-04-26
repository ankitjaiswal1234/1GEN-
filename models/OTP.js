const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'otp_' + Date.now() },
    email: { type: String, required: true, lowercase: true, trim: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

// Static methods for backward compatibility
otpSchema.statics.verify = async function(email, code) {
    const otp = await this.findOne({ 
        email, 
        code, 
        verified: 0, 
        expiresAt: { $gt: new Date() } 
    }).sort({ createdAt: -1 });

    if (!otp) {
        throw new Error('Invalid or expired OTP');
    }

    otp.verified = 1;
    await otp.save();
    return true;
};

otpSchema.statics.deleteExpired = function() {
    return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

otpSchema.statics.getByEmail = function(email) {
    return this.findOne({ email }).sort({ createdAt: -1 });
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
