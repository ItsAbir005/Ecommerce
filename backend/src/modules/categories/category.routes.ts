import { Router } from "express";
import { Category } from "../../models/Category";

const router = Router();

// GET /api/categories — returns all categories
router.get("/", async (req, res): Promise<any> => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        return res.json(categories);
    } catch (error) {
        return res.status(500).json({ message: "Server error fetching categories" });
    }
});

export default router;
