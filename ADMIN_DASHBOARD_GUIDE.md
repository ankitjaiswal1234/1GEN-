# 🎉 Admin Dashboard - Quick Start Guide

## ✅ Setup Complete!

Your admin account has been successfully created and verified:

```
✓ Admin Account Created
  Email: admin@example.com
  Name: Administrator
  Permissions: view-users, view-sessions, manage-users
  Database: data/video-platform.db
```

---

## 🚀 Access the Admin Dashboard

### 1. **Login Page**
   - Navigate to: **http://localhost:3000/admin-login.html**
   - Or click the login link when the server is running

### 2. **Login Credentials**
   ```
   Email:    admin@example.com
   Password: Admin@123456
   ```

### 3. **Dashboard URL** (after login)
   - **http://localhost:3000/admin.html**

---

## 📊 Admin Dashboard Features

Once logged in, you'll have access to:

### **1. Statistics Overview**
   - 👥 **Total Users** - Count of all registered users
   - 🎭 **Movie Interest** - Users interested in movies
   - 📚 **Study Interest** - Users interested in studying
   - ⚙️ **Engineering Interest** - Users interested in engineering
   - 💼 **Consulting Interest** - Users interested in consulting
   - 🎲 **Random Interest** - Users with random interests

### **2. Analytics & Charts**
   - **Pie Chart** - Visual distribution of user interests
   - **Bar Chart** - Comparative breakdown by category
   - Real-time statistics updates

### **3. User Management**
   - View all registered users with details:
     - User name and email
     - Registered interests
     - Login count (total sessions)
     - Last login date/time
   - Filter by interest category
   - Track user activity and engagement

### **4. User Data Collections**
   - Monitor user activity tracking:
     - Login activity
     - User interactions
     - Engagement metrics
     - Performance data
   - **Export CSV** - Download user data for analysis
   - View detailed activity breakdown by type

### **5. Session Management**
   - Track user login sessions
   - Monitor session duration
   - View IP addresses and timestamps
   - Analyze user behavior patterns

### **6. Admin Controls**
   - **Logout Button** - Securely logout from dashboard
   - Token-based authentication (24-hour expiry)
   - Role-based access control

---

## 🔑 API Endpoints (Admin Only)

All endpoints require the admin authentication token:

```
Authorization: Bearer <your_token>
```

### **1. Admin Login**
```
POST /api/admin-login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin@123456"
}

Response:
{
  "token": "eyJhbGc...",
  "admin": {
    "id": "1773084050389",
    "name": "Administrator",
    "email": "admin@example.com"
  }
}
```

### **2. Get Dashboard Statistics**
```
GET /api/admin/statistics
Authorization: Bearer <token>

Response:
{
  "totalUsers": 42,
  "activeUsers": 38,
  "interestBreakdown": {
    "movie": 15,
    "study": 8,
    "engineering": 10,
    "consulting": 5,
    "random": 4
  }
}
```

### **3. Get All Users**
```
GET /api/admin/users
Authorization: Bearer <token>

Response: Array of user objects with:
- _id, name, email
- interests, loginCount
- lastLogin, createdDate
- totalSessions
```

### **4. Get Specific User Details**
```
GET /api/admin/users/:userId
Authorization: Bearer <token>

Response: User object with:
- All user info
- Complete login session history
- Average session duration
- User engagement data
```

---

## 🔐 Security Features

- **JWT Authentication** - Secure token-based login (24h expiry)
- **Password Hashing** - bcrypt with salt rounds
- **Permission-based Access** - Admin-only routes protected
- **Session Tracking** - Monitor all admin activities
- **CORS Protection** - Cross-origin request handling

---

## 📁 Project Structure

```
video-platform-ready/
├── server.js                 # Main server file
├── database.js              # SQLite database setup
├── setup-admin.js           # Admin account creator
├── check-admin.js           # Admin verification tool
├── ADMIN_SETUP.md           # Setup documentation
├── package.json             # Dependencies
├── data/
│   └── video-platform.db   # SQLite database
├── models/
│   ├── Admin.js            # Admin model
│   ├── User.js             # User model
│   ├── OTP.js              # OTP model
│   └── UserData.js         # User data tracking
├── routes/
│   └── admin.js            # Admin API routes
├── utils/
│   ├── emailService.js     # Email utilities
│   └── userDataTracking.js # Activity tracking
└── public/
    ├── admin-login.html    # Login page
    ├── admin.html          # Dashboard
    ├── login.html          # User login
    ├── register.html       # User registration
    ├── dashboard.html      # User dashboard
    └── video.html          # Video chat interface
```

---

## ⚙️ Additional Admin Accounts

You can create more admin accounts using:

```powershell
$env:ADMIN_EMAIL="newadmin@example.com"
$env:ADMIN_PASSWORD="SecurePassword123!"
$env:ADMIN_NAME="New Admin"
node setup-admin.js
```

---

## 🛠️ Troubleshooting

### **Server not starting?**
```powershell
# Kill existing server on port 3000
Get-Process node | Stop-Process -Force

# Start fresh
npm start
```

### **Login fails?**
- Verify email and password are correct
- Clear browser cache (Ctrl+Shift+Delete)
- Check that server is running: http://localhost:3000
- Check database: `node check-admin.js`

### **Database issues?**
```powershell
# Reset database
Remove-Item data/video-platform.db
npm start  # Recreates fresh database
```

### **Port 3000 already in use?**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

---

## 📝 Default Admin Accounts Available

| Email | Password | Name | Status |
|-------|----------|------|--------|
| admin@example.com | Admin@123456 | Administrator | ✅ Active |
| admin@videochat.com | * | Admin User | ✅ In DB |
| PEATALLEN23@GMAIL.COM | 123qweasE@ADMIN | A3SVJ | ✅ In DB |

---

## 🎯 Next Steps

1. ✅ **Login to Dashboard** - http://localhost:3000/admin-login.html
2. 📊 **View Statistics** - Check user overview and analytics
3. 👥 **Manage Users** - Monitor registered users and activity
4. 📥 **Export Data** - Download user data for analysis
5. 🔒 **Logout Safely** - Always logout when done

---

**Happy Admin Dashboard Management! 🚀**
