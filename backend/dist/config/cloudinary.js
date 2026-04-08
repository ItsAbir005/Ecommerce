"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProductImages = exports.upload = void 0;
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const multer_1 = __importDefault(require("multer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
if (process.env.CLOUDINARY_URL) {
    cloudinary_1.v2.config({
        url: process.env.CLOUDINARY_URL
    });
}
else {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}
// ── Profile image storage (existing) ──────────────────────────────────────────
const profileStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        const user = req.user;
        return {
            folder: 'lunar_ecommerce/profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${user?._id || 'user'}_${Date.now()}`,
        };
    },
});
exports.upload = (0, multer_1.default)({ storage: profileStorage });
// ── Product image storage (for customer sell listings) ────────────────────────
const productStorage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: async (req, file) => {
        const user = req.user;
        return {
            folder: 'lunar_ecommerce/products',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
            public_id: `product_${user?._id || 'user'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        };
    },
});
/** Use this for product image uploads — supports multiple files (max 5) */
exports.uploadProductImages = (0, multer_1.default)({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});
//# sourceMappingURL=cloudinary.js.map