require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const Credential = require('../model/credentialModel');
const jwt = require('jsonwebtoken');
const { sendVerificationCode } = require('../utils/emailService');
const logActivity = require('../utils/logActivity');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const otpStore = new Map();

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error('Token secrets not defined. Check your .env file.');
}

function generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
function generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}
const refreshTokens = new Set();

const register = async (req, res) => {
    try {
        const { username, password, name, age, email, phone, image } = req.body;
        const role = "customer";

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) return res.status(409).json({ message: "Email or phone already in use." });

        const existingCred = await Credential.findOne({ username });
        if (existingCred) return res.status(409).json({ message: "Username already taken." });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, age, email, phone, image });
        await user.save();

        const credentials = new Credential({
            username,
            password: hashedPassword,
            role,
            userId: user._id,
        });
        await credentials.save();

        const payload = {
            username,
            userId: user._id,
            role,
            email,
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);
        refreshTokens.add(refreshToken);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" || true, // allow in local https
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        await logActivity(req, "User Registration", { userId: user._id, username, email });

        res.status(201).json({
            message: 'User and credentials created successfully.',
            user: {
                name: user.name,
                age: user.age,
                email: user.email,
                phone: user.phone,
                image: user.image,
                username: credentials.username,
                role: credentials.role,
            },
            accessToken,
        });

        console.log('User and credentials registered successfully');
    } catch (e) {
        console.error('Error creating user:', e.message);
        res.status(400).json({ message: e.message });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await Credential.findOne({ username });
        if (!user) {
            await logActivity(req, "Failed Login Attempt", { username });
            return res.status(404).json({ message: 'User not found' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logActivity(req, "Failed Login Attempt", { username });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const userData = await User.findById(user.userId);
        const payload = {
            userId: user.userId,
            username: user.username,
            role: user.role,
            email: userData.email
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);
        refreshTokens.add(refreshToken);

        await logActivity(req, "User Login", { userId: user.userId, username });

        res.status(200).json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            role: user.role,
            userId: user.userId,
            username: user.username,
        });
    } catch (e) {
        console.error('Error logging in:', e.message);
        res.status(500).json({ message: e.message });
    }
};

const refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "No refresh token provided." });
    if (!refreshTokens.has(token)) return res.status(403).json({ message: "Refresh token not valid." });

    try {
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            email: payload.email
        });

        await logActivity(req, "Refresh Token Used", { userId: payload.userId, username: payload.username });

        res.json({ accessToken: newAccessToken });
    } catch (e) {
        return res.status(403).json({ message: "Invalid or expired refresh token." });
    }
};

const requestOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            await logActivity(req, "Failed OTP Request", { email });
            return res.status(404).json({ message: 'Email not found' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

        await sendVerificationCode(email, otp);

        await logActivity(req, "OTP Requested", { email, userId: user._id });

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Error in requestOtp:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const storedOtp = otpStore.get(email);
        if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
            await logActivity(req, "Failed OTP Verification", { email, attemptedOtp: otp });
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await logActivity(req, "OTP Verified", { email, userId: user._id });

        res.status(200).json({ message: 'OTP verified successfully', userId: user._id });
    } catch (error) {
        console.error('Error in verifyOtp:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { userId, newPassword, email } = req.body;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const credentials = await Credential.findOne({ userId });
        if (!credentials) {
            return res.status(404).json({ message: 'Credentials not found' });
        }

        credentials.password = hashedPassword;
        await credentials.save();
        otpStore.delete(email);

        await logActivity(req, "Password Reset", { userId, email });

        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error in resetPassword:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No files were uploaded." });
        } else {
            await logActivity(req, "Profile Image Uploaded", { userId: req.user ? req.user.userId : null, filename: req.file.filename });

            res.status(200).json({ success: true, data: req.file.filename });
        }
    } catch (error) {
        res.status(500).json(error);
    }
}

const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const credential = await Credential.findOne({ userId: req.user.userId }).select("role");
        if (!credential) {
            return res.status(404).json({ message: "User credentials not found" });
        }

        const userData = {
            id: user._id,
            name: user.name,
            age: user.age,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: credential.role,
            createdAt: user.createdAt,
            username: credential.username,
        };

        await logActivity(req, "Viewed Profile", { userId: user._id });

        console.log("Found user:", userData);
        res.status(200).json(userData);
    } catch (error) {
        console.error("Error fetching user:", error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    requestOtp,
    resetPassword,
    uploadImage,
    getCurrentUser,
    verifyOtp,
};
