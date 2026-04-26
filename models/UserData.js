const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'ud_' + Date.now() + Math.random().toString(36).substr(2, 5) },
    userId: { type: String, required: true },
    userName: String,
    userEmail: String,
    activityType: String,
    action: String, // Keep for backward compatibility
    description: String,
    dataCategory: String,
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    duration: Number,
    status: String,
    deviceInfo: {
        userAgent: String,
        platform: String
    },
    location: {
        ipAddress: String,
        country: String,
        city: String
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} } // Keep for backward compatibility
});

// Static methods for backward compatibility
userDataSchema.statics.findByUserId = function(userId) {
    return this.find({ userId }).sort({ timestamp: -1 });
};

const UserData = mongoose.model('UserData', userDataSchema);

module.exports = UserData;
