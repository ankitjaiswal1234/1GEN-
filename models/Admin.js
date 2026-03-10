const db = require('../database');

class Admin {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.permissions = data.permissions || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.lastLogin = data.lastLogin;
    }

    // Save admin to database
    async save() {
        try {
            const sql = `
                INSERT OR REPLACE INTO admins 
                (_id, name, email, password, permissions, createdAt)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                this._id,
                this.name,
                this.email,
                this.password,
                JSON.stringify(this.permissions),
                this.createdAt
            ];

            await db.run(sql, params);
            console.log(`✓ Admin saved: ${this.email}`);
            return this;
        } catch (error) {
            console.error('Error saving admin:', error);
            throw error;
        }
    }

    // Static: Find admin by email
    static async findOne(query) {
        try {
            const sql = 'SELECT * FROM admins WHERE email = ?';
            const row = await db.get(sql, [query.email]);
            
            if (row) {
                row.permissions = JSON.parse(row.permissions || '[]');
                return new Admin(row);
            }
            return null;
        } catch (error) {
            console.error('Error finding admin:', error);
            throw error;
        }
    }

    // Static: Find admin by ID
    static async findById(id) {
        try {
            const sql = 'SELECT * FROM admins WHERE _id = ?';
            const row = await db.get(sql, [id]);
            
            if (row) {
                row.permissions = JSON.parse(row.permissions || '[]');
                return new Admin(row);
            }
            return null;
        } catch (error) {
            console.error('Error finding admin by id:', error);
            throw error;
        }
    }

    // Static: Create new admin
    static async create(data) {
        try {
            const admin = new Admin(data);
            await admin.save();
            return admin;
        } catch (error) {
            console.error('Error creating admin:', error);
            throw error;
        }
    }

    // Static: Get all admins
    static async find() {
        try {
            const sql = 'SELECT * FROM admins';
            const rows = await db.all(sql);
            
            return rows.map(row => {
                row.permissions = JSON.parse(row.permissions || '[]');
                return new Admin(row);
            });
        } catch (error) {
            console.error('Error finding admins:', error);
            throw error;
        }
    }

    // Static: Delete admin
    static async deleteOne(query) {
        try {
            const sql = 'DELETE FROM admins WHERE email = ?';
            await db.run(sql, [query.email]);
            console.log(`✓ Admin deleted: ${query.email}`);
        } catch (error) {
            console.error('Error deleting admin:', error);
            throw error;
        }
    }
}

module.exports = Admin;

