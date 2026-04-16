const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const UserData = require("../models/UserData");

const router = express.Router();

// Configuration from environment
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-admin-secret-in-production";
const ADMIN_JWT_EXPIRY = process.env.ADMIN_JWT_EXPIRY || "7d";

// Admin Authentication Middleware
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin) return res.status(403).json({ message: "Admin not found" });

        req.admin = admin;
        next();
    } catch (error) {
        res.status(403).json({ message: "Invalid token" });
    }
};

// Admin Registration (only for initial setup, should be removed later)
router.post("/register-admin", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const hash = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            email,
            password: hash,
            permissions: ["view-users", "view-sessions", "manage-users"]
        });

        res.json({ message: "Admin created successfully", admin });
    } catch (error) {
        res.status(500).json({ message: "Error creating admin", error: error.message });
    }
});

// Admin Login
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }

        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const token = jwt.sign(
            { id: admin._id, email: admin.email },
            ADMIN_JWT_SECRET,
            { expiresIn: ADMIN_JWT_EXPIRY }
        );

        res.json({
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
});

// Get All Users (Admin Only)
router.get("/admin/users", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        const usersWithStats = users.map(user => {
            const u = { ...user };
            delete u.password;
            return {
                ...u,
                totalSessions: (user.loginSessions || []).length,
                lastLoginDate: user.lastLogin
            };
        });

        res.json(usersWithStats);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
});

// Get User Details with Login Sessions (Admin Only)
router.get("/admin/users/:userId", verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const u = { ...user };
        delete u.password;

        const userDetails = {
            ...u,
            totalSessions: (user.loginSessions || []).length,
            averageSessionDuration: (user.loginSessions || []).length > 0
                ? Math.round(user.loginSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / user.loginSessions.length)
                : 0,
            lastLoginDate: user.lastLogin,
            createdDate: user.createdAt
        };

        res.json(userDetails);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details", error: error.message });
    }
});

// Get Dashboard Statistics with Country Data (Admin Only)
router.get("/admin/dashboard-stats", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        const totalUsers = users.length;
        const activeUsersCount = users.filter(u => u.isActive === 1).length;
        const inactiveUsersCount = totalUsers - activeUsersCount;
        
        // Calculate interest breakdown
        const interestCounts = {
            movie: 0,
            study: 0,
            engineering: 0,
            consulting: 0,
            random: 0
        };

        users.forEach(user => {
            const interests = Array.isArray(user.interests) ? user.interests : [];
            interests.forEach(interest => {
                if (interestCounts.hasOwnProperty(interest)) {
                    interestCounts[interest]++;
                }
            });
        });

        // Calculate total sessions
        const totalLoginSessions = users.reduce((sum, user) => 
            sum + (user.loginSessions ? user.loginSessions.length : 0), 0);
        
        // Calculate average session duration
        const avgSessionDuration = users.length > 0
            ? Math.round(users.reduce((sum, user) => 
                sum + (user.loginSessions ? user.loginSessions.reduce((s, session) => s + (session.duration || 0), 0) : 0), 0) / (totalLoginSessions || 1))
            : 0;

        // Count users by country
        const countryStats = {};
        users.forEach(user => {
            const country = user.country || 'Unknown';
            countryStats[country] = (countryStats[country] || 0) + 1;
        });

        // Sort countries by user count
        const countrySorted = Object.entries(countryStats)
            .sort(([, a], [, b]) => b - a)
            .reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {});

        res.json({
            totalUsers,
            activeUsers: activeUsersCount,
            inactiveUsers: inactiveUsersCount,
            totalLoginSessions,
            avgSessionDuration,
            interestCounts,
            countryStats: countrySorted,
            topCountries: Object.entries(countrySorted).slice(0, 10),
            usersThisMonth: users.filter(u => {
                const createdDate = new Date(u.createdAt);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return createdDate >= thirtyDaysAgo;
            }).length
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching dashboard statistics", error: error.message });
    }
});

