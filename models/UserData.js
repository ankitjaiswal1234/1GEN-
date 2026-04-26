const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const UserData = sequelize.define('UserData', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'ud_' + Date.now() + Math.random().toString(36).substr(2, 5)
    },
    userId: { type: DataTypes.STRING, allowNull: false },
    userName: DataTypes.STRING,
    userEmail: DataTypes.STRING,
    activityType: DataTypes.STRING,
    action: DataTypes.STRING,
    description: DataTypes.TEXT,
    dataCategory: DataTypes.STRING,
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    duration: DataTypes.INTEGER,
    status: DataTypes.STRING,
    deviceInfo: { type: DataTypes.JSONB, defaultValue: {} },
    location: { type: DataTypes.JSONB, defaultValue: {} },
    details: { type: DataTypes.JSONB, defaultValue: {} }
}, {
    timestamps: true
});

// Static methods for backward compatibility
UserData.findByUserId = function(userId) {
    return this.findAll({ 
        where: { userId },
        order: [['timestamp', 'DESC']]
    });
};

module.exports = UserData;
