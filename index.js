require('dotenv').config();
const fs = require('fs');
const https = require('https');
const http = require('http');
const connectDB = require('./config/databaseConfig');
const app = require('./app/app'); // <--- Import your Express app
const path = require("path");

// --- connect to your MongoDB
connectDB();

// --- SSL certificate setup
const isDocker = process.env.IS_DOCKER === 'true';

const keyPath = isDocker
  ? path.join(__dirname, 'certs/key.pem') // inside Docker
  : path.join(__dirname, '../certificates-for-https/key.pem'); // local

const certPath = isDocker
  ? path.join(__dirname, 'certs/cert.pem')
  : path.join(__dirname, '../certificates-for-https/cert.pem');

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};
const HTTPS_PORT = process.env.PORT || 8080;
const HTTP_PORT = 8081;

// --- Start HTTPS servers
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
