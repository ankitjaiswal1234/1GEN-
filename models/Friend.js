const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Friend = sequelize.define('Friend', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'req_' + Date.now()
    },
    requesterId: { type: DataTypes.STRING, allowNull: false },
    recipientId: { type: DataTypes.STRING, allowNull: false },
    status: { 
        type: DataTypes.STRING, 
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'accepted', 'declined']]
        }
    }
}, {
    timestamps: true
});

module.exports = Friend;
