const Joi = require('joi');
const User = require('../model/userModel');

const userValidationSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required()
        .trim(),

    name: Joi.string()
        .min(3)
        .max(30)
        .required(),

    age: Joi.number()
        .integer()
        .min(18)
        .max(99)
        .required(),
        
    email: Joi.string()
        .email()
        .required(),

    phone: Joi.string()
        .pattern(/^[0-9]{9,15}$/)
        .required(),

    password: Joi.string()
        .min(8)
        .max(100)
        .required(),
    

    createdAt: Joi.date().default(() => new Date()),

});

function userValidation(req, res, next) {
    const { error } = userValidationSchema.validate(req.body, { abortEarly: false }); // validate request body
    if (error) {
        return res.status(442).json({ message: "Validation error", errors: error.details });
    }
    next(); // procced to controller if validation passes 
}


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

module.exports = { 
    userValidation,
    validateEmail,
};