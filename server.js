
require("dotenv").config()

const express = require("express")
const http = require("http")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const socketio = require("socket.io")
const cors = require("cors")
const fs = require("fs")
const path = require("path")

// Configuration from environment
const PORT = process.env.PORT || 3000
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production"
const NODE_ENV = process.env.NODE_ENV || "development"
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*"

// Initialize SQLite database
const database = require("./database")

// Load models (now using SQLite)
const User = require("./models/User")
const OTP = require("./models/OTP")
const { sendOTPEmail, sendWelcomeEmail } = require("./utils/emailService")

const app = express()
app.set('trust proxy', 1); // Trust Render's proxy for getting correct client IP
const server = http.createServer(app)
const io = socketio(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ["GET", "POST"],
        credentials: true
    }
})

// Middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use(cors({
    origin: CORS_ORIGIN,
    methods: process.env.CORS_METHODS?.split(",") || ["GET", "POST", "PUT", "DELETE"],
    credentials: process.env.CORS_CREDENTIALS === "true"
}))
app.use(express.static("public"))

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs")
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log("🚀 1GEN CHAT BY AI - SERVER INITIALIZATION")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log(`📍 Environment: ${NODE_ENV}`)
console.log(`📍 Port: ${PORT}`)
console.log(`📍 CORS Origin: ${CORS_ORIGIN}`)
console.log(`✓ Data location: data/1gen-chat-by-ai.db`);

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "alive",
        database: database.isReady() ? "ready" : "initializing",
        time: new Date().toISOString(),
        env: NODE_ENV
    });
});

