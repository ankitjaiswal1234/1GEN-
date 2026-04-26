const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Message = sequelize.define('Message', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5)
    },
    senderId: { type: DataTypes.STRING, allowNull: false },
    senderName: DataTypes.STRING,
    receiverId: { type: DataTypes.STRING, allowNull: false },
    receiverName: DataTypes.STRING,
    text: { type: DataTypes.TEXT, allowNull: false },
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    timestamps: true
});

module.exports = Message;
