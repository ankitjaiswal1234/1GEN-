const { Sequelize } = require('sequelize');
const path = require('path');

// Connection string from Render or local environment
const DATABASE_URL = process.env.DATABASE_URL;

let sequelize;

if (DATABASE_URL) {
    console.log('🔗 Connecting to PostgreSQL...');
    sequelize = new Sequelize(DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Render/Heroku PostgreSQL
            }
        },
        logging: false
    });
} else {
    console.log('💾 DATABASE_URL not found. Falling back to local SQLite for development...');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, 'data', 'video-platform.db'),
        logging: false
    });
}

const database = {
    sequelize,
    isReady: false,
    
    async waitForReady() {
        if (this.isReady) return true;
        try {
            await sequelize.authenticate();
            // Sync models (creates tables if they don't exist)
            await sequelize.sync({ alter: true });
            this.isReady = true;
            console.log('✅ Database connection established and models synced.');
            return true;
        } catch (error) {
            console.error('❌ Unable to connect to the database:', error);
            throw error;
        }
    },

    // Mock methods for backward compatibility if needed
    async run(sql, params = []) {
        console.warn('⚠️ Direct SQL execution is deprecated. Use models instead.');
        return sequelize.query(sql, { replacements: params });
    },

    async all(sql, params = []) {
        console.warn('⚠️ Direct SQL execution is deprecated. Use models instead.');
        return sequelize.query(sql, { replacements: params, type: Sequelize.QueryTypes.SELECT });
    },

    async get(sql, params = []) {
        const results = await this.all(sql, params);
        return results[0] || null;
    }
};

module.exports = database;