// Get Country Statistics (Admin Only)
router.get("/admin/country-stats", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        
        const countryStats = {};
        let totalSessions = 0;
        let totalActiveUsers = 0;

        users.forEach(user => {
            const country = user.country || 'Unknown';
            const sessions = user.loginSessions ? user.loginSessions.length : 0;
            const isActive = user.isActive === 1;

            if (!countryStats[country]) {
                countryStats[country] = {
                    country,
                    userCount: 0,
                    activeSessions: 0,
                    totalSessions: 0,
                    activeUsers: 0,
                    averageSessionDuration: 0,
                    lastActivity: null
                };
            }

            countryStats[country].userCount++;
            countryStats[country].totalSessions += sessions;
            
            if (isActive) {
                countryStats[country].activeUsers++;
                totalActiveUsers++;
            }

            if (user.lastLogin && (!countryStats[country].lastActivity || new Date(user.lastLogin) > countryStats[country].lastActivity)) {
                countryStats[country].lastActivity = user.lastLogin;
            }

            totalSessions += sessions;
        });

        // Calculate average session duration per country
        Object.keys(countryStats).forEach(country => {
            const countryData = countryStats[country];
            if (countryData.totalSessions > 0) {
                const totalDuration = users
                    .filter(u => (u.country || 'Unknown') === country)
                    .reduce((sum, u) => sum + (u.loginSessions ? u.loginSessions.reduce((s, sess) => s + (sess.duration || 0), 0) : 0), 0);
                countryData.averageSessionDuration = Math.round(totalDuration / countryData.totalSessions);
            }
        });

        // Sort by user count
        const sortedCountries = Object.entries(countryStats)
            .sort(([, a], [, b]) => b.userCount - a.userCount)
            .reduce((obj, [key, val]) => {
                obj[key] = val;
                return obj;
            }, {});

        res.json({
            totalCountries: Object.keys(countryStats).length,
            totalSessions,
            countryStats: sortedCountries,
            summary: {
                topCountry: Object.entries(sortedCountries)[0] ? Object.entries(sortedCountries)[0][1] : null,
                countriesList: Object.values(sortedCountries)
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching country statistics", error: error.message });
    }
});

// Get User Statistics (Admin Only)
router.get("/admin/user-stats", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();

        const stats = {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.isActive === 1).length,
            inactiveUsers: users.filter(u => u.isActive === 0).length,
            totalSessions: users.reduce((sum, u) => sum + (u.loginSessions ? u.loginSessions.length : 0), 0),
            averageSessionDuration: 0,
            usersWithLastSevenDays: 0,
            usersWithLastThirtyDays: 0,
            topUsers: [],
            sessionBreakdown: {}
        };

        // Calculate average session duration
        const totalSessionDuration = users.reduce((sum, u) => {
            return sum + (u.loginSessions ? u.loginSessions.reduce((s, sess) => s + (sess.duration || 0), 0) : 0);
        }, 0);
        stats.averageSessionDuration = Math.round(totalSessionDuration / (stats.totalSessions || 1));

        // Count active users in last 7 and 30 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        users.forEach(u => {
            if (u.lastLogin) {
                const lastLoginDate = new Date(u.lastLogin);
                if (lastLoginDate >= sevenDaysAgo) stats.usersWithLastSevenDays++;
                if (lastLoginDate >= thirtyDaysAgo) stats.usersWithLastThirtyDays++;
            }
        });

        // Get top users by session count
        stats.topUsers = users
            .map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                country: u.country,
                loginCount: u.loginCount,
                sessions: u.loginSessions ? u.loginSessions.length : 0,
                lastLogin: u.lastLogin
            }))
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10);

        // Breakdown by session count ranges
        stats.sessionBreakdown = {
            noSessions: users.filter(u => !u.loginSessions || u.loginSessions.length === 0).length,
            oneTofiveSessions: users.filter(u => u.loginSessions && u.loginSessions.length > 0 && u.loginSessions.length <= 5).length,
            sixToTenSessions: users.filter(u => u.loginSessions && u.loginSessions.length > 5 && u.loginSessions.length <= 10).length,
            moreThanTenSessions: users.filter(u => u.loginSessions && u.loginSessions.length > 10).length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user statistics", error: error.message });
    }
});

// Get Dashboard Statistics (Admin Only)
router.get("/admin/statistics", verifyAdmin, async (req, res) => {
    try {
        const users = await User.find();
        const totalUsers = users.length;
        const activeUsersCount = users.filter(u => u.isActive === 1 || u.isActive === true).length;

        const interestCounts = {
            movie: 0,
            study: 0,
            engineering: 0,
            consulting: 0,
            random: 0
        };

        users.forEach(user => {
            const interests = Array.isArray(user.interests) ? user.interests : [];
            interests.forEach(interest => {
                if (interestCounts.hasOwnProperty(interest)) {
                    interestCounts[interest]++;
                }
            });
        });

        const totalLoginSessions = users.reduce((sum, user) => sum + (user.loginSessions ? user.loginSessions.length : 0), 0);
        const avgSessionDuration = users.length > 0
            ? Math.round(users.reduce((sum, user) => 
                sum + (user.loginSessions ? user.loginSessions.reduce((s, session) => s + (session.duration || 0), 0) : 0), 0) / (totalLoginSessions || 1))
            : 0;

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const usersThisMonth = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

        res.json({
            totalUsers,
            activeUsers: activeUsersCount,
            totalLoginSessions,
            avgSessionDuration,
            interestCounts,
            usersThisMonth
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching statistics", error: error.message });
    }
});

// Get User Login History (Admin Only)
router.get("/admin/users/:userId/login-history", verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const loginHistory = user.loginSessions.sort((a, b) => b.timestamp - a.timestamp);

        res.json({
            userId: user._id,
            userName: user.name,
            email: user.email,
            totalLogins: user.loginCount,
            lastLogin: user.lastLogin,
            loginHistory
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching login history", error: error.message });
    }
});

// Delete User (Admin Only)
router.delete("/admin/users/:userId", verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
});

// Deactivate User (Admin Only)
router.patch("/admin/users/:userId/deactivate", verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User deactivated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error deactivating user", error: error.message });
    }
});

