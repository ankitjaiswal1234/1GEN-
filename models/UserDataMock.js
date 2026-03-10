const fs = require('fs');
const path = require('path');

// Simple in-memory database with file persistence
const userDataFile = path.join(__dirname, '../data/userdata.json');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load user data from file
function loadUserData() {
    ensureDataDir();
    try {
        if (fs.existsSync(userDataFile)) {
            const data = fs.readFileSync(userDataFile, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
    return [];
}

// Save user data to file
function saveUserData(data) {
    ensureDataDir();
    try {
        fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

// Simple UserData Model
class UserData {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.userId = data.userId;
        this.userName = data.userName;
        this.action = data.action;
        this.timestamp = data.timestamp || new Date();
        this.details = data.details || {};
    }

    // Save user data
    async save() {
        const allData = loadUserData();
        const index = allData.findIndex(d => d._id === this._id);
        if (index > -1) {
            allData[index] = this;
        } else {
            allData.push(this);
        }
        saveUserData(allData);
        return this;
    }

    // Static method to find all user data
    static async find() {
        const allData = loadUserData();
        return allData.map(d => new UserData(d));
    }

    // Static method to find by user id
    static async findByUserId(userId) {
        const allData = loadUserData();
        const userDataArray = allData.filter(d => d.userId === userId);
        return userDataArray.map(d => new UserData(d));
    }

    // Static method to create
    static async create(data) {
        const allData = loadUserData();
        const newData = new UserData(data);
        allData.push(newData);
        saveUserData(allData);
        return newData;
    }

    // Static method to delete
    static async deleteMany(query) {
        let allData = loadUserData();
        allData = allData.filter(d => d.userId !== query.userId);
        saveUserData(allData);
    }

    // Static method to count
    static async countDocuments(query) {
        const allData = loadUserData();
        if (query.userId) {
            return allData.filter(d => d.userId === query.userId).length;
        }
        return allData.length;
    }

    // Static method to aggregate stats
    static async aggregate(pipeline) {
        const allData = loadUserData();
        
        // Simple aggregation for common patterns
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
                        groupedData[key].count += stage.$group.count === '$' ? 1 : 0;
                    }
                });
                
                result = Object.values(groupedData);
            }
            if (stage.$limit) {
                result = result.slice(0, stage.$limit);
            }
        }

        return result;
    }
}

module.exports = UserData;
