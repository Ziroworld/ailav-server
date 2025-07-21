const Joi = require('joi');
const User = require('../model/userModel');

// --- Registration (User Creation) ---
const userValidationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required().trim(),
  name: Joi.string().min(3).max(30).required(),
  age: Joi.number().integer().min(18).max(99).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{9,15}$/).required(),
  password: Joi.string().min(8).max(100).required(),
  createdAt: Joi.date().default(() => new Date()),
  // ❌ NO role accepted from client
});

function userValidation(req, res, next) {
  const { error } = userValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(442).json({ message: "Validation error", errors: error.details });
  }
  next();
}

// --- Login ---
const loginValidationSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
  // ❌ NO role, NO admin fields allowed!
});

function loginValidation(req, res, next) {
  const { error } = loginValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(442).json({ message: "Validation error", errors: error.details });
  }
  next();
}

// --- Email Validation (For OTP) ---
const validateEmail = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Email not found' });
  }
  next();
};

// --- User Update (NO role allowed) ---
const updateUserValidationSchema = Joi.object({
  name: Joi.string().min(3).max(30),
  age: Joi.number().integer().min(18).max(99),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[0-9]{9,15}$/),
  password: Joi.string().min(8).max(100),
  // ❌ Never accept role
}).min(1);

function updateUserValidation(req, res, next) {
  const { error } = updateUserValidationSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(442).json({ message: "Validation error", errors: error.details });
  }
  next();
}

module.exports = { 
  userValidation,
  validateEmail,
  loginValidation,
  updateUserValidation,
};
