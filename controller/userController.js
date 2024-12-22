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

const findById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).json(user);
    }
    catch (e) {
        console.error('Error finding users:', e.message);
        res.status(500).json({ message: e.message });
    }
};

const deleteById = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(204).json("Data has been deleted.");
    }
    catch (e) {
        console.error('Error deleting user:', e.message);
        res.status(500).json({ message: e.message });
    }
};

const update = async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(201).json(updatedUser);
    }
    catch (e) {
        console.error('Error updating user:', e.message);
        res.status(500).json({ message: e.message });
    }
};


module.exports = { 
    findAllUser, 
    createUser,
    findById,
    deleteById,
    update,
};