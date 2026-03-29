import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

if (process.env.CLOUDINARY_URL) {
    cloudinary.config({
        url: process.env.CLOUDINARY_URL
    });
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

// ── Profile image storage (existing) ──────────────────────────────────────────
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: express.Request, file: any) => {
        const user = (req as any).user;
        return {
            folder: 'lunar_ecommerce/profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: `${user?._id || 'user'}_${Date.now()}`,
        };
    },
});

export const upload = multer({ storage: profileStorage });

// ── Product image storage (for customer sell listings) ────────────────────────
const productStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req: express.Request, file: any) => {
        const user = (req as any).user;
        return {
            folder: 'lunar_ecommerce/products',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
            public_id: `product_${user?._id || 'user'}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        };
    },
});

/** Use this for product image uploads — supports multiple files (max 5) */
export const uploadProductImages = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});
