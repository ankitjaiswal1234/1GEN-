const fs = require('fs');
const path = require('path');

// Simple in-memory database with file persistence
const adminsFile = path.join(__dirname, '../data/admins.json');

// Ensure data directory exists
function ensureDataDir() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

// Load admins from file
function loadAdmins() {
    ensureDataDir();
    try {
        if (fs.existsSync(adminsFile)) {
            const data = fs.readFileSync(adminsFile, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading admins:', error);
    }
    return [];
}

// Save admins to file
function saveAdmins(admins) {
    ensureDataDir();
    try {
        fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2));
    } catch (error) {
        console.error('Error saving admins:', error);
    }
}

// Simple Admin Model
class Admin {
    constructor(data) {
        this._id = data._id || Date.now().toString();
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.permissions = data.permissions || [];
        this.createdAt = data.createdAt || new Date();
    }

    // Save admin
    async save() {
        const admins = loadAdmins();
        const index = admins.findIndex(a => a._id === this._id);
        if (index > -1) {
            admins[index] = this;
        } else {
            admins.push(this);
        }
        saveAdmins(admins);
        return this;
    }

    // Static method to find by email
    static async findOne(query) {
        const admins = loadAdmins();
        const admin = admins.find(a => a.email === query.email);
        return admin ? new Admin(admin) : null;
    }

    // Static method to find by id
    static async findById(id) {
        const admins = loadAdmins();
        const admin = admins.find(a => a._id === id);
        return admin ? new Admin(admin) : null;
    }

    // Static method to create
    static async create(data) {
        const admins = loadAdmins();
        const newAdmin = new Admin(data);
        admins.push(newAdmin);
        saveAdmins(admins);
        return newAdmin;
    }

    // Static method to find all
    static async find() {
        const admins = loadAdmins();
        return admins.map(a => new Admin(a));
    }

    // Static method to delete
    static async deleteOne(query) {
        let admins = loadAdmins();
        admins = admins.filter(a => a.email !== query.email);
        saveAdmins(admins);
    }
}

module.exports = Admin;
