const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'u_' + Date.now() + Math.random().toString(36).substr(2, 5) },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    interests: { type: [String], default: [] },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    loginSessions: [{
        timestamp: { type: Date, default: Date.now },
        ipAddress: String,
        country: String,
        duration: { type: Number, default: 0 }
    }],
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Number, default: 1 },
    country: { type: String, default: 'Unknown' },
    ipAddress: { type: String, default: '' },
    emailVerified: { type: Number, default: 0 },
    stars_total: { type: Number, default: 0 },
    stars_count: { type: Number, default: 0 },
    hearts_count: { type: Number, default: 0 }
}, {
    timestamps: false // We use our own createdAt
});

// Add findWithFilter static
userSchema.statics.findWithFilter = function(filter) {
    return this.find(filter);
};

// Add findById helper if needed (Mongoose already has it, but just in case)
// userSchema.statics.findById = function(id) { ... } // Mongoose already has this

const User = mongoose.model('User', userSchema);

module.exports = User;
