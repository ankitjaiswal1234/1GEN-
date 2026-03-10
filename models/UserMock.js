const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Simple in-memory database with file persistence
const usersFile = path.join(__dirname, '../data/users.json');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load users from file
function loadUsers() {
    ensureDataDir();
    try {
        if (fs.existsSync(usersFile)) {
            const data = fs.readFileSync(usersFile, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
    return [];
}

// Save users to file
function saveUsers(users) {
    ensureDataDir();
    try {
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error saving users:', error);
    }
}

// Simple User Model
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
        this.createdAt = data.createdAt || new Date();
        this.isActive = data.isActive !== false;
    }

    // Save user
    async save() {
        const users = loadUsers();
        const index = users.findIndex(u => u._id === this._id);
        if (index > -1) {
            users[index] = this;
        } else {
            users.push(this);
        }
        saveUsers(users);
        return this;
    }

    // Static method to find by email
    static async findOne(query) {
        const users = loadUsers();
        const user = users.find(u => u.email === query.email);
        return user ? new User(user) : null;
    }

    // Static method to find by id
    static async findById(id) {
        const users = loadUsers();
        const user = users.find(u => u._id === id);
        return user ? new User(user) : null;
    }

    // Static method to create
    static async create(data) {
        const users = loadUsers();
        const newUser = new User(data);
        users.push(newUser);
        saveUsers(users);
        return newUser;
    }

    // Static method to find all
    static async find() {
        const users = loadUsers();
        return users.map(u => new User(u));
    }

    // Static method to delete
    static async deleteOne(query) {
        let users = loadUsers();
        users = users.filter(u => u.email !== query.email);
        saveUsers(users);
    }
}

module.exports = User;
