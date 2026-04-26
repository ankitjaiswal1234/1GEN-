const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const User = sequelize.define('User', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'u_' + Date.now() + Math.random().toString(36).substr(2, 5)
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    interests: { 
        type: DataTypes.JSONB, 
        defaultValue: [] 
    },
    country: DataTypes.STRING,
    avatar: DataTypes.STRING,
    isActive: { type: DataTypes.INTEGER, defaultValue: 1 },
    isVerified: { type: DataTypes.INTEGER, defaultValue: 0 },
    loginCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastLogin: DataTypes.DATE,
    ipAddress: DataTypes.STRING,
    loginSessions: { 
        type: DataTypes.JSONB, 
        defaultValue: [] 
    }
}, {
    timestamps: true
});

// Static methods for backward compatibility
User.findByEmail = function(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
};

User.findWithFilter = function(filter) {
    return this.findAll({ where: filter });
};

module.exports = User;
