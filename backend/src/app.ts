import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./modules/users/user.routes";
import * as Sentry from "@sentry/node";

dotenv.config();
const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

Sentry.setupExpressErrorHandler(app);

export default app;

