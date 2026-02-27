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

const storage = new CloudinaryStorage({
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

export const upload = multer({ storage: storage });
