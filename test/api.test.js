const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

let server;
let apiUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      apiUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function send(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
  });

  return { status: response.status, json: await response.json() };
}

test('the home endpoint explains where products are available', async () => {
  const result = await send('/');
  assert.equal(result.status, 200);
  assert.equal(result.json.productsEndpoint, '/products');
});

test('all products can be listed', async () => {
  const result = await send('/products');
  assert.equal(result.status, 200);
  assert.equal(result.json.total, 4);
});

test('a single product can be found by ID', async () => {
  const result = await send('/products/102');
  assert.equal(result.status, 200);
  assert.equal(result.json.product.name, 'Desk Lamp');
});

test('missing products return a specific message', async () => {
  const result = await send('/products/999');
  assert.equal(result.status, 404);
  assert.equal(result.json.error, 'PRODUCT_NOT_FOUND');
});

test('category filtering ignores letter case', async () => {
  const result = await send('/products/category/stationery');
  assert.equal(result.status, 200);
  assert.equal(result.json.total, 2);
});

test('unknown categories return a specific category error', async () => {
  const result = await send('/products/category/Sports');
  assert.equal(result.status, 404);
  assert.equal(result.json.error, 'CATEGORY_NOT_FOUND');
});

test('a product can be created, updated, and removed', async () => {
  const created = await send('/products', {
    method: 'POST',
    body: JSON.stringify({ name: 'Travel Pouch', category: 'Lifestyle', price: 700, quantity: 9 }),
  });
  assert.equal(created.status, 201);
  const newId = created.json.product.id;

  const updated = await send(`/products/${newId}`, {
    method: 'PUT',
    body: JSON.stringify({ price: 650, quantity: 12 }),
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.product.price, 650);

  const deleted = await send(`/products/${newId}`, { method: 'DELETE' });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.json.deletedProduct.id, newId);
});

test('invalid new products are rejected', async () => {
  const result = await send('/products', {
    method: 'POST',
    body: JSON.stringify({ name: 'X', category: 'Home', price: -10, quantity: 2.5 }),
  });
  assert.equal(result.status, 422);
  assert.equal(result.json.error, 'INVALID_PRODUCT');
  assert.ok(result.json.problems.length >= 3);
});