// User registration - Step 1: Send OTP
app.post("/send-otp", async (req,res)=>{
    try {
        const {email} = req.body
        
        // Validate inputs
        if (!email) {
            return res.status(400).json({message:"Email is required"})
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({email})
        if (existingUser) {
            return res.status(400).json({message:"Email already registered"})
        }
        
        // Generate and send OTP
        const otpData = await OTP.create(email)
        
        // Send OTP email
        console.log(`📧 Attempting to send OTP to: ${email}`);
        await sendOTPEmail(email, otpData.code);
        
        console.log(`✓ OTP successfully sent to: ${email}`);
        res.json({
            message:"OTP sent to your email",
            success:true
        })
    } catch(error) {
        console.error("Send OTP error:", error)
        res.status(500).json({message:"Error sending OTP: " + error.message})
    }
})

// User registration - Step 2: Verify OTP
app.post("/verify-otp", async (req,res)=>{
    try {
        const {email, otp} = req.body
        
        if (!email || !otp) {
            console.log('⚠️ OTP Verification failed: Missing email or code');
            return res.status(400).json({message:"Email and OTP are required"})
        }
        
        console.log(`🔍 Verifying OTP for: ${email}`);
        // Verify OTP
        await OTP.verify(email, otp)
        console.log(`✓ OTP verified for: ${email}`);
        
        res.json({
            message:"OTP verified successfully",
            success:true
        })
    } catch(error) {
        console.error("OTP verification error:", error)
        res.status(400).json({message:"Invalid or expired OTP"})
    }
})

// User registration - Step 3: Create account (after OTP verification)
app.post("/register", async (req,res)=>{
    try {
        const {name, email, password, interests} = req.body
        
        // Validate inputs
        if (!name || !email || !password || !interests) {
            return res.status(400).json({message:"All fields are required"})
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({email})
        if (existingUser) {
            return res.status(400).json({message:"User already exists"})
        }
        
        // Create user account
        const hash = await bcrypt.hash(password, 10)
        const user = await User.create({
            name,
            email,
            password:hash,
            interests: [interests], // Convert single interest to array
            emailVerified: true
        })
        
        // Send welcome email
        await sendWelcomeEmail(email, name)
        
        res.json({
            message:"Account created successfully",
            success:true,
            user:{
                _id:user._id,
                name:user.name,
                email:user.email,
                interests:user.interests
            }
        })
    } catch(error) {
        console.error("Registration error:", error)
        res.status(500).json({message:"Error during registration: " + error.message})
    }
})

// Resend OTP
app.post("/resend-otp", async (req,res)=>{
    try {
        const {email} = req.body
        
        if (!email) {
            return res.status(400).json({message:"Email is required"})
        }
        
        // Generate new OTP
        const otpData = await OTP.create(email)
        
        // Send OTP email
        await sendOTPEmail(email, otpData.code)
        
        res.json({message:"OTP resent to your email", success:true})
    } catch(error) {
        console.error("Resend OTP error:", error)
        res.status(500).json({message:"Error sending OTP: " + error.message})
    }
})

// User login with session tracking
app.post("/login", async (req,res)=>{

const {email,password} = req.body

try {
const user = await User.findOne({email})

if(!user) return res.status(400).json({message:"User not found"})

const match = await bcrypt.compare(password,user.password)

if(!match) return res.status(400).json({message:"Wrong password"})

// Track login session
const ipAddress = req.ip || req.connection.remoteAddress;

// Get country from IP (with fallback)
let country = 'Unknown';
try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,countryCode`);
    const geoData = await geoResponse.json();
    if (geoData.status === 'success') {
        country = `${geoData.country} (${geoData.countryCode})`;
    }
} catch (geoError) {
    console.log('Geolocation failed, using default:', geoError.message);
    country = 'Unknown Location';
}

user.loginCount = (user.loginCount || 0) + 1;
user.lastLogin = new Date();
user.country = country;
user.ipAddress = ipAddress;

// Add login session
if (!user.loginSessions) user.loginSessions = [];
user.loginSessions.push({
timestamp: new Date(),
ipAddress: ipAddress,
country: country,
duration: 0
});

// Keep only last 50 sessions
if (user.loginSessions.length > 50) {
user.loginSessions = user.loginSessions.slice(-50);
}

await user.save();

const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "7d" }
)

res.json({
    token,
    user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        interests: user.interests
    },
    message: "Login successful"
})
} catch(error) {
console.error("Login error:", error);
res.status(500).json({message:"Server error during login"})
}
})

// Get all users API (for admin dashboard)
app.get("/api/users", async (req, res) => {
try {
const users = await User.find();
// Remove passwords
const usersWithoutPassword = users.map(u => ({
...u,
password: undefined
}));
res.json(usersWithoutPassword);
} catch (error) {
res.status(500).json({ message: "Error fetching users" });
}
});

// Get chat history for user
app.get("/api/history", async (req, res) => {
    try {
        const userId = req.headers['user-id']; 
        if (!userId || userId.startsWith('guest-')) return res.status(401).json({message: "Unauthorized or guest"});

        const messages = await database.all(
            `SELECT * FROM messages WHERE senderId = ? OR receiverId = ? ORDER BY timestamp DESC LIMIT 200`,
            [userId, userId]
        );
        res.json(messages);
    } catch(err) {
        res.status(500).json({message: "Error fetching history"});
    }
});

// Add admin routes
const adminRoutes = require("./routes/admin")
app.use("/api", adminRoutes)

// Email debug endpoint
app.get("/api/debug/email", async (req, res) => {
    try {
        const { sendEmail } = require("./utils/emailService");
        const config = {
            user: process.env.EMAIL_USER ? `Present (${process.env.EMAIL_USER.substring(0, 3)}...)` : 'Missing',
            pass: process.env.EMAIL_PASSWORD ? 'Present (Hidden)' : 'Missing',
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 465,
            secure: process.env.EMAIL_SECURE || 'true',
            family: 4,
            node_env: process.env.NODE_ENV
        };

        // Try a verification
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: parseInt(config.port),
            secure: config.secure !== 'false',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            family: 4,
            connectionTimeout: 5000
        });

        let connectionStatus = 'Testing...';
        try {
            await transporter.verify();
            connectionStatus = 'Success';
        } catch (e) {
            connectionStatus = `Failed: ${e.message}`;
        }

        res.json({
            config,
            connectionStatus,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Wait for database to be ready before starting server
async function startServer() {
    await database.waitForReady();
    
    let waitingUsers = []
    let userSessions = {}

    io.on("connection",(socket)=>{

socket.on("join",(user)=>{

userSessions[socket.id] = {
userId: user.id,
joinTime: Date.now(),
user: user
}

let match = waitingUsers.find(u =>
u.interests.some(i => user.interests.includes(i))
)

if(match){

socket.join(match.socket)
socket.emit("matched",match.socket)
io.to(match.socket).emit("matched",socket.id)

// Emit user info to both users
socket.emit("userConnected", match.user)
io.to(match.socket).emit("userConnected", user)

waitingUsers = waitingUsers.filter(u=>u.socket!==match.socket)

}else{

waitingUsers.push({
socket:socket.id,
interests:user.interests,
user: user
})

}

})

socket.on("skip",()=>{

socket.disconnect()

})

socket.on("message", async (data) => {
    try {
        const rooms = Array.from(socket.rooms);
        const room = rooms.find(r => r !== socket.id) || socket.id;
        
        // Broadcast to the other user
        socket.to(room).emit("message", data);

        const senderSession = userSessions[socket.id];
        let receiverSession = null;
        
        // find receiver session
        for (let key in userSessions) {
             if (key !== socket.id) {
                 const otherSocket = io.sockets.sockets.get(key);
                 if (otherSocket && Array.from(otherSocket.rooms).includes(room)) {
                     receiverSession = userSessions[key];
                     break;
                 }
             }
        }

        if (senderSession && receiverSession && senderSession.userId && receiverSession.userId && !senderSession.userId.startsWith('guest-') && !receiverSession.userId.startsWith('guest-')) {
            const msgId = 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5);
            await database.run(
                'INSERT INTO messages (_id, senderId, senderName, receiverId, receiverName, text) VALUES (?, ?, ?, ?, ?, ?)',
                [msgId, senderSession.userId, data.sender || senderSession.user.name, receiverSession.userId, receiverSession.user.name, data.text]
            );
        }
    } catch(err) {
        console.error("Message error:", err);
    }
});

    socket.on("disconnect", async () => {
        if (userSessions[socket.id]) {
            const session = userSessions[socket.id];
            const duration = Math.round((Date.now() - session.joinTime) / 1000);
            delete userSessions[socket.id];
        }

        waitingUsers = waitingUsers.filter(u => u.socket !== socket.id);
    });
    
    });

    server.listen(PORT,()=>{
        console.log(`Server running on ${PORT}`)
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
