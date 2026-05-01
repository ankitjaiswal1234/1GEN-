
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
const { Op } = require("sequelize")
const User = require("./models/User")
const OTP = require("./models/OTP")
const Message = require("./models/Message")
const Friend = require("./models/Friend")
const crypto = require("crypto")
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require("./utils/emailService")

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

// Interest-based matching helper
function findBestMatch(skipperSocketId, skipperInterests) {
    const potentialPartners = Object.values(lobbyUsers).filter(u => u.socketId !== skipperSocketId);
    
    if (potentialPartners.length === 0) return null;

    // Normalize skipper interests to array
    const sInterests = Array.isArray(skipperInterests) ? skipperInterests : [skipperInterests];

    // Score partners
    const scoredPartners = potentialPartners.map(p => {
        const pInterests = Array.isArray(p.interests) ? p.interests : [p.interests];
        const overlap = pInterests.filter(i => sInterests.includes(i));
        return { partner: p, score: overlap.length };
    });

    // Sort by score descending
    scoredPartners.sort((a, b) => b.score - a.score);

    // Pick top tier (those with same highest score)
    const maxScore = scoredPartners[0].score;
    const topPartners = scoredPartners.filter(p => p.score === maxScore);
    
    // Pick random from top tier for variety
    return topPartners[Math.floor(Math.random() * topPartners.length)].partner;
}

// Global user directory for interest lookup
const lobbyUsers = {};

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
        
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: normalizedEmail } })
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" })
        }
        
        // Generate and send OTP
        const otpData = await OTP.createOTP(normalizedEmail)
        
        // Send OTP email
        console.log(`📧 Attempting to send OTP to: ${normalizedEmail}`);
        await sendOTPEmail(normalizedEmail, otpData.code);
        
        console.log(`✓ OTP successfully sent to: ${normalizedEmail}`);
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
        
        // Normalize email
        const normalizedEmail = email.trim().toLowerCase();

        // Final check if user exists
        const existingUser = await User.findOne({ where: { email: normalizedEmail } })
        if(existingUser) return res.status(400).json({ message: "User already exists" })

        const hash = await bcrypt.hash(password, 10)
        
        // Ensure interests is an array
        const interestArray = Array.isArray(interests) ? interests : [interests];

        const user = await User.create({
            name,
            email: normalizedEmail,
            password:hash,
            interests: interestArray,
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
        const otpData = await OTP.createOTP(email)
        
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

const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
const password = req.body.password;

try {
const user = await User.findOne({ where: { email } })

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

// Forgot Password - Generate and send reset link
app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });

        if (!user) {
            // For security, don't reveal if user exists
            return res.json({ message: "If an account exists with this email, a reset link has been sent." });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        user.resetToken = token;
        user.resetTokenExpiry = expiry;
        await user.save();

        // Send email
        await sendPasswordResetEmail(normalizedEmail, token);

        res.json({ message: "If an account exists with this email, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ message: "Error processing request" });
    }
});

// Reset Password - Verify token and update password
app.post("/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const user = await User.findOne({
            where: {
                resetToken: token,
                resetTokenExpiry: { [Op.gt]: new Date() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);
        user.password = hash;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: "Password updated successfully", success: true });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Error resetting password" });
    }
});

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

        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ senderId: userId }, { receiverId: userId }]
            },
            order: [['timestamp', 'DESC']],
            limit: 200
        });
        
        res.json(messages);
    } catch(err) {
        res.status(500).json({message: "Error fetching history"});
    }
});

// Add admin routes
const adminRoutes = require("./routes/admin")
app.use("/api", adminRoutes)

