require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const Credential = require('../model/credentialModel');
const jwt = require('jsonwebtoken');
const { sendVerificationCode } = require('../utils/emailService');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// ---- OTP store, other unchanged code remains ----
const otpStore = new Map();

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error('Token secrets not defined. Check your .env file.');
}

// Helper functions:
function generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}
function generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

// Store valid refresh tokens for demo (ideally, use DB or session model)
const refreshTokens = new Set();

// ----- CONTROLLER FUNCTIONS -----

const register = async (req, res) => {
    try {
        const { username, password, name, age, email, phone, image } = req.body;
        // Always assign "customer" as the default
        const role = "customer";

        // 1. Make sure username/email/phone are unique
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) return res.status(409).json({ message: "Email or phone already in use." });

        const existingCred = await Credential.findOne({ username });
        if (existingCred) return res.status(409).json({ message: "Username already taken." });

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create new user document
        const user = new User({ name, age, email, phone, image });
        await user.save();

        // 4. Create credential (ALWAYS customer unless admin inserted by dev/DB)
        const credentials = new Credential({
            username,
            password: hashedPassword,
            role, // <-- Always customer
            userId: user._id,
        });
        await credentials.save();

        // 5. Build payload (role is "customer")
        const payload = {
            username,
            userId: user._id,
            role,
            email,
        };

        // 6. Create tokens
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);
        refreshTokens.add(refreshToken);

        // 7. Set refreshToken as HttpOnly cookie (optional but best practice)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 8. Respond
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

        // Find user by username
        const user = await Credential.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Fetch user info for payload
        const userData = await User.findById(user.userId);
        const payload = {
            userId: user.userId,
            username: user.username,
            role: user.role,
            email: userData.email
        };

        // Issue tokens
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);
        refreshTokens.add(refreshToken); // Save for later verification (for demo only; production=store in DB!)

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

// ---- REFRESH TOKEN ENDPOINT ----

const refreshToken = (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "No refresh token provided." });
    if (!refreshTokens.has(token)) return res.status(403).json({ message: "Refresh token not valid." });

    try {
        const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
        // Remove sensitive info from payload if you wish before sending
        const newAccessToken = generateAccessToken({
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            email: payload.email
        });
        res.json({ accessToken: newAccessToken });
    } catch (e) {
        return res.status(403).json({ message: "Invalid or expired refresh token." });
    }
};

// Request OTP: Validate email, generate OTP, store it and send via email.
const requestOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }
        // Generate OTP & store
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });

        // Use your service!
        await sendVerificationCode(email, otp);

        res.status(200).json({ message: 'OTP sent to your email' });
    } catch (error) {
        console.error('Error in requestOtp:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

  // Verify OTP: Check if the provided OTP is valid for the given email.
  const verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
      const storedOtp = otpStore.get(email);
      if (!storedOtp || storedOtp.otp !== otp || storedOtp.expiresAt < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
      }
      // If OTP is valid, fetch user id and return it (or simply indicate success).
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'OTP verified successfully', userId: user._id });
    } catch (error) {
      console.error('Error in verifyOtp:', error.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
  // Reset Password: Once OTP is verified, update the user's password.
  const resetPassword = async (req, res) => {
    try {
      const { userId, newPassword, email } = req.body;
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Find credentials by userId (you might need to adjust this if your Credential model is separate)
      const credentials = await Credential.findOne({ userId });
      if (!credentials) {
        return res.status(404).json({ message: 'Credentials not found' });
      }
      
      credentials.password = hashedPassword;
      await credentials.save();
      
      // Remove the OTP from the store (we can use email to delete it)
      otpStore.delete(email);
      
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

        // ✅ Fetch user role from Credential model
        const credential = await Credential.findOne({ userId: req.user.userId }).select("role");
        if (!credential) {
            return res.status(404).json({ message: "User credentials not found" });
        }

        // ✅ Combine user data with role
        const userData = {
            id: user._id, 
            name: user.name,
            age: user.age,
            email: user.email,
            phone: user.phone,
            image: user.image,
            role: credential.role, // ✅ Attach role from Credential collection
            createdAt: user.createdAt,
            username: credential.username,
        };

        console.log("Found user:", userData); // ✅ Debugging
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