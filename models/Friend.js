const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'req_' + Date.now() },
    requesterId: { type: String, required: true },
    recipientId: { type: String, required: true },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted', 'declined'] },
    createdAt: { type: Date, default: Date.now }
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;
