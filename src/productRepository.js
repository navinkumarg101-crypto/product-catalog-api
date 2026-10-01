class ProductRepository {
  constructor(initialProducts = []) {
    this.products = new Map(initialProducts.map((product) => [product.id, { ...product }]));
    this.nextId = initialProducts.reduce((largest, product) => Math.max(largest, product.id), 0) + 1;
  }

  findAll() {
    return Array.from(this.products.values());
  }

  findById(id) {
    return this.products.get(id) || null;
  }

  findByCategory(category) {
    const normalizedCategory = category.toLowerCase();
    return this.findAll().filter(
      (product) => product.category.toLowerCase() === normalizedCategory,
    );
  }

  create(productData) {
    const product = { id: this.nextId, ...productData };
    this.products.set(product.id, product);
    this.nextId += 1;
    return product;
  }

  update(id, changes) {
    const existingProduct = this.findById(id);
    if (!existingProduct) return null;

    const updatedProduct = { ...existingProduct, ...changes, id };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  remove(id) {
    const product = this.findById(id);
    if (!product) return null;

    this.products.delete(id);
    return product;
  }
}

module.exports = ProductRepository;
