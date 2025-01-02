require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const Credential = require('../model/credentialModel');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error('SECRET_KEY is not defined. Check your .env file or environment variables.');
}

const register = async (req, res) => {
    try {
        const { username, password, role, name, age, email, phone } = req.body;
        console.log(req.body);

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ name, age, email, phone });
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

        res.status(201).json({
            message: 'User and credentials created successfully.',
            user: {
                name: user.name,
                age: user.age,
                email: user.email,
                phone: user.phone,
            },
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
            { username: user.username, role: user.role, userId: user._id }, // Payload
            SECRET_KEY, // Secret key
            { expiresIn: '1h' } // Token expiration
        );

        console.log('User logged in successfully');
        res.status(200).json({
            message: 'Login successful',
            token, // Send token to the client
        });
    } catch (e) {
        console.error('Error logging in:', e.message);
        res.status(500).json({ message: e.message });
    }
};


module.exports = {
    register,
    login,
};