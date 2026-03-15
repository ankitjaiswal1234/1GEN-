# Admin Dashboard Setup Guide

## Step 1: Start the Server

```bash
npm install
npm start
```

The server will run on `http://localhost:3000`

## Step 2: Create Admin Account

Send a POST request to create an admin account:

**Endpoint:** `POST /api/register-admin`

**Request Body:**
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "Admin@123456"
}
```

You can use curl:
```bash
curl -X POST http://localhost:3000/api/register-admin \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","password":"Admin@123456"}'
```

Or use the provided setup script in this directory.

## Step 3: Login to Admin Dashboard

1. Navigate to: `http://localhost:3000/admin-login.html`
2. Use the credentials you created:
   - Email: `admin@example.com`
   - Password: `Admin@123456`
3. Click "Login to Dashboard"

## Step 4: Admin Dashboard Features

Once logged in, you'll have access to:

- **📊 Admin Dashboard** (`http://localhost:3000/admin.html`)
  - View total user statistics
  - See user interests breakdown
  - Track user activity
  - View all registered users
  - Monitor user login sessions
  - Export user data

### Available Admin Routes

- `GET /api/admin/statistics` - Get dashboard statistics (requires admin token)
- `GET /api/admin/users` - Get all registered users with stats
- `GET /api/admin/users/:userId` - Get specific user details with session history
- `POST /api/admin-login` - Login with admin credentials



(These may need to be created or already exist in the database)

## Database

- **Type:** SQLite
- **Location:** `data/video-platform.db`
- **Tables:** users, admins, otps, login_sessions, user_data

## Troubleshooting

### Admin Not Found
- Ensure the admin account was created successfully
- Check the database: `node check-admin.js`

### Login Failed
- Verify email and password are correct
- Check that the server is running on port 3000
- Clear browser cache/cookies

### Database Issues
- Delete `data/video-platform.db` to reinitialize
- Run `npm start` to create fresh tables
- Check that `data/` directory has write permissions
