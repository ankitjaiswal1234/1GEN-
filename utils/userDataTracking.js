// USER DATA COLLECTION API INTEGRATION GUIDE
// This file shows how to use the user data collection API from the frontend

// ============================================
// 1. COLLECT USER DATA WHEN USER LOGS IN
// ============================================
async function trackUserLogin(userId, userName, userEmail) {
    try {
        await fetch("/api/admin/collect-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                activityType: "LOGIN",
                description: "User logged into the platform",
                dataCategory: "login",
                metadata: {
                    browser: navigator.userAgent,
                    timestamp: new Date().toISOString()
                },
                platform: "web",
                status: "success"
            })
        });
    } catch (error) {
        console.error("Error tracking login:", error);
    }
}

// ============================================
// 2. COLLECT USER INTERACTION DATA
// ============================================
async function trackUserInteraction(userId, userName, userEmail, interactionType, details) {
    try {
        await fetch("/api/admin/collect-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                activityType: interactionType,
                description: `User performed ${interactionType}`,
                dataCategory: "interaction",
                metadata: details,
                status: "success"
            })
        });
    } catch (error) {
        console.error("Error tracking interaction:", error);
    }
}

// ============================================
// 3. COLLECT VIDEO SESSION DATA
// ============================================
async function trackVideoSession(userId, userName, userEmail, duration, room) {
    try {
        await fetch("/api/admin/collect-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                activityType: "VIDEO_SESSION",
                description: `User had a video session in ${room}`,
                dataCategory: "engagement",
                duration: duration,
                metadata: {
                    room: room,
                    quality: "HD"
                },
                status: "completed"
            })
        });
    } catch (error) {
        console.error("Error tracking video session:", error);
    }
}

// ============================================
// 4. COLLECT PAGE VIEW DATA
// ============================================
async function trackPageView(userId, userName, userEmail, pageName) {
    try {
        await fetch("/api/admin/collect-user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                activityType: "PAGE_VIEW",
                description: `User viewed ${pageName} page`,
                dataCategory: "performance",
                metadata: {
                    page: pageName,
                    referrer: document.referrer
                },
                status: "success"
            })
        });
    } catch (error) {
        console.error("Error tracking page view:", error);
    }
}

// ============================================
// USAGE EXAMPLES
// ============================================

// Example 1: Track login after successful authentication
// In login.html or during login process:
/*
async function handleLogin(user) {
    // ... existing login logic ...
    
    // Track the login
    await trackUserLogin(user._id, user.name, user.email);
    
    // ... redirect logic ...
}
*/

// Example 2: Track video session duration
// In video.html:
/*
let sessionStartTime = Date.now();

socket.on("disconnect", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);
    
    await trackVideoSession(user._id, user.name, user.email, duration, "movie");
});
*/

// Example 3: Track button clicks
// Add to any page where you want to track interactions:
/*
document.getElementById("shareScreenBtn").addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    await trackUserInteraction(user._id, user.name, user.email, "SHARE_SCREEN", {
        feature: "screen_sharing"
    });
});
*/

// ============================================
// ADMIN DASHBOARD API ENDPOINTS
// ============================================

/*
All admin endpoints require Authorization header with Bearer token:
headers: { 'Authorization': 'Bearer <admin_token>' }

1. Get all user data:
   GET /api/admin/user-data?page=1&limit=50
   
2. Get data by category:
   GET /api/admin/user-data/category/:category
   Categories: login, interaction, engagement, performance
   
3. Get data for specific user:
   GET /api/admin/user-data/user/:userId
   
4. Get analytics summary:
   GET /api/admin/user-data/analytics/summary
   Returns total data points, unique users, activity types, etc.
   
5. Export as CSV:
   GET /api/admin/user-data/export/csv
   Downloads CSV file with all user data
   
6. Delete user data record:
   DELETE /api/admin/user-data/:dataId
*/

// ============================================
// RESPONSE EXAMPLES
// ============================================

/*
Collect Data Response:
{
    "message": "User data collected successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "userId": "507f1f77bcf86cd799439010",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "activityType": "LOGIN",
        "description": "User logged into the platform",
        "dataCategory": "login",
        "timestamp": "2026-03-07T10:30:00.000Z",
        "metadata": {...},
        "status": "success"
    }
}

Analytics Summary Response:
{
    "totalDataPoints": 156,
    "uniqueUsers": 24,
    "activityTypes": ["LOGIN", "PAGE_VIEW", "VIDEO_SESSION"],
    "activities": [
        {
            "_id": "LOGIN",
            "count": 45,
            "avgDuration": 1200
        },
        ...
    ],
    "dataCategories": [
        {
            "_id": "login",
            "count": 45
        },
        ...
    ],
    "recentData": [...]
}
*/

module.exports = {
    trackUserLogin,
    trackUserInteraction,
    trackVideoSession,
    trackPageView
};
