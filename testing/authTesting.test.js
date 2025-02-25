// authTesting.test.js

const express = require('express');
const request = require('supertest');
const multer = require('multer');

// Setup multer for file uploads (store files in memory for testing)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create an Express app instance for testing
const app = express();
app.use(express.json());

// For testing getCurrentUser, add middleware to simulate an authenticated user.
const dummyAuthMiddleware = (req, res, next) => {
  req.user = { userId: 'dummyUserId' };
  next();
};

// Setup routes with dummy responses simulating the real controllers

const router = express.Router();

// POST /register - simulate user registration
router.post('/register', (req, res) => {
  // Normally, registration would hash password, save user/credential, etc.
  res.status(201).json({
    message: 'User and credentials created successfully.',
    user: {
      name: req.body.name,
      age: req.body.age,
      email: req.body.email,
      phone: req.body.phone,
      image: req.body.image,
      username: req.body.username,
    },
    token: 'dummyToken'
  });
});

// POST /login - simulate user login
router.post('/login', (req, res) => {
  // Normally, login would validate credentials, generate a JWT, etc.
  res.status(200).json({
    message: 'Login successful',
    token: 'dummyToken',
    role: 'customer',
    userId: 'dummyUserId',
    username: req.body.username,
  });
});

// POST /requestOtp - simulate OTP request
router.post('/requestOtp', (req, res) => {
  // Normally, would check email exists and send OTP via email.
  res.status(200).json({ message: 'OTP sent to your email' });
});

// POST /verifyOtp - simulate OTP verification
router.post('/verifyOtp', (req, res) => {
  // Normally, would check the OTP store for a valid OTP.
  res.status(200).json({ message: 'OTP verified successfully', userId: 'dummyUserId' });
});

// POST /resetPassword - simulate password reset
router.post('/resetPassword', (req, res) => {
  // Normally, would update the credentials in the DB.
  res.status(200).json({ message: 'Password reset successfully' });
});

// POST /uploadImage - simulate image upload (using multer)
router.post('/uploadImage', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No files were uploaded." });
  } else {
    // For simulation, return the original file name from memory storage.
    res.status(200).json({ success: true, data: req.file.originalname });
  }
});

// GET /currentUser - simulate fetching current user details
router.get('/currentUser', dummyAuthMiddleware, (req, res) => {
  res.status(200).json({
    id: 'dummyUserId',
    name: 'Dummy User',
    age: 30,
    email: 'dummy@example.com',
    phone: '1234567890',
    image: 'dummyImage.jpg',
    role: 'customer',
    createdAt: new Date().toISOString(),
    username: 'dummyUsername'
  });
});

// Mount the router on the app
app.use('/api/V3/auth', router);

// Begin tests using Jest and Supertest
describe('Authentication API Endpoints', () => {
  // Test for registration
  test('POST /api/V3/auth/register should simulate registration', async () => {
    const dummyData = {
      username: 'testuser',
      password: 'password123',
      role: 'customer',
      name: 'Test User',
      age: 25,
      email: 'test@example.com',
      phone: '1234567890',
      image: 'test.jpg'
    };
    const res = await request(app)
      .post('/api/V3/auth/register')
      .send(dummyData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User and credentials created successfully.');
    expect(res.body).toHaveProperty('token', 'dummyToken');
    expect(res.body.user).toMatchObject({
      name: dummyData.name,
      age: dummyData.age,
      email: dummyData.email,
      phone: dummyData.phone,
      image: dummyData.image,
      username: dummyData.username,
    });
  });

  // Test for login
  test('POST /api/V3/auth/login should simulate login', async () => {
    const dummyData = { username: 'testuser', password: 'password123' };
    const res = await request(app)
      .post('/api/V3/auth/login')
      .send(dummyData);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body).toHaveProperty('token', 'dummyToken');
    expect(res.body).toHaveProperty('role', 'customer');
    expect(res.body).toHaveProperty('userId', 'dummyUserId');
    expect(res.body).toHaveProperty('username', dummyData.username);
  });

  // Test for request OTP
  test('POST /api/V3/auth/requestOtp should simulate OTP request', async () => {
    const res = await request(app)
      .post('/api/V3/auth/requestOtp')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'OTP sent to your email');
  });

  // Test for verify OTP
  test('POST /api/V3/auth/verifyOtp should simulate OTP verification', async () => {
    const res = await request(app)
      .post('/api/V3/auth/verifyOtp')
      .send({ email: 'test@example.com', otp: '123456' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'OTP verified successfully');
    expect(res.body).toHaveProperty('userId', 'dummyUserId');
  });

  // Test for reset password
  test('POST /api/V3/auth/resetPassword should simulate password reset', async () => {
    const res = await request(app)
      .post('/api/V3/auth/resetPassword')
      .send({ userId: 'dummyUserId', newPassword: 'newpassword', email: 'test@example.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Password reset successfully');
  });

  // Test for image upload - success scenario
  test('POST /api/V3/auth/uploadImage should simulate a successful image upload', async () => {
    const res = await request(app)
      .post('/api/V3/auth/uploadImage')
      .attach('file', Buffer.from('dummy content'), 'testImage.jpg');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    // Expect the original file name to be returned
    expect(res.body).toHaveProperty('data', 'testImage.jpg');
  });

  // Test for image upload - failure scenario (no file provided)
  test('POST /api/V3/auth/uploadImage should return error when no file is uploaded', async () => {
    const res = await request(app)
      .post('/api/V3/auth/uploadImage');
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'No files were uploaded.');
  });

  // Test for get current user
  test('GET /api/V3/auth/currentUser should return dummy current user details', async () => {
    const res = await request(app).get('/api/V3/auth/currentUser');
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      id: 'dummyUserId',
      name: 'Dummy User',
      email: 'dummy@example.com',
      phone: '1234567890',
      image: 'dummyImage.jpg',
      role: 'customer',
      username: 'dummyUsername'
    });
    // Check that createdAt exists and is a valid string
    expect(typeof res.body.createdAt).toBe('string');
  });
});
