dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import addressRouter from "./routes/addressRoutes.js";
import applicationRouter from "./routes/applicationRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import productRouter from "./routes/productRoutes.js";

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/paylater", addressRouter);
app.use("/api/paylater", applicationRouter);
app.use("/api/paylater", customerRouter);
app.use("/api/paylater", productRouter);

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
