const express = require("express");
const customerRouter = express.Router();
const {
  createCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

customerRouter.post("/customer", createCustomer);
customerRouter.get("/customer", getCustomers);
customerRouter.get("/customer:id", getCustomer);
customerRouter.put("/customer:id", updateCustomer);
customerRouter.delete("/customer:id", deleteCustomer);

module.exports = customerRouter;
