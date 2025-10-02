const express = require("express");
const productRouter = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

productRouter.post("/product", createProduct);
productRouter.get("/products", getProducts);
productRouter.get("/product/:id", getProduct);
productRouter.put("/product/:id", updateProduct);
productRouter.delete("/product/:id", deleteProduct);

module.exports = productRouter;
