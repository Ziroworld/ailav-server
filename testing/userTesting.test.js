// usertesting.js

const express = require('express');
const request = require('supertest');

// Create a new Express app instance for testing
const app = express();
app.use(express.json());

// Dummy controller functions simulating the actual behavior

// Simulates findAllUser controller – returns a working message.
const findAllUser = async (req, res) => {
  // In actual implementation, users would be fetched from the DB.
  res.status(200).send('User route is working!');
};

// Simulates findById controller – returns a dummy user object.
const findById = async (req, res) => {
  // For testing purposes, return a dummy user with id and name.
  res.status(200).json({ id: req.params.id, name: "Dummy User" });
};

// Simulates deleteById controller – returns a success deletion message.
const deleteById = async (req, res) => {
  // In a real case, the user would be deleted.
  res.status(204).send("Data has been deleted.");
};

// Simulates update controller – returns an updated dummy user object.
const update = async (req, res) => {
  // For testing, simply merge the dummy id and request body.
  res.status(201).json({ id: req.params.id, ...req.body });
};

// Simulates save controller – returns a created dummy user object.
const save = async (req, res) => {
  // In a real scenario, the new user would be saved in the DB.
  res.status(201).json({ id: "dummyId", ...req.body });
};

// Setup routes as per your provided routes
const router = express.Router();
router.get('/user', findAllUser);
router.get('/:id', findById);
router.delete('/:id', deleteById);
router.put('/:id', update);
// Adding a POST route for testing the save controller
router.post('/', save);

// Mount the router on the path used in your app
app.use('/api/V3/users', router);

// Testing section using Jest and Supertest
describe('User API Endpoints', () => {
  // Test case for GET /api/V3/users/user (findAllUser)
  test('GET /api/V3/users/user should return working message', async () => {
    const res = await request(app).get('/api/V3/users/user');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('User route is working!');
  });

  // Test case for GET /api/V3/users/:id (findById)
  test('GET /api/V3/users/:id should return a dummy user', async () => {
    const dummyId = '12345';
    const res = await request(app).get(`/api/V3/users/${dummyId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', dummyId);
    expect(res.body).toHaveProperty('name', 'Dummy User');
  });

  // Test case for DELETE /api/V3/users/:id (deleteById)
test('DELETE /api/V3/users/:id should simulate deletion', async () => {
  const dummyId = '12345';
  const res = await request(app).delete(`/api/V3/users/${dummyId}`);
  expect(res.statusCode).toBe(204);
  // Since 204 should not have a body, expect empty response text.
  expect(res.text).toBe("");
});


  // Test case for PUT /api/V3/users/:id (update)
  test('PUT /api/V3/users/:id should simulate updating a user', async () => {
    const dummyId = '12345';
    const dummyData = { name: 'Updated User', age: 35 };
    const res = await request(app)
      .put(`/api/V3/users/${dummyId}`)
      .send(dummyData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', dummyId);
    expect(res.body).toMatchObject(dummyData);
  });

  // Test case for POST /api/V3/users (save)
  test('POST /api/V3/users should simulate saving a new user', async () => {
    const dummyData = { name: 'New Dummy User', age: 28, email: 'dummy@example.com' };
    const res = await request(app)
      .post('/api/V3/users')
      .send(dummyData);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 'dummyId');
    expect(res.body).toMatchObject(dummyData);
  });
});
