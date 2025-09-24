const express = require("express");
const productRouter = express.Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

productRouter.post("/", createProduct);
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);
productRouter.put("/:id", updateProduct);
productRouter.delete("/:id", deleteProduct);

module.exports = productRouter;
