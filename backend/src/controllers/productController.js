const { getAllProducts, getCategories } = require("../data/products");

function listProducts(req, res) {
  res.json({
    categories: getCategories(),
    products: getAllProducts(),
  });
}

module.exports = { listProducts };
