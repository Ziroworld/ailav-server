const User = require('../model/userModel');
const Credential = require('../model/credentialModel');

const findAllUser = async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $lookup: {
            from: "credentials", // This is the collection name for Credential (Mongoose pluralizes it by default)
            localField: "_id",
            foreignField: "userId",
            as: "credential"
          }
        },
        {
          $unwind: {
            path: "$credential",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            name: 1,
            age: 1,
            email: 1,
            phone: 1,
            createdAt: 1,
            image: 1,
            username: "$credential.username",
            role: "$credential.role"
          }
        }
      ]);
      res.status(200).json(Array.isArray(users) ? users : []);
      console.log(users);
    } catch (e) {
      console.error('Error fetching users:', e);
      res.status(500).json({ message: e.message });
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
      // First delete the user
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (deletedUser) {
        // Then delete the corresponding credential using the user's _id
        await Credential.findOneAndDelete({ userId: req.params.id });
      }
      res.status(204).json("Data has been deleted.");
    } catch (e) {
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