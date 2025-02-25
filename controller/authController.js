require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const Credential = require('../model/credentialModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const SECRET_KEY = process.env.SECRET_KEY;

const otpStore = new Map();

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined. Check your .env file or environment variables.');
}

const register = async (req, res) => {
    try {
        const { username, password, role, name, age, email, phone, image } = req.body;
        console.log(req.body);

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ name, age, email, phone, image });
        console.log(user)
        await user.save();

        // Create a new credential entry
        const credentials = new Credential({
            username,
            password: hashedPassword,
            role: role || 'customer',
            userId: user._id,
        });
        await credentials.save();
        console.log('Credentials Created:', credentials);

        const token = jwt.sign(
            { username: credentials.username, role: credentials.role, userId: user._id },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User and credentials created successfully.',
            user: {
                name: user.name,
                age: user.age,
                email: user.email,
                phone: user.phone,
                image: user.image,
                username: credentials.username,
            },
            token, // Send token to the client
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

        // Generate JWT
        const token = jwt.sign(
            { username: user.username, role: user.role, userId: user.userId }, // Payload
            SECRET_KEY, // Secret key
            { expiresIn: '1h' } // Token expiration
        );

        console.log('User logged in successfully');
        res.status(200).json({
            message: 'Login successful',
            token, // Send token to the client
            role: user.role, // send role to the client
            userId: user.userId, //
            username: user.username,
        });
    } catch (e) {
        console.error('Error logging in:', e.message);
        res.status(500).json({ message: e.message });
    }
};

// Request OTP: Validate email, generate OTP, store it and send via email.
const requestOtp = async (req, res) => {
    try {
      const { email } = req.body;
      // console.log($email);
      console.log("email");
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }
      // Generate a 6-digit OTP and store it with an expiration (10 minutes).
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 });
      console.log("EMAIL:", process.env.EMAIL);
console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD);
      
      // Send OTP via email (using NodeMailer or similar)
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL, // Your email
          pass: process.env.EMAIL_PASSWORD, // Your email password
        },
      });
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
      };
      await transporter.sendMail(mailOptions);
      
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
    requestOtp,
    resetPassword,
    uploadImage,
    getCurrentUser,
    verifyOtp,
};