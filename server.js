const app = require('./src/app');

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`Product Catalog API started on http://localhost:${port}`);
});
