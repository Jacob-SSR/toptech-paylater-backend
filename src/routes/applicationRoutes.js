const express = require("express");
const applicationRouter = express.Router();
const {
  createApplication,
  getApplication,
  getApplications,
  updateApplication,
  deleteApplication,
} = require("../controllers/applicationController");

applicationRouter.post("/application", createApplication);
applicationRouter.get("/application", getApplication);
applicationRouter.get("/application:id", getApplications);
applicationRouter.put("/application:id", updateApplication);
applicationRouter.delete("/application:id", deleteApplication);

module.exports = applicationRouter;
