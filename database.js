const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH ? 
    (path.isAbsolute(process.env.DATABASE_PATH) ? process.env.DATABASE_PATH : path.join(__dirname, process.env.DATABASE_PATH)) : 
    path.join(__dirname, 'data', '1gen-chat-by-ai.db');

// Create database directory if it doesn't exist
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database connection
let dbReady = false;
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('✓ SQLite database connected:', dbPath);
        initializeTables().then(() => {
            dbReady = true;
            console.log('✓ All tables initialized and ready');
        }).catch(err => {
            console.error('✗ Table initialization failed:', err);
        });
    }
});

// Initialize tables with promise to ensure they're created before use
function initializeTables() {
    return new Promise(async (resolve) => {
        let tablesCreated = 0;
        const totalTables = 8;
        
        // Helper function to mark table creation
        const tableReady = () => {
            tablesCreated++;
            if (tablesCreated === totalTables) {
                createDefaultAdmin().then(() => resolve());
            }
        };
        
        // Users table
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                _id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                interests TEXT,
                loginCount INTEGER DEFAULT 0,
                lastLogin TEXT,
                loginSessions TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                isActive INTEGER DEFAULT 1,
                country TEXT DEFAULT 'Unknown',
                ipAddress TEXT,
                emailVerified INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) console.error('Error creating users table:', err);
            else console.log('✓ Users table ready');
            tableReady();
        });

        // Admins table
        db.run(`
            CREATE TABLE IF NOT EXISTS admins (
                _id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                permissions TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating admins table:', err);
            else console.log('✓ Admins table ready');
            tableReady();
        });

        // User activity data table
        db.run(`
            CREATE TABLE IF NOT EXISTS user_data (
                _id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                userName TEXT,
                action TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )
        `, (err) => {
            if (err) console.error('Error creating user_data table:', err);
            else console.log('✓ User data table ready');
            tableReady();
        });

        // Login sessions table
        db.run(`
            CREATE TABLE IF NOT EXISTS login_sessions (
                _id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                ipAddress TEXT,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                duration INTEGER DEFAULT 0,
                FOREIGN KEY(userId) REFERENCES users(_id)
            )
        `, (err) => {
            if (err) console.error('Error creating login_sessions table:', err);
            else console.log('✓ Login sessions table ready');
            tableReady();
        });

        // OTP verification table
        db.run(`
            CREATE TABLE IF NOT EXISTS otps (
                _id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                code TEXT NOT NULL,
                expiresAt TEXT NOT NULL,
                verified INTEGER DEFAULT 0,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating otps table:', err);
            else console.log('✓ OTP table ready');
            tableReady();
        });

        // User sessions table for tracking
        db.run(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                _id TEXT PRIMARY KEY,
                userId TEXT NOT NULL,
                token TEXT,
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                expiresAt TEXT,
                FOREIGN KEY(userId) REFERENCES users(_id)
            )
        `, (err) => {
            if (err) console.error('Error creating user_sessions table:', err);
            else console.log('✓ User sessions table ready');
            tableReady();
        });

        // Messages table for chat history
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                _id TEXT PRIMARY KEY,
                senderId TEXT NOT NULL,
                senderName TEXT,
                receiverId TEXT NOT NULL,
                receiverName TEXT,
                text TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('Error creating messages table:', err);
            else console.log('✓ Messages table ready');
            tableReady();
        });

        // Friends table
        db.run(`
            CREATE TABLE IF NOT EXISTS friends (
                _id TEXT PRIMARY KEY,
                requesterId TEXT NOT NULL,
                recipientId TEXT NOT NULL,
                status TEXT DEFAULT 'pending', 
                createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(requesterId) REFERENCES users(_id),
                FOREIGN KEY(recipientId) REFERENCES users(_id)
            )
        `, (err) => {
            if (err) console.error('Error creating friends table:', err);
            else console.log('✓ Friends table ready');
            tableReady();
        });
    });
}

// Create default admin account
async function createDefaultAdmin() {
    const bcrypt = require('bcryptjs');
    
    try {
        // Check if any admin exists
        const result = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (result.count === 0) {
            // Create default admin
            const adminEmail = 'PEATALLEN23@GMAIL.COM';
            const adminPassword = '123qweasE@ADMIN';
            const hash = await bcrypt.hash(adminPassword, 10);
            const adminId = 'admin_' + Date.now();

            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO admins (_id, name, email, password, permissions) VALUES (?, ?, ?, ?, ?)',
                    [adminId, 'Admin User', adminEmail, hash, JSON.stringify(['view-users', 'view-sessions', 'manage-users'])],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });

            console.log('✓ Default admin account created');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📊 ADMIN CREDENTIALS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Email:    ' + adminEmail);
            console.log('Password: ' + adminPassword);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;
            console.log('Access admin dashboard: ' + baseUrl + '/admin.html');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Database operations helper
const database = {
    // Run insert/update/delete queries
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },

    // Get a single row
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    // Get all rows
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },

    // Close database connection
    close() {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) reject(err);
                else {
                    console.log('Database connection closed');
                    resolve();
                }
            });
        });
    },
    
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
    }
};

module.exports = database;
