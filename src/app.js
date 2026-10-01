const express = require('express');
const ProductRepository = require('./productRepository');
const { cleanProductFields, selectProductFields, validateProduct } = require('./validation');

const app = express();

app.use(express.json());

const repository = new ProductRepository([
  { id: 101, name: 'Notebook', category: 'Stationery', price: 85, quantity: 40 },
  { id: 102, name: 'Desk Lamp', category: 'Home', price: 1250, quantity: 14 },
  { id: 103, name: 'Water Bottle', category: 'Lifestyle', price: 450, quantity: 30 },
  { id: 104, name: 'Pen Set', category: 'Stationery', price: 160, quantity: 22 },
]);

function readId(rawId) {
  const id = Number(rawId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Product Catalog API',
    productsEndpoint: '/products',
  });
});

// Kept before /products/:id so that "category" is never interpreted as an ID.
app.get('/products/category/:category', (req, res) => {
  const category = req.params.category.trim();
  const products = repository.findByCategory(category);

  if (products.length === 0) {
    return res.status(404).json({
      error: 'CATEGORY_NOT_FOUND',
      message: `Category '${req.params.category}' has no products`,
    });
  }

  return res.json({ category, total: products.length, products });
});

app.get('/products', (req, res) => {
  const products = repository.findAll();
  res.json({ total: products.length, products });
});

app.get('/products/:id', (req, res) => {
  const id = readId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: 'The product ID must be a positive whole number',
    });
  }

  const product = repository.findById(id);
  if (!product) {
    return res.status(404).json({
      error: 'PRODUCT_NOT_FOUND',
      message: `No product exists with ID ${id}`,
    });
  }

  return res.json({ product });
});

app.post('/products', (req, res) => {
  const submittedProduct = selectProductFields(req.body);
  const problems = validateProduct(submittedProduct);

  if (problems.length > 0) {
    return res.status(422).json({ error: 'INVALID_PRODUCT', problems });
  }

  const product = repository.create(cleanProductFields(submittedProduct));
  return res.status(201).json({ message: 'Product added to the catalog', product });
});

app.put('/products/:id', (req, res) => {
  const id = readId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: 'The product ID must be a positive whole number',
    });
  }

  if (!repository.findById(id)) {
    return res.status(404).json({
      error: 'PRODUCT_NOT_FOUND',
      message: `No product exists with ID ${id}`,
    });
  }

  const changes = selectProductFields(req.body);
  if (Object.keys(changes).length === 0) {
    return res.status(422).json({
      error: 'NO_CHANGES',
      message: 'Send at least one product field to update',
    });
  }

  const problems = validateProduct(changes, { allowPartial: true });
  if (problems.length > 0) {
    return res.status(422).json({ error: 'INVALID_PRODUCT', problems });
  }

  const product = repository.update(id, cleanProductFields(changes));
  return res.json({ message: 'Product details updated', product });
});

app.delete('/products/:id', (req, res) => {
  const id = readId(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: 'The product ID must be a positive whole number',
    });
  }

  const deletedProduct = repository.remove(id);
  if (!deletedProduct) {
    return res.status(404).json({
      error: 'PRODUCT_NOT_FOUND',
      message: `No product exists with ID ${id}`,
    });
  }

  return res.json({ message: 'Product removed from the catalog', deletedProduct });
});

app.use((req, res) => {
  res.status(404).json({ error: 'ROUTE_NOT_FOUND', message: 'The requested endpoint does not exist' });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'INVALID_JSON', message: 'Request body contains invalid JSON' });
  }

  console.error(error);
  return res.status(500).json({ error: 'SERVER_ERROR', message: 'An unexpected error occurred' });
});

module.exports = app;
