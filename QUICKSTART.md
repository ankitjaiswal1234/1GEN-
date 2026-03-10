# 🎯 QUICK START GUIDE

## Installation & Setup (5 minutes)

### Step 1: Prerequisites
- Node.js v18+ installed
- npm or yarn package manager
- Gmail account (for email notifications)

### Step 2: Clone & Install
```bash
cd video-platform-ready
npm install
```

### Step 3: Configure Environment
```bash
# Copy and edit the .env file
cp .env .env.production

# Edit .env.production with your settings:
# - EMAIL_USER: your@gmail.com
# - EMAIL_PASSWORD: your-app-password (get from Gmail settings)
# - Generate new JWT secrets:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# With PM2 (recommended for production)
npm install -g pm2
pm2 start ecosystem.config.js
```

### Step 5: Access Application
- **User Registration**: http://localhost:3000/register.html
- **User Login**: http://localhost:3000/login.html
- **Admin Panel**: http://localhost:3000/admin.html
  - Email: `admin@videochat.com`
  - Password: `Admin@123`

---

## 🔧 Configuration Quick Reference

### Email Setup (Gmail)
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer" (or your device)
3. Copy the generated 16-character password
4. Paste into `EMAIL_PASSWORD` in .env

### Generate Secure JWT Secret
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variables
```env
# Required
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security (CHANGE these!)
JWT_SECRET=your-secret-key
ADMIN_JWT_SECRET=your-admin-secret

# Optional
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
```

---

## 📊 Database

The application uses SQLite. Database file is at: `data/video-platform.db`

### Tables
- `users` - User accounts
- `admins` - Admin accounts
- `otps` - One-time passwords
- `user_data` - Activity logs
- `login_sessions` - Login history
- `user_sessions` - Active sessions

### Database automatically resets on:
- First startup (creates tables)
- Before major updates (if DATABASE_RESET=true in .env)

---

## 🧪 Quick Test

### Test if server is running
```bash
curl http://localhost:3000/register.html
```

### Test API endpoint
```bash
curl http://localhost:3000/api/users
```

### Test registration flow
1. Go to http://localhost:3000/register.html
2. Enter details:
   - Name: Test User
   - Email: test@example.com
   - Password: Test@123
   - Interests: Movie
3. Click "Register & Send OTP"
4. Check server console for OTP code
5. Enter OTP and submit

---

## 🐛 Troubleshooting

### Port 3000 already in use?
```bash
# Kill the process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Email not sending?
1. Check `EMAIL_USER` and `EMAIL_PASSWORD` in .env
2. Verify you're using an app password, not your Gmail password
3. Check firewall/SMTP settings
4. Restart server

### Database error?
```bash
# Reset database by deleting the file (warning: deletes all data)
rm data/video-platform.db

# Restart server to recreate
npm start
```

### Module not found error?
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📱 Access Points

| Page | URL | Purpose |
|------|-----|---------|
| Register | http://localhost:3000/register.html | New user registration |
| Login | http://localhost:3000/login.html | User login |
| Dashboard | http://localhost:3000/dashboard.html | User dashboard |
| Video Chat | http://localhost:3000/video.html | Video calling |
| Admin Panel | http://localhost:3000/admin.html | Admin dashboard |

---

## 🔐 Default Admin Account

**Email:** `admin@videochat.com`  
**Password:** `Admin@123`

⚠️ **CHANGE THESE IMMEDIATELY AFTER FIRST LOGIN!**

---

## 📈 Performance

### Running with PM2 (Recommended)
```bash
# Start with cluster mode
pm2 start ecosystem.config.js

# Monitor performance
pm2 monit

# View logs
pm2 logs

# Stop
pm2 stop video-platform

# Restart
pm2 restart video-platform

# Delete app
pm2 delete video-platform
```

### Check Resource Usage
```bash
# View process info
pm2 show video-platform

# View CPU/Memory
top
```

---

## 🚀 Deployment

### To Production Server
```bash
# 1. Install dependencies
npm install --production

# 2. Set NODE_ENV
export NODE_ENV=production

# 3. Create .env with production values
# 4. Start with PM2
pm2 start ecosystem.config.js --env production
```

### Using Docker (Optional)
Create Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t video-platform .
docker run -p 3000:3000 video-platform
```

---

## 📞 Support

Check these files for more info:
- `DEPLOYMENT_GUIDE.md` - Full production guide
- `deployment-test.js` - Automated tests
- `.env` - Configuration template

For issues:
1. Check console logs
2. Review error messages
3. Check .env file is correct
4. Verify email credentials
5. Look at database file exists

---

**Happy deploying! 🚀**
