const { DataTypes } = require('sequelize');
const { sequelize } = require('../database');

const Admin = sequelize.define('Admin', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'admin_' + Date.now()
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'admin' },
    permissions: { 
        type: DataTypes.JSONB, 
        defaultValue: ["view-users", "view-sessions", "manage-users"]
    },
    lastLogin: DataTypes.DATE
}, {
    timestamps: true
});

module.exports = Admin;
