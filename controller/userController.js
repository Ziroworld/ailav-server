const User = require('../model/userModel');
const Credential = require('../model/credentialModel');
const logActivity = require("../utils/logActivity");
const sanitizeHtml = require('../utils/sanitizeHtml'); // <-- Import sanitizer

const findAllUser = async (req, res) => {
    try {
      const users = await User.aggregate([
        {
          $lookup: {
            from: "credentials",
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
      await logActivity(req, "Fetched All Users", { requestedBy: req.user ? req.user._id : "unknown" });

      res.status(200).json(Array.isArray(users) ? users : []);
      console.log(users);
    } catch (e) {
      console.error('Error fetching users:', e);
      res.status(500).json({ message: 'Internal server error' });
    }
};

const save = async (req, res) => {
    try {
        // Sanitize all string fields
        let payload = { ...req.body };
        if (payload.name) payload.name = sanitizeHtml(payload.name);
        if (payload.email) payload.email = sanitizeHtml(payload.email);
        if (payload.phone) payload.phone = sanitizeHtml(payload.phone);
        if (payload.image) payload.image = sanitizeHtml(payload.image);

        const user = new User(payload);
        await user.save();
        await logActivity(req, "Created User", { userId: user._id });

        res.status(201).json(user);
    }
    catch (e) {
        console.error('Error saving user:', e.message);
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const findById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        await logActivity(req, "Fetched User By ID", { requestedBy: req.user ? req.user._id : "unknown", targetUserId: req.params.id });
        res.status(200).json(user);
    }
    catch (e) {
        console.error('Error finding users:', e.message);
        res.status(500).json({ message: e.message });
    }
};

const deleteById = async (req, res) => {
    try {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (deletedUser) {
        await Credential.findOneAndDelete({ userId: req.params.id });
        await logActivity(req, "Deleted User", { deletedUserId: req.params.id, deletedBy: req.user ? req.user._id : "unknown" });
      }
      res.status(204).json("Data has been deleted.");
    } catch (e) {
      console.error('Error deleting user:', e.message);
      res.status(500).json({ message: e.message });
    }
};

const update = async (req, res) => {
    try {
        let payload = { ...req.body };
        if (payload.name) payload.name = sanitizeHtml(payload.name);
        if (payload.email) payload.email = sanitizeHtml(payload.email);
        if (payload.phone) payload.phone = sanitizeHtml(payload.phone);
        if (payload.image) payload.image = sanitizeHtml(payload.image);

        const updatedUser = await User.findByIdAndUpdate(req.params.id, payload, { new: true });
        await logActivity(req, "Updated User", { updatedUserId: req.params.id, updatedBy: req.user ? req.user._id : "unknown", update: payload });
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
