const express = require("express");
const addressRouter = express.Router();
const {
  createAddress,
  getAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} = require("../controllers/addressController.js");

addressRouter.post("/address", createAddress);
addressRouter.get("/address", getAddresses);
addressRouter.get("/address:id", getAddress);
addressRouter.put("/address:id", updateAddress);
addressRouter.delete("/address:id", deleteAddress);

module.exports = addressRouter;
