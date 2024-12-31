const bcrypt = require('bcryptjs');
const User = require('../model/userModel');
const Credential = require('../model/credentialModel');

const register = async (req, res) => {
    try {
        const { username, password, role, name, age, email, phone } = req.body;
        console.log(req.body);
        // if (!username || username.trim() === '') {
        //     return res.status(400).json({ message: 'Username is required' });
        // }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({ name, age, email, phone });
        console.log(user)
        await user.save();
        console.log('User ID:', user._id);


        console.log('User Name:',username);

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

module.exports = {
    register,
};