// Collect User Data (for tracking user activities)
router.post("/admin/collect-user-data", async (req, res) => {
    try {
        const { userId, userName, userEmail, activityType, description, dataCategory, metadata, duration, status } = req.body;

        const userData = await UserData.create({
            userId,
            userName,
            userEmail,
            activityType,
            description,
            dataCategory,
            timestamp: new Date(),
            metadata,
            duration,
            status,
            deviceInfo: {
                userAgent: req.headers['user-agent'],
                platform: req.body.platform || 'unknown'
            },
            location: {
                ipAddress: req.ip || req.connection.remoteAddress,
                country: req.body.country,
                city: req.body.city
            }
        });

        res.json({ message: "User data collected successfully", data: userData });
    } catch (error) {
        res.status(500).json({ message: "Error collecting user data", error: error.message });
    }
});

// Get All User Data Collections (Admin Only)
router.get("/admin/user-data", verifyAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skipCount = (page - 1) * limit;

        const allUserData = await UserData.find();
        const totalRecords = allUserData.length;
        const totalPages = Math.ceil(totalRecords / limit);

        // Sorting is already handled in UserData.find() (ORDER BY timestamp DESC)
        const userDataCollection = allUserData.slice(skipCount, skipCount + limit);

        res.json({
            data: userDataCollection,
            pagination: {
                currentPage: page,
                totalPages,
                totalRecords,
                recordsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
});

// Get User Data by Category (Admin Only)
router.get("/admin/user-data/category/:category", verifyAdmin, async (req, res) => {
    try {
        const userDataCollection = await UserData.find({ dataCategory: req.params.category })
            .populate('userId', 'name email')
            .sort({ timestamp: -1 });

        res.json(userDataCollection);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data by category", error: error.message });
    }
});

// Get User Data for Specific User (Admin Only)
router.get("/admin/user-data/user/:userId", verifyAdmin, async (req, res) => {
    try {
        const userDataCollection = await UserData.find({ userId: req.params.userId })
            .sort({ timestamp: -1 });

        const totalActivities = userDataCollection.length;
        const activityBreakdown = {};

        userDataCollection.forEach(record => {
            activityBreakdown[record.activityType] = (activityBreakdown[record.activityType] || 0) + 1;
        });

        res.json({
            userId: req.params.userId,
            totalActivities,
            activityBreakdown,
            data: userDataCollection
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
});

// Get User Data Analytics Summary (Admin Only)
router.get("/admin/user-data/analytics/summary", verifyAdmin, async (req, res) => {
    try {
        const allData = await UserData.find();
        const totalDataPoints = allData.length;
        
        // Unique Users
        const uniqueUserIds = new Set(allData.map(d => d.userId));
        const activityTypes = Array.from(new Set(allData.map(d => d.activityType)));

        // Aggregation for activity types
        const activityMap = {};
        allData.forEach(d => {
            if (!activityMap[d.activityType]) {
                activityMap[d.activityType] = { _id: d.activityType, count: 0, totalDuration: 0 };
            }
            activityMap[d.activityType].count++;
            activityMap[d.activityType].totalDuration += (d.duration || 0);
        });

        const activities = Object.values(activityMap).map(a => ({
            ...a,
            avgDuration: Math.round(a.totalDuration / a.count)
        })).sort((a, b) => b.count - a.count);

        // Aggregation for data categories
        const categoryMap = {};
        allData.forEach(d => {
            const category = d.dataCategory || 'Uncategorized';
            if (!categoryMap[category]) {
                categoryMap[category] = { _id: category, count: 0 };
            }
            categoryMap[category].count++;
        });

        const dataCategories = Object.values(categoryMap).sort((a, b) => b.count - a.count);

        const recentData = allData.slice(0, 10);

        res.json({
            totalDataPoints,
            uniqueUsers: uniqueUserIds.size,
            activityTypes,
            activities,
            dataCategories,
            recentData
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching analytics summary", error: error.message });
    }
});

// Delete User Data Records (Admin Only)
router.delete("/admin/user-data/:dataId", verifyAdmin, async (req, res) => {
    try {
        const deletedData = await UserData.findByIdAndDelete(req.params.dataId);

        if (!deletedData) {
            return res.status(404).json({ message: "User data record not found" });
        }

        res.json({ message: "User data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user data", error: error.message });
    }
});

// Export User Data as CSV (Admin Only)
router.get("/admin/user-data/export/csv", verifyAdmin, async (req, res) => {
    try {
        const userDataCollection = await UserData.find()
            .populate('userId', 'name email')
            .lean();

        // Convert to CSV format
        const csv = "UserName,Email,ActivityType,Category,Timestamp,Duration,Status\n" +
            userDataCollection.map(record => 
                `"${record.userName}","${record.userEmail}","${record.activityType}","${record.dataCategory}","${record.timestamp}","${record.duration || 'N/A'}","${record.status || 'N/A'}"`
            ).join("\n");

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user_data_export.csv"');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ message: "Error exporting user data", error: error.message });
    }
});

module.exports = router;
