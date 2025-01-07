const User = require('../model/userModel');

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

const save = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    }
    catch (e) {
        console.error('Error saving user:', e.message);
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
    findById,
    deleteById,
    update,
    save,
};