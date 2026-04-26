const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    _id: { type: String, default: () => 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5) },
    senderId: { type: String, required: true },
    senderName: String,
    receiverId: { type: String, required: true },
    receiverName: String,
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
