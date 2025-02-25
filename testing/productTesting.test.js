// productTesting.test.js

const express = require('express');
const request = require('supertest');

// Dummy implementations for product controllers simulating expected responses

// Simulate "createProduct" endpoint. 
// If the provided categoryId equals "validCategoryId", return a dummy product,
// otherwise return a 400 error.
const createProduct = async (req, res) => {
  const { name, price, inStock, categoryId, description, additionalInfo, imageUrl } = req.body;
  console.log("Received payload:", req.body);

  if (categoryId !== "validCategoryId") {
    return res.status(400).json({ message: 'Category not found...1234' });
  }

  // Simulate saving a description and product
  const dummyProduct = {
    _id: "dummyProductId",
    name,
    price,
    stock: inStock,
    category: "Electronics", // Simulated category name
    longDescription: description,
    additionalInfo,
    imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return res.status(201).json({
    message: 'Product created successfully',
    product: dummyProduct,
  });
};

// Simulate "getAllProducts" endpoint returning an array of dummy products.
const getAllProducts = async (req, res) => {
  const dummyProducts = [
    {
      _id: "dummyProductId",
      name: "Dummy Product",
      price: 100,
      stock: 10,
      category: "Electronics",
      longDescription: "A dummy product",
      additionalInfo: "Some info",
      imageUrl: "dummy.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];
  return res.status(200).json(dummyProducts);
};

// Simulate "getProductById". Return a dummy product if the id matches,
// otherwise return 404.
const getProductById = async (req, res) => {
  const { id } = req.params;
  if (id !== "dummyProductId") {
    return res.status(404).json({ message: 'Product not found' });
  }
  const dummyProduct = {
    _id: "dummyProductId",
    name: "Dummy Product",
    price: 100,
    stock: 10,
    category: "Electronics",
    longDescription: "A dummy product",
    additionalInfo: "Some info",
    imageUrl: "dummy.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return res.status(200).json(dummyProduct);
};

// Simulate "updateProduct". If id matches, return updated dummy product,
// otherwise return 404.
const updateProduct = async (req, res) => {
  const { id } = req.params;
  if (id !== "dummyProductId") {
    return res.status(404).json({ message: 'Product not found' });
  }
  const updatedProduct = {
    _id: id,
    name: req.body.name || "Dummy Product",
    price: req.body.price !== undefined ? req.body.price : 100,
    stock: req.body.stock !== undefined ? req.body.stock : 10,
    category: req.body.categoryName || "Electronics",
    longDescription: req.body.longDescription || "A dummy product",
    additionalInfo: req.body.additionalInfo || "Some info",
    imageUrl: req.body.imageUrl || "dummy.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return res.status(200).json({
    message: 'Product updated successfully',
    product: updatedProduct,
  });
};

// Simulate "deleteProduct". If id matches, return success message,
// otherwise return 404.
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (id !== "dummyProductId") {
    return res.status(404).json({ message: 'Product not found' });
  }
  return res.status(200).json({ message: 'Product deleted successfully' });
};

// Create an Express app and mount routes
const app = express();
app.use(express.json());

const router = express.Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

app.use('/api/V3/products', router);

// Testing section using Jest and Supertest
describe('Product API Endpoints', () => {
  // Test the createProduct endpoint (success)
  test('POST /api/V3/products should create a product successfully', async () => {
    const payload = {
      name: "Test Product",
      price: 150,
      inStock: 20,
      categoryId: "validCategoryId",
      description: "Test description",
      additionalInfo: "Test info",
      imageUrl: "test.jpg"
    };
    const res = await request(app)
      .post('/api/V3/products')
      .send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'Product created successfully');
    expect(res.body.product).toMatchObject({
      name: "Test Product",
      price: 150,
      stock: 20,
      category: "Electronics",
      longDescription: "Test description",
      additionalInfo: "Test info",
      imageUrl: "test.jpg"
    });
  });

  // Test the createProduct endpoint (invalid category)
  test('POST /api/V3/products should return error for invalid category', async () => {
    const payload = {
      name: "Test Product",
      price: 150,
      inStock: 20,
      categoryId: "invalidCategoryId",
      description: "Test description",
      additionalInfo: "Test info",
      imageUrl: "test.jpg"
    };
    const res = await request(app)
      .post('/api/V3/products')
      .send(payload);
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'Category not found...1234');
  });

  // Test getAllProducts endpoint
  test('GET /api/V3/products should return list of products', async () => {
    const res = await request(app).get('/api/V3/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('name', 'Dummy Product');
  });

  // Test getProductById (success)
  test('GET /api/V3/products/:id should return a product when found', async () => {
    const res = await request(app).get('/api/V3/products/dummyProductId');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', 'dummyProductId');
  });

  // Test getProductById (not found)
  test('GET /api/V3/products/:id should return 404 when product not found', async () => {
    const res = await request(app).get('/api/V3/products/invalidId');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  // Test updateProduct (success)
  test('PUT /api/V3/products/:id should update a product successfully', async () => {
    const updateData = {
      name: "Updated Product",
      price: 200,
      stock: 15,
      categoryName: "Electronics",
      longDescription: "Updated description",
      additionalInfo: "Updated info",
      imageUrl: "updated.jpg"
    };
    const res = await request(app)
      .put('/api/V3/products/dummyProductId')
      .send(updateData);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Product updated successfully');
    expect(res.body.product).toMatchObject({
      _id: 'dummyProductId',
      name: "Updated Product",
      price: 200,
      stock: 15,
      category: "Electronics",
      longDescription: "Updated description",
      additionalInfo: "Updated info",
      imageUrl: "updated.jpg"
    });
  });

  // Test updateProduct (not found)
  test('PUT /api/V3/products/:id should return 404 when product not found', async () => {
    const updateData = { name: "Updated Product" };
    const res = await request(app)
      .put('/api/V3/products/invalidId')
      .send(updateData);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  // Test deleteProduct (success)
  test('DELETE /api/V3/products/:id should delete a product successfully', async () => {
    const res = await request(app)
      .delete('/api/V3/products/dummyProductId');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Product deleted successfully');
  });

  // Test deleteProduct (not found)
  test('DELETE /api/V3/products/:id should return 404 when product not found', async () => {
    const res = await request(app)
      .delete('/api/V3/products/invalidId');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });
});
