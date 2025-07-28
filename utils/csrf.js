const csrf = require('csurf');

// This sets up csurf with a cookie for SPA use
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,     
    secure: true,
    sameSite: 'strict',   
    secure: process.env.NODE_ENV === 'production',
  }
});

module.exports = csrfProtection;
