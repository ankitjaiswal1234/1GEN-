const db = require('../database');

class User {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.interests = data.interests || [];
        this.loginCount = data.loginCount || 0;
        this.lastLogin = data.lastLogin;
        this.loginSessions = data.loginSessions || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.isActive = data.isActive !== 0 ? 1 : 0;
        this.country = data.country || 'Unknown';
        this.ipAddress = data.ipAddress || '';
        this.emailVerified = data.emailVerified || 0;
        this.stars_total = data.stars_total || 0;
        this.stars_count = data.stars_count || 0;
        this.hearts_count = data.hearts_count || 0;
    }

    // Save user to database
    async save() {
        try {
            const sql = `
                INSERT OR REPLACE INTO users (_id, name, email, password, interests, loginCount, lastLogin, loginSessions, createdAt, isActive, country, ipAddress, emailVerified, stars_total, stars_count, hearts_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                this._id,
                this.name,
                this.email,
                this.password,
                Array.isArray(this.interests) ? JSON.stringify(this.interests) : this.interests,
                this.loginCount,
                this.lastLogin,
                typeof this.loginSessions === 'string' ? this.loginSessions : JSON.stringify(this.loginSessions || []),
                this.createdAt,
                this.isActive,
                this.country,
                this.ipAddress,
                this.emailVerified || 0,
                this.stars_total || 0,
                this.stars_count || 0,
                this.hearts_count || 0
            ];

            await db.run(sql, params);
            console.log(`✓ User saved: ${this.email}`);
            return this;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    // Static: Find user by email
    static async findOne(query) {
        try {
            const sql = 'SELECT * FROM users WHERE email = ?';
            const row = await db.get(sql, [query.email]);
            
            if (row) {
                row.interests = JSON.parse(row.interests || '[]');
                row.loginSessions = JSON.parse(row.loginSessions || '[]');
                return new User(row);
            }
            return null;
        } catch (error) {
            console.error('Error finding user:', error);
            throw error;
        }
    }

    // Static: Find user by ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM users WHERE _id = ?';
            const row = await db.get(sql, [id]);
            
            if (row) {
                row.interests = JSON.parse(row.interests || '[]');
                row.loginSessions = JSON.parse(row.loginSessions || '[]');
                return new User(row);
            }
            return null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    // Static: Create new user
    static async create(data) {
        try {
            const user = new User(data);
            await user.save();
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Static: Get all users
    static async find() {
        try {
            const sql = 'SELECT * FROM users';
            const rows = await db.all(sql);
            
            return rows.map(row => {
                row.interests = JSON.parse(row.interests || '[]');
                row.loginSessions = JSON.parse(row.loginSessions || '[]');
                return new User(row);
            });
        } catch (error) {
            console.error('Error finding users:', error);
            throw error;
        }
    }

    // Static: Delete user
    static async deleteOne(query) {
        try {
            const sql = 'DELETE FROM users WHERE email = ?';
            await db.run(sql, [query.email]);
            console.log(`✓ User deleted: ${query.email}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Static: Count users
    static async countDocuments() {
        try {
            const sql = 'SELECT COUNT(*) as count FROM users';
            const result = await db.get(sql);
            return result ? result.count : 0;
        } catch (error) {
            console.error('Error counting users:', error);
            throw error;
        }
    }

    // Static: Find users with interests filter
    static async findWithFilter(filter) {
        try {
            let sql = 'SELECT * FROM users WHERE 1=1';
            const params = [];

            if (filter.isActive !== undefined) {
                sql += ' AND isActive = ?';
                params.push(filter.isActive);
            }

            const rows = await db.all(sql, params);
            
            return rows.map(row => {
                row.interests = JSON.parse(row.interests || '[]');
                row.loginSessions = JSON.parse(row.loginSessions || '[]');
                return new User(row);
            });
        } catch (error) {
            console.error('Error finding users with filter:', error);
            throw error;
        }
    }
}

module.exports = User;

