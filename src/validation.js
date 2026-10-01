const PRODUCT_FIELDS = ['name', 'category', 'price', 'quantity'];

function validateProduct(data, { allowPartial = false } = {}) {
  const problems = [];

  if (!allowPartial) {
    for (const field of PRODUCT_FIELDS) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        problems.push(`${field} is required`);
      }
    }
  }

  if ('name' in data && (typeof data.name !== 'string' || data.name.trim().length < 2)) {
    problems.push('name must contain at least 2 characters');
  }

  if (
    'category' in data
    && (typeof data.category !== 'string' || data.category.trim().length < 2)
  ) {
    problems.push('category must contain at least 2 characters');
  }

  if (
    'price' in data
    && (typeof data.price !== 'number' || !Number.isFinite(data.price) || data.price < 0)
  ) {
    problems.push('price must be a number greater than or equal to 0');
  }

  if ('quantity' in data && (!Number.isInteger(data.quantity) || data.quantity < 0)) {
    problems.push('quantity must be a whole number greater than or equal to 0');
  }

  return problems;
}

function selectProductFields(data) {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => PRODUCT_FIELDS.includes(key)),
  );
}

function cleanProductFields(data) {
  const cleaned = { ...data };
  if (typeof cleaned.name === 'string') cleaned.name = cleaned.name.trim();
  if (typeof cleaned.category === 'string') cleaned.category = cleaned.category.trim();
  return cleaned;
}

module.exports = { cleanProductFields, selectProductFields, validateProduct };
