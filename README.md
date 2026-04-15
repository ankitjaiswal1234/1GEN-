# 🎥 Video Platform - Production Ready

A real-time video chat platform with user authentication, OTP verification, admin dashboard, and session tracking.

## ✨ Features

✅ **User Authentication**
- Registration with OTP email verification
- Secure login with JWT tokens
- Password hashing with bcrypt
- Session tracking with geolocation

✅ **Admin Dashboard**
- View all users and their activity
- Manage user sessions
- Monitor platform statistics
- User management tools

✅ **Real-time Video Chat**
- WebSocket-based video calling
- User matching by interests
- Live connection management
- Session tracking

✅ **Security**
- JWT authentication
- CORS protection
- SQL injection prevention
- Email verification
- Secure password storage

✅ **Email Notifications**
- OTP verification emails
- Welcome emails
- Activity notifications

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your settings

# 3. Start server
npm start

# 4. Access application
# User Registration: http://localhost:3000/register.html
# Admin Panel: http://localhost:3000/admin.html
```

See [QUICKSTART.md](QUICKSTART.md) for detailed quick start guide.

## 💻 Installation

### Requirements
- Node.js v18 or higher
- npm or yarn
- Gmail account (for email notifications)
- Modern web browser

### Setup Steps

1. **Clone or download the project**
```bash
cd video-platform-ready
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Configure environment variables** (see Configuration section)

5. **Start the server**
```bash
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=production
PORT=3000

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Security (Generate strong random keys)
JWT_SECRET=your-64-character-random-string
ADMIN_JWT_SECRET=your-64-character-random-string

# CORS
CORS_ORIGIN=*

# Features
FEATURE_EMAIL_VERIFICATION=true
```

### Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows Computer"
3. Copy the generated password
4. Paste into `EMAIL_PASSWORD` in .env

### Generate JWT Secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📖 Usage

### User Registration
1. Navigate to http://localhost:3000/register.html
2. Fill in registration form
3. Click "Register & Send OTP"
4. Enter OTP from email
5. Complete registration

### User Login
1. Navigate to http://localhost:3000/login.html
2. Enter email and password
3. Click Login
4. Access dashboard

### Admin Panel
1. Navigate to http://localhost:3000/admin.html
2. Default credentials:
   - Email: `admin@videochat.com`
   - Password: `Admin@123`
3. Manage users and view analytics

### Video Chat
1. Login as user
2. Go to http://localhost:3000/video.html
3. Join video chat queue
4. Wait for matching
5. Start video call

## 🔌 API Endpoints

### Authentication
- `POST /send-otp` - Send OTP to email
- `POST /verify-otp` - Verify OTP code
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /resend-otp` - Resend OTP

### User Management (Admin)
- `GET /api/users` - Get all users
- `POST /api/admin-login` - Admin login
- `GET /api/admin/users` - Get users with stats
- `DELETE /api/admin/users/:id` - Delete user
- `PUT /api/admin/users/:id` - Update user

### Real-time (WebSocket)
- Connection to /socket.io for WebSocket events

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

### Using Docker
```bash
docker build -t video-platform .
docker run -p 3000:3000 video-platform
```

### Nginx Configuration
See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full Nginx setup.

## 📁 Project Structure

```
video-platform/
├── public/                 # Frontend files
│   ├── register.html      # Registration page
│   ├── login.html         # Login page
│   ├── admin.html         # Admin dashboard
│   ├── dashboard.html     # User dashboard
│   ├── video.html         # Video chat
│   └── style.css          # Styles
├── models/                # Database models
│   ├── User.js           # User model
│   ├── Admin.js          # Admin model
│   └── OTP.js            # OTP model
├── routes/               # API routes
│   └── admin.js          # Admin routes
├── utils/                # Utilities
│   ├── emailService.js   # Email handling
│   └── geolocation.js    # Location tracking
├── data/                 # SQLite database
│   └── video-platform.db
├── logs/                 # Application logs
├── server.js             # Main server file
├── database.js           # Database config
├── package.json          # Dependencies
├── .env                  # Environment variables
└── README.md             # This file
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual API Testing
```bash
# Test server health
curl http://localhost:3000/register.html

# Send OTP
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Get all users
curl http://localhost:3000/api/users
```

## 🔒 Security

### Best Practices Implemented
✅ JWT authentication with secure tokens  
✅ Bcrypt password hashing (10 rounds)  
✅ SQL injection prevention  
✅ CORS protection  
✅ Email verification  
✅ Session timeout  
✅ Secure headers  

### Recommendations
⚠️ Change default admin credentials  
⚠️ Use HTTPS in production  
⚠️ Set strong JWT secrets  
⚠️ Enable firewall rules  
⚠️ Regular security audits  

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

### Email Not Sending
1. Verify EMAIL_USER and EMAIL_PASSWORD
2. Check Gmail app password (not regular password)
3. Verify SMTP is enabled
4. Check firewall settings

### Database Issues
```bash
# Reset database
rm data/video-platform.db
npm start
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## 📊 Database

### SQLite Tables
- `users` - User accounts
- `admins` - Admin accounts  
- `otps` - OTP codes
- `user_data` - Activity logs
- `login_sessions` - Session history
- `user_sessions` - Active sessions

### Auto-created Tables
Tables are automatically created on first startup. Default admin account is also auto-created.

## 🔄 Development

### Available Scripts
```bash
npm start           # Production server
npm run dev         # Development with nodemon
npm test            # Run tests
npm run pm2:start   # Start with PM2
npm run pm2:logs    # View PM2 logs
```

### Code Style
- JavaScript ES6+
- Express.js for backend
- SQLite for database
- Socket.io for WebSocket
- HTML5/CSS3 for frontend

## 📄 Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [.env.example](.env.example) - Configuration template

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review logs in `/logs` directory
3. Check `.env` configuration
4. Verify database is initialized

## 📝 License

ISC License - feel free to use for personal or commercial projects

## ✅ Status

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** March 10, 2026  

---

## 🎯 Next Steps

1. ✅ Configure .env file
2. ✅ Install npm dependencies
3. ✅ Start server: `npm start`
4. ✅ Test endpoints
5. ✅ Deploy to production

**Ready to deploy!** 🚀

---

Made with ❤️ for real-time communication
#   1 g e n  
 