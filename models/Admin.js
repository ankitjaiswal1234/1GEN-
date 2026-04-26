const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'admin_' + Date.now() },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    permissions: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
