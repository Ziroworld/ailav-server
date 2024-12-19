const User = require('../model/userModel');
const { generateToken } = require('../security/userSecurity');

const findAllUser = async (req, res) => {
    try {
        const users = await User.find();
        console.log(users);
        res.status(200).json(users);
    }
    catch (e) {
        res.json(e);
    }
};

const createUser = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        
        // Generate the JWT token after the user is created
        const token = generateToken(user);

        // Send the response with the token
        res.status(201).json({
            message: 'User created successfully',
            user: {
                username: user.username,
                name: user.name,
                age: user.age,
                email: user.email,
                phone: user.phone
            },
            token: token
        });

        console.log('User registered successfully');
    } catch (e) {
        console.error('Error creating user:', e.message);
        res.status(400).json({ message: e.message });
    }
};

module.exports = { findAllUser, createUser };