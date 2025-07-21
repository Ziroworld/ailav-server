const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendVerificationCode = async (email, code) => {
    // Use your provided logo URL directly
    const logoUrl = "https://res.cloudinary.com/dx3bvihmi/image/upload/v1752933897/bg_removed_logo_nfftld.png";

    const mailOptions = {
        from: `"AILAV Security Team" <${process.env.EMAIL}>`,
        to: email,
        subject: '🔐 Your AILAV Verification Code',
        html: `
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%); padding:40px 0; min-height:100vh; font-family: 'Segoe UI', Arial, sans-serif;">
          <div style="max-width:430px; margin:40px auto; background:#fff; border-radius:18px; box-shadow:0 4px 32px #0001; padding:32px 28px 24px 28px;">
            <div style="text-align:center; margin-bottom:18px;">
              <img src="${logoUrl}" alt="AILAV Logo" style="height:60px; border-radius:16px; margin-bottom:6px;" />
              <h2 style="font-weight:900; letter-spacing:2px; margin:10px 0 0 0; color:#0284c7; font-size:2rem;">
                AILAV
                <span style="font-size:18px; font-weight:600; color:#64748b;">Security</span>
              </h2>
            </div>
            <div style="margin-bottom:20px; text-align:center;">
              <span style="display:inline-block; background:#e0f2fe; color:#0284c7; font-weight:600; font-size:1.25rem; padding:7px 26px; border-radius:14px;">
                <span style="font-size:18px; vertical-align:middle; margin-right:6px;">🔑</span>
                Verification Code
              </span>
            </div>
            <p style="color:#334155; font-size:1rem; margin-bottom:22px; text-align:center;">
              Hi there,<br>
              To continue your secure journey with <b>AILAV</b>, please enter the verification code below.
            </p>
            <div style="background:#f1f5f9; border:2px dashed #0284c7; border-radius:16px; text-align:center; padding:24px 0; margin-bottom:26px;">
              <span style="font-size:1.8rem; letter-spacing:6px; color:#0284c7; font-weight:bold; background: #fff; border-radius:9px; padding:10px 32px; border: 1.5px solid #38bdf8; box-shadow:0 2px 8px #0284c730;">
                ${code}
              </span>
            </div>
            <p style="font-size:1rem; color:#64748b; text-align:center; margin-bottom:18px;">
              Please do <b>not share</b> this code with anyone.<br/>
              This code is valid for <b>10 minutes</b>.
            </p>
            <div style="margin:20px 0 10px 0; text-align:center;">
              <img src="https://img.icons8.com/fluency/48/lock--v1.png" alt="Secure" style="height:38px; margin-bottom:7px;" />
              <div style="color:#0f172a; font-size:1.08rem; font-weight:600;">AILAV protects your security, always.</div>
            </div>
            <div style="border-top:1px solid #e2e8f0; margin-top:24px; padding-top:14px; color:#94a3b8; font-size:13px; text-align:center;">
              &copy; ${new Date().getFullYear()} <a href="https://ailav.com" style="color:#0284c7; text-decoration:none;">Ailav.com</a> • Powered by Next-Gen Security
            </div>
          </div>
        </div>
        `
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