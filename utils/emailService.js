const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.EMAIL_PASSWORD, // Your email password
    },
});

const sendVerificationCode = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${code}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Verification email sent to:', email);
    } catch (error) {
        console.error('Error sending verification email:', error.message);
        throw new Error('Unable to send verification email');
    }
};

module.exports = {
    sendVerificationCode,
};
