const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../database');

const OTP = sequelize.define('OTP', {
    _id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: () => 'otp_' + Date.now()
    },
    email: { type: DataTypes.STRING, allowNull: false },
    code: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    verified: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    timestamps: true
});

// Static methods for backward compatibility
OTP.createOTP = async function (email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    return this.create({
        email: email.toLowerCase(),
        code,
        expiresAt
    });
};
OTP.verify = async function (email, code) {
    const otp = await this.findOne({
        where: {
            email: email.toLowerCase(),
            code,
            verified: 0,
            expiresAt: { [Op.gt]: new Date() }
        },
        order: [['createdAt', 'DESC']]
    });

    if (!otp) {
        throw new Error('Invalid or expired OTP');
    }

    otp.verified = 1;
    await otp.save();
    return true;
};

OTP.deleteExpired = function () {
    return this.destroy({
        where: {
            expiresAt: { [Op.lt]: new Date() }
        }
    });
};

OTP.getByEmail = function (email) {
    return this.findOne({
        where: { email: email.toLowerCase() },
        order: [['createdAt', 'DESC']]
    });
};

module.exports = OTP;
