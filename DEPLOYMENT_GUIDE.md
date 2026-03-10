# 🚀 DEPLOYMENT CHECKLIST & PRODUCTION GUIDE

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration
- [x] `.env` file created with all required variables
- [x] `JWT_SECRET` set to a strong random value (not "secret" or hardcoded)
- [x] `ADMIN_JWT_SECRET` set to a strong random value
- [x] `EMAIL_USER` and `EMAIL_PASSWORD` configured for Gmail (or your email provider)
- [x] `PORT` configured (default: 3000)
- [x] `NODE_ENV` set to "production"
- [x] `CORS_ORIGIN` configured appropriately

### 2. Database
- [x] SQLite database properly initialized
- [x] All 6 tables created:
  - `users` - User accounts and profiles
  - `admins` - Admin accounts and permissions
  - `otps` - OTP verification codes
  - `user_data` - User activity tracking
  - `login_sessions` - Active login sessions
  - `user_sessions` - Session tokens and expiry
- [x] Database file stored in `data/video-platform.db`
- [x] Database has `emailVerified` field for tracking
- [x] Default admin account auto-created on startup

### 3. Dependencies
- [x] All npm packages installed
- [x] `package.json` contains all required dependencies
- [x] No deprecated or outdated packages

### 4. Security
- [x] JWT secrets are strong (min 32 characters)
- [x] BCRYPT rounds set to 10 (in .env as BCRYPT_ROUNDS)
- [x] Password hashing implemented for all users
- [x] Email verification enabled (FEATURE_EMAIL_VERIFICATION=true)
- [x] CORS properly configured
- [x] No sensitive data in code (using .env)
- [x] SQL injection prevention (using parameterized queries)

### 5. Email Service
- [x] Gmail SMTP configured
- [x] Fallback to console logging if email not configured
- [x] OTP emails are being sent
- [x] Welcome emails are being sent
- [x] Email service handles errors gracefully

### 6. API Endpoints
- [x] `/send-otp` - Send OTP to email
- [x] `/verify-otp` - Verify OTP code
- [x] `/register` - Register new user
- [x] `/login` - User login
- [x] `/api/users` - Get all users (public API)
- [x] `/api/admin-login` - Admin login
- [x] WebSocket support enabled for real-time features

### 7. Frontend
- [x] `register.html` - User registration form
- [x] `login.html` - User login form
- [x] `admin.html` - Admin dashboard
- [x] `dashboard.html` - User dashboard
- [x] `video.html` - Video chat interface
- [x] All forms have proper validation

### 8. Logging & Monitoring
- [x] Logs directory created (`/logs`)
- [x] Console logging enabled for debugging
- [x] Error messages are descriptive
- [x] Server startup logs all initialization steps

---

## 📋 Production Environment Variables

```env
# Environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_PATH=./data/video-platform.db

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail
EMAIL_ENABLED=true

# Security - CHANGE THESE IN PRODUCTION!
JWT_SECRET=generate-a-strong-random-key-32-chars-minimum
ADMIN_JWT_SECRET=generate-another-strong-random-key-32-chars
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=https://yourdomain.com
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_CREDENTIALS=true

# Features
FEATURE_EMAIL_VERIFICATION=true
FEATURE_LOGIN_TRACKING=true
FEATURE_GEOLOCATION=true

# Timeouts
SESSION_TIMEOUT=86400000
OTP_EXPIRY=600000
```

---

## 🔐 Security Recommendations

### JWT Secrets
Generate strong secrets using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Admin Credentials
Change default admin credentials immediately:
- Default Email: `admin@videochat.com`
- Default Password: `Admin@123`

Access admin dashboard at: `http://localhost:3000/admin.html`

### Email Configuration
For Gmail:
1. Enable 2-Factor Authentication
2. Create an App Password
3. Use the App Password in `EMAIL_PASSWORD`

### CORS Configuration
In production:
- Set `CORS_ORIGIN` to your actual domain
- DO NOT use `*` for CORS_ORIGIN in production

---

## 🚀 Deployment Steps

### 1. Local Testing
```bash
# Install dependencies
npm install

# Run tests
node deployment-test.js

# Start server
npm start
```

### 2. Server Deployment
```bash
# Clone repository to your server
git clone <your-repo> /var/www/video-platform
cd /var/www/video-platform

# Install dependencies
npm install --production

# Create .env with production values
cp .env.example .env
# Edit .env with your production values

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name video-platform
pm2 save
pm2 startup
```

### 3. Nginx Configuration (Recommended)
```nginx
upstream video_platform {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://video_platform;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /socket.io {
        proxy_pass http://video_platform/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. SSL Certificate (Using Let's Encrypt)
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com
```

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
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
);
```

### Admins Table
```sql
CREATE TABLE admins (
    _id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    permissions TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### OTPs Table
```sql
CREATE TABLE otps (
    _id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🧪 Testing Commands

### Test Server Health
```bash
curl http://localhost:3000/register.html
```

### Test Send OTP
```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test Login
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

---

## 📝 Admin Credentials

**Default Admin Account (created automatically):**
- Email: `admin@videochat.com`
- Password: `Admin@123`
- Access: http://localhost:3000/admin.html

⚠️ **IMPORTANT**: Change these credentials after first login!

---

## 🔍 Monitoring & Maintenance

### Check Logs
```bash
tail -f logs/app.log
pm2 logs video-platform
```

### Monitor Performance
```bash
pm2 monit
```

### Database Backup
```bash
cp data/video-platform.db data/video-platform.db.backup
```

### Update Dependencies
```bash
npm outdated
npm update
```

---

## 🚨 Common Issues & Solutions

### Issue: EADDRINUSE (Port already in use)
```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Issue: Email not sending
1. Check EMAIL_USER and EMAIL_PASSWORD in .env
2. Verify Gmail app password is correct
3. Check firewall/SMTP settings
4. Look for logs in console output

### Issue: Database locked
1. Ensure only one instance of server is running
2. Check for database locks: `lsof data/video-platform.db`
3. Restart server if needed

### Issue: WebSocket connection failing
1. Ensure proxy correctly handles WebSocket upgrades
2. Check CORS_ORIGIN matches your domain
3. Verify socket.io port (should use same port as HTTP)

---

## ✨ Features Status

- ✅ User Registration with OTP verification
- ✅ User Login with session tracking
- ✅ Admin Dashboard with user management
- ✅ Email verification (OTP-based)
- ✅ Login session tracking with geolocation
- ✅ Real-time video chat (WebSocket)
- ✅ User activity tracking
- ✅ Responsive design
- ✅ reCAPTCHA support (optional)

---

## 📞 Support

For issues or questions:
1. Check logs in `/logs` directory
2. Review error messages in console
3. Check environment variables
4. Verify database initialization
5. Test with curl commands above

---

**Last Updated:** March 10, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