// Wait for database to be ready before starting server
async function startServer() {
    await database.waitForReady();
    
    let waitingUsers = []
    let userSessions = {}

    function broadcastLobbyUsers() {
        const list = Object.values(lobbyUsers).map(u => ({
            socketId: u.socketId,
            name: u.name,
            interests: u.interests,
            avatar: u.avatar || null,
            country: u.country || 'Unknown',
            stars_total: u.stars_total || 0,
            stars_count: u.stars_count || 0,
            hearts_count: u.hearts_count || 0
        }));
        io.emit('lobby-users', list);
    }

    io.on("connection", (socket) => {

        // ===== LOBBY =====
        socket.on("lobby-join", (user) => {
            userSessions[socket.id] = { userId: user._id || user.id, joinTime: Date.now(), user };
            lobbyUsers[socket.id] = {
                socketId: socket.id,
                name: user.name,
                interests: user.interests || [],
                avatar: user.avatar || null,
                country: user.country || 'Unknown',
                stars_total: user.stars_total || 0,
                stars_count: user.stars_count || 0,
                hearts_count: user.hearts_count || 0
            };
            broadcastLobbyUsers();
        });

        socket.on("lobby-leave", () => {
            delete lobbyUsers[socket.id];
            broadcastLobbyUsers();
        });

        // Match request from one user to another
        socket.on("send-match-request", ({ targetSocketId, fromUser }) => {
            io.to(targetSocketId).emit("match-request", {
                fromSocketId: socket.id,
                fromUser
            });
        });

        // Response to a match request
        socket.on("match-response", async ({ accepted, toSocketId, roomId, acceptorUser }) => {
            if (accepted) {
                // Room occupancy check (Max 4)
                const room = io.sockets.adapter.rooms.get(roomId);
                const roomSize = room ? room.size : 0;
                
                if (roomSize >= 4) {
                    socket.emit("match-error", { message: "Room is full (max 4)" });
                    return;
                }

                socket.join(roomId);
                const targetSocket = io.sockets.sockets.get(toSocketId);
                if (targetSocket) targetSocket.join(roomId);

                // Remove from lobby
                delete lobbyUsers[socket.id];
                delete lobbyUsers[toSocketId];
                broadcastLobbyUsers();

                // Redirect both
                io.to(toSocketId).emit("match-accepted", { roomId, partnerUser: acceptorUser || {} });
                socket.emit("match-accepted", { roomId });
            } else {
                io.to(toSocketId).emit("match-declined");
            }
        });

        // ===== CALL ROOM (in call.html) =====
        socket.on("call-join", ({ roomId, user }) => {
            socket.join(roomId);
            userSessions[socket.id] = { userId: user._id || user.id, joinTime: Date.now(), user, roomId };
            // Notify others in room that a peer joined
            socket.to(roomId).emit("peer-joined", { socketId: socket.id, user });
        });

        // WebRTC signaling relay (Targeted for Mesh)
        socket.on("webrtc-offer", ({ roomId, to, offer }) => {
            const senderSession = userSessions[socket.id];
            const sessionUser = senderSession ? senderSession.user : null;
            if (to) {
                io.to(to).emit("webrtc-offer", { from: socket.id, offer, user: sessionUser });
            } else {
                socket.to(roomId).emit("webrtc-offer", { from: socket.id, offer, user: sessionUser });
            }
        });
        socket.on("webrtc-answer", ({ roomId, to, answer }) => {
            const senderSession = userSessions[socket.id];
            const sessionUser = senderSession ? senderSession.user : null;
            if (to) {
                io.to(to).emit("webrtc-answer", { from: socket.id, answer, user: sessionUser });
            } else {
                socket.to(roomId).emit("webrtc-answer", { from: socket.id, answer, user: sessionUser });
            }
        });
        socket.on("webrtc-ice", ({ roomId, to, candidate }) => {
            if (to) {
                io.to(to).emit("webrtc-ice", { from: socket.id, candidate });
            } else {
                socket.to(roomId).emit("webrtc-ice", { from: socket.id, candidate });
            }
        });

        // Live translation captions relay
        socket.on("live-caption", ({ roomId, caption }) => {
            socket.to(roomId).emit("live-caption", caption);
        });

        // ===== MESSAGES =====
        socket.on("message", async (data) => {
            try {
                const rooms = Array.from(socket.rooms);
                const room = rooms.find(r => r !== socket.id) || socket.id;
                socket.to(room).emit("message", data);

                const senderSession = userSessions[socket.id];
                if (!senderSession || !senderSession.userId || senderSession.userId.startsWith('guest-')) return;

                // Find all other registered users in the same room
                for (let key in userSessions) {
                    if (key === socket.id) continue;
                    
                    const otherSocket = io.sockets.sockets.get(key);
                    if (otherSocket && Array.from(otherSocket.rooms).includes(room)) {
                        const receiverSession = userSessions[key];
                        if (receiverSession && receiverSession.userId && !receiverSession.userId.startsWith('guest-')) {
                            await Message.create({
                                senderId: senderSession.userId,
                                senderName: data.sender || senderSession.user.name,
                                receiverId: receiverSession.userId,
                                receiverName: receiverSession.user.name,
                                text: data.text
                            });
                        }
                    }
                }
            } catch(err) {
                console.error("Message error:", err);
            }
        });

        // ===== FRIENDS & SOCIAL =====
        socket.on("friend-request", async ({ toUserId }) => {
            try {
                const sender = userSessions[socket.id];
                if (!sender || !sender.userId) return;

                await Friend.create({
                    requesterId: sender.userId,
                    recipientId: toUserId,
                    status: 'pending'
                });

                // Notify target if online
                for (let sid in userSessions) {
                    if (userSessions[sid].userId === toUserId) {
                        io.to(sid).emit("friend-request-received", { fromUser: sender.user });
                        break;
                    }
                }
            } catch (err) {
                console.error("Friend request error:", err);
            }
        });

        socket.on("friend-accept", async ({ fromUserId }) => {
            try {
                const recipient = userSessions[socket.id];
                if (!recipient || !recipient.userId) return;

                await Friend.findOneAndUpdate(
                    { requesterId: fromUserId, recipientId: recipient.userId },
                    { status: 'accepted' }
                );

                // Notify requester if online
                for (let sid in userSessions) {
                    if (userSessions[sid].userId === fromUserId) {
                        io.to(sid).emit("friend-request-accepted", { byUser: recipient.user });
                        break;
                    }
                }
            } catch (err) {
                console.error("Friend accept error:", err);
            }
        });

        socket.on("get-friend-list", async () => {
            try {
                const session = userSessions[socket.id];
                if (!session || !session.userId) return;

                const friendships = await Friend.findAll({
                    where: {
                        [Op.or]: [
                            { requesterId: session.userId, status: 'accepted' },
                            { recipientId: session.userId, status: 'accepted' }
                        ]
                    }
                });

                const friendIds = friendships.map(f => 
                    f.requesterId === session.userId ? f.recipientId : f.requesterId
                );

                const friends = await User.findAll({ 
                    where: { 
                        _id: { [Op.in]: friendIds } 
                    } 
                });
                const onlineUserIds = Object.values(userSessions).map(s => s.userId);
                
                const list = friends.map(f => ({
                    _id: f._id,
                    name: f.name,
                    interests: f.interests,
                    country: f.country,
                    avatar: f.avatar || null,
                    isOnline: onlineUserIds.includes(f._id)
                }));
                socket.emit("friend-list", list);
            } catch (err) {
                console.error("Get friends error:", err);
            }
        });

        socket.on("get-pending-requests", async () => {
            try {
                const session = userSessions[socket.id];
                if (!session || !session.userId) return;

                const pendingFriends = await Friend.findAll({ 
                    where: {
                        recipientId: session.userId, 
                        status: 'pending' 
                    }
                });
                
                const requesterIds = pendingFriends.map(f => f.requesterId);
                const requesters = await User.findAll({ 
                    where: {
                        _id: { [Op.in]: requesterIds }
                    }
                });

                const pending = pendingFriends.map(f => {
                    const user = requesters.find(u => u._id === f.requesterId);
                    return {
                        requestId: f._id,
                        userId: f.requesterId,
                        name: user ? user.name : 'Unknown',
                        avatar: user ? user.avatar : null,
                        country: user ? user.country : 'Unknown'
                    };
                });
                socket.emit("pending-requests", pending);
            } catch (err) {
                console.error("Get pending requests error:", err);
            }
        });

        socket.on("friend-decline", async ({ fromUserId }) => {
            try {
                const session = userSessions[socket.id];
                if (!session || !session.userId) return;
                await Friend.deleteOne({ 
                    requesterId: fromUserId, 
                    recipientId: session.userId, 
                    status: 'pending' 
                });
            } catch (err) {
                console.error("Friend decline error:", err);
            }
        });

        socket.on("get-recent-chats", async () => {
            try {
                const session = userSessions[socket.id];
                if (!session || !session.userId) return;

                // Find all messages involving the user
                const recentMessages = await Message.findAll({
                    where: {
                        [Op.or]: [{ senderId: session.userId }, { receiverId: session.userId }]
                    },
                    order: [['timestamp', 'DESC']]
                });

                // Group by partner
                const partnerMap = new Map();
                for (const msg of recentMessages) {
                    const partnerId = msg.senderId === session.userId ? msg.receiverId : msg.senderId;
                    if (!partnerMap.has(partnerId)) {
                        partnerMap.set(partnerId, {
                            lastMsgTime: msg.timestamp,
                            lastMsg: msg.text
                        });
                    }
                    if (partnerMap.size >= 20) break;
                }

                const partnerIds = Array.from(partnerMap.keys());
                const users = await User.findAll({ 
                    where: {
                        _id: { [Op.in]: partnerIds }
                    }
                });

                const chats = users.map(u => ({
                    _id: u._id,
                    name: u.name,
                    avatar: u.avatar || null,
                    country: u.country || 'Unknown',
                    lastMsgTime: partnerMap.get(u._id).lastMsgTime,
                    lastMsg: partnerMap.get(u._id).lastMsg
                })).sort((a, b) => new Date(b.lastMsgTime) - new Date(a.lastMsgTime));

                socket.emit("recent-chats", chats);
            } catch (err) {
                console.error("Get recent chats error:", err);
            }
        });

        socket.on("get-chat-history", async ({ withUserId }) => {
            try {
                const session = userSessions[socket.id];
                if (!session || !session.userId) return;
                
                const messages = await Message.findAll({
                    where: {
                        [Op.or]: [
                            { senderId: session.userId, receiverId: withUserId },
                            { senderId: withUserId, receiverId: session.userId }
                        ]
                    },
                    order: [['timestamp', 'ASC']]
                });
                
                socket.emit("chat-history", { withUserId, messages });
            } catch (err) {
                console.error("Get chat history error:", err);
            }
        });

        socket.on("direct-message", async ({ toUserId, text }) => {
            try {
                const sender = userSessions[socket.id];
                if (!sender || !sender.userId) return;

                // Save to DB
                await Message.create({
                    senderId: sender.userId,
                    senderName: sender.user.name,
                    receiverId: toUserId,
                    receiverName: 'Friend',
                    text: text
                });

                // Relay to target if online
                for (let sid in userSessions) {
                    if (userSessions[sid].userId === toUserId) {
                        io.to(sid).emit("direct-message", { fromUserId: sender.userId, text, senderName: sender.user.name });
                        break;
                    }
                }
            } catch (err) {
                console.error("Direct message error:", err);
            }
        });

        socket.on("skip-call", ({ roomId }) => {
            // Remove user from room
            socket.leave(roomId);
            if (userSessions[socket.id]) {
                delete userSessions[socket.id].roomId;
            }
            
            // Notify others
            socket.to(roomId).emit("peer-left", { socketId: socket.id, name: userSessions[socket.id]?.user?.name || 'Partner' });

            // Automatically try to match them with someone in the lobby using interest-based logic
            const skipper = lobbyUsers[socket.id];
            const partner = findBestMatch(socket.id, skipper ? skipper.interests : []);

            if (partner) {
                const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                
                // Move both to new room
                socket.join(newRoomId);
                const partnerSocket = io.sockets.sockets.get(partner.socketId);
                
                if (partnerSocket) {
                    partnerSocket.join(newRoomId);
                    
                    // Remove partner from lobby list as they are now in a call
                    delete lobbyUsers[partner.socketId];
                    broadcastLobbyUsers();

                    // Inform both
                    socket.emit("match-accepted", { roomId: newRoomId, partnerUser: partner });
                    partnerSocket.emit("match-accepted", { roomId: newRoomId, partnerUser: skipper || { name: 'Unknown', avatar: null } });
                }
            } else {
                // Stay in lobby if no one available
                socket.emit("no-partners-available");
            }
        });

        socket.on("rate-user", async ({ targetUserId, stars, liked }) => {
            try {
                const target = await User.findById(targetUserId);
                if (!target) return;

                target.stars_total = (target.stars_total || 0) + (stars || 0);
                target.stars_count = (target.stars_count || 0) + 1;
                if (liked) {
                    target.hearts_count = (target.hearts_count || 0) + 1;
                }

                await target.save();

                // Update lobby data if user is there
                for (let sid in lobbyUsers) {
                    if (lobbyUsers[sid].userId === targetUserId) {
                        lobbyUsers[sid].stars_total = target.stars_total;
                        lobbyUsers[sid].stars_count = target.stars_count;
                        lobbyUsers[sid].hearts_count = target.hearts_count;
                        break;
                    }
                }
                broadcastLobbyUsers();
            } catch (err) {
                console.error("Rate user error:", err);
            }
        });

        // ===== DISCONNECT =====
        socket.on("disconnect", async () => {
            // Notify call room partners
            const session = userSessions[socket.id];
            if (session && session.roomId) {
                socket.to(session.roomId).emit('peer-left', {
                    socketId: socket.id,
                    name: session.user ? session.user.name : 'Partner'
                });
            }

            if (userSessions[socket.id]) {
                delete userSessions[socket.id];
            }
            if (lobbyUsers[socket.id]) {
                delete lobbyUsers[socket.id];
                broadcastLobbyUsers();
            }
            waitingUsers = waitingUsers.filter(u => u.socket !== socket.id);
        });

    });

    server.listen(PORT, () => {
        console.log(`Server running on ${PORT}`)
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
