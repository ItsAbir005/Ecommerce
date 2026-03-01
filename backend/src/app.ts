import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./modules/users/user.routes";
import productRoutes from "./modules/products/product.routes";
import cartRoutes from "./modules/cart/cart.routes";
import * as Sentry from "@sentry/node";
import { Category } from "./models/Category";

dotenv.config();
const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// ── Categories ────────────────────────────────────────────────────────────────
app.get("/api/categories", async (req, res): Promise<any> => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ message: "Server error fetching categories" });
    }
});

app.get("/api/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

Sentry.setupExpressErrorHandler(app);

export default app;
