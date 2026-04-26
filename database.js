const mongoose = require('mongoose');

// MongoDB URI - set this in your environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform';

let dbReady = false;

// Initialize MongoDB connection
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI, {
            // Options removed in Mongoose 6+ but kept for backward compatibility if needed
            // useNewUrlParser: true,
            // useUnifiedTopology: true
        });
        console.log('✓ MongoDB connected successfully');
        dbReady = true;
    } catch (err) {
        console.error('✗ MongoDB connection error:', err);
    }
}

connectDB();

const database = {
    // Check if database is ready
    isReady() {
        return dbReady;
    },
    
    // Wait for database to be ready
    async waitForReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (dbReady) resolve();
                else setTimeout(checkReady, 100);
            };
            checkReady();
        });
    },

    // Mock direct operations for backward compatibility (where possible)
    // Note: Direct SQL will NOT work. These are here just to prevent crashes
    // until we migrate all direct calls to models.
    async run(sql, params = []) {
        console.warn('⚠️ Direct SQL run() called - this is no longer supported with MongoDB. Please use Models.');
        return { lastID: null, changes: 0 };
    },

    async get(sql, params = []) {
        console.warn('⚠️ Direct SQL get() called - this is no longer supported with MongoDB. Please use Models.');
        return null;
    },

    async all(sql, params = []) {
        console.warn('⚠️ Direct SQL all() called - this is no longer supported with MongoDB. Please use Models.');
        return [];
    }
};

module.exports = database;
