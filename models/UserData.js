const db = require('../database');

class UserData {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.userId = data.userId;
        this.userName = data.userName;
        this.action = data.action || data.activityType;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.details = data.details || {};
    }

    // Save user data to database
    async save() {
        try {
            const sql = `
                INSERT OR REPLACE INTO user_data 
                (_id, userId, userName, action, timestamp, details)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                this._id,
                this.userId,
                this.userName,
                this.action,
                this.timestamp,
                JSON.stringify(this.details)
            ];

            await db.run(sql, params);
            return this;
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }

    // Static: Get all user data
    static async find() {
        try {
            const sql = 'SELECT * FROM user_data ORDER BY timestamp DESC';
            const rows = await db.all(sql);
            
            return rows.map(row => {
                row.details = JSON.parse(row.details || '{}');
                return new UserData(row);
            });
        } catch (error) {
            console.error('Error finding user data:', error);
            throw error;
        }
    }

    // Static: Get user data by userId
    static async findByUserId(userId) {
        try {
            const sql = 'SELECT * FROM user_data WHERE userId = ? ORDER BY timestamp DESC';
            const rows = await db.all(sql, [userId]);
            
            return rows.map(row => {
                row.details = JSON.parse(row.details || '{}');
                return new UserData(row);
            });
        } catch (error) {
            console.error('Error finding user data by id:', error);
            throw error;
        }
    }

    // Static: Create user data
    static async create(data) {
        try {
            const userData = new UserData(data);
            await userData.save();
            return userData;
        } catch (error) {
            console.error('Error creating user data:', error);
            throw error;
        }
    }

    // Static: Delete user data
    static async deleteMany(query) {
        try {
            const sql = 'DELETE FROM user_data WHERE userId = ?';
            await db.run(sql, [query.userId]);
            console.log(`✓ User data deleted for userId: ${query.userId}`);
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error;
        }
    }

    // Static: Count user data
    static async countDocuments(query = {}) {
        try {
            let sql = 'SELECT COUNT(*) as count FROM user_data WHERE 1=1';
            const params = [];

            if (query.userId) {
                sql += ' AND userId = ?';
                params.push(query.userId);
            }

            const result = await db.get(sql, params);
            return result ? result.count : 0;
        } catch (error) {
            console.error('Error counting user data:', error);
            throw error;
        }
    }

    // Static: Aggregate stats
    static async aggregate(pipeline) {
        try {
            const allData = await UserData.find();
            
            let result = allData;

            for (const stage of pipeline) {
                if (stage.$group) {
                    const groupBy = stage.$group._id;
                    const groupedData = {};
                    
                    result.forEach(item => {
                        const key = item[groupBy];
                        if (!groupedData[key]) {
                            groupedData[key] = { _id: key };
                            if (stage.$group.count) {
                                groupedData[key].count = 0;
                            }
                        }
                        if (stage.$group.count) {
                            groupedData[key].count += 1;
                        }
                    });
                    
                    result = Object.values(groupedData);
                }
                if (stage.$limit) {
                    result = result.slice(0, stage.$limit);
                }
            }

            return result;
        } catch (error) {
            console.error('Error aggregating user data:', error);
            throw error;
        }
    }
}

module.exports = UserData;

