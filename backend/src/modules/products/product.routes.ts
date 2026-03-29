import { Router } from "express";
import {
    createProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProductById,
    sellProduct,
    getMySellListings,
    deleteMyListing,
    getPendingListings,
    approveListing,
    rejectListing,
} from "./product.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminMiddleware } from "../../middleware/admin.middleware";
import { uploadProductImages } from "../../config/cloudinary";

const router = Router();

// ── Public routes ────────────────────────────────────────────────────────────
router.get("/", getProducts);
router.get("/:id", getProductById);

// ── Customer sell routes ──────────────────────────────────────────────────────
router.post("/sell", authMiddleware, uploadProductImages.array("images", 5), sellProduct);
router.get("/my-listings", authMiddleware, getMySellListings);
router.delete("/my-listings/:id", authMiddleware, deleteMyListing);

// ── Admin listing review routes ───────────────────────────────────────────────
router.get("/admin/pending", authMiddleware, adminMiddleware, getPendingListings);
router.patch("/admin/:id/approve", authMiddleware, adminMiddleware, approveListing);
router.patch("/admin/:id/reject", authMiddleware, adminMiddleware, rejectListing);

// ── Admin product CRUD routes ─────────────────────────────────────────────────
router.post("/", authMiddleware, adminMiddleware, createProduct);
router.put("/:id", authMiddleware, adminMiddleware, updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;
