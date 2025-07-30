require('dotenv').config();
const fs = require('fs');
const https = require('https');
const http = require('http');
const connectDB = require('./config/databaseConfig');
const app = require('./app/app'); // <--- Import your Express app

// --- connect to your MongoDB
connectDB();

// --- SSL certificate setup
const options = {
  key: fs.readFileSync('R:\College data\Semester 5\Web_Application\certificates-for-https\key.pem'),
  cert: fs.readFileSync('R:\College data\Semester 5\Web_Application\certificates-for-https\cert.pem')
};

const HTTPS_PORT = process.env.PORT || 8080;
const HTTP_PORT = 8081;

// --- Start HTTPS server
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS Server running at https://localhost:${HTTPS_PORT}`);
});

// --- Start HTTP redirect server
http.createServer((req, res) => {
  let host = req.headers.host.replace(/:\d+$/, ':' + HTTPS_PORT);
  res.writeHead(301, { Location: `https://${host}${req.url}` });
  res.end();
}).listen(HTTP_PORT, () => {
  console.log(`🚦 HTTP redirect server running on port ${HTTP_PORT} (redirects all traffic to HTTPS)`);
});
