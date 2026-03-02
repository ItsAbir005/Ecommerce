import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as CategoryService from './category.service';

// GET /api/categories
export const getAllCategories = async (req: Request, res: Response): Promise<any> => {
    try {
        const categories = await CategoryService.getAllCategories();
        return res.json(categories);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /api/categories/tree
export const getCategoryTree = async (req: Request, res: Response): Promise<any> => {
    try {
        const tree = await CategoryService.getCategoryTree();
        return res.json(tree);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// GET /api/categories/:id/products
export const getProductsByCategory = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const result = await CategoryService.getProductsByCategory(req.params.id as string, page, limit);
        return res.json(result);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};

// POST /api/categories  (admin)
export const createCategory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const cat = await CategoryService.createCategory(req.body);
        return res.status(201).json(cat);
    } catch (err: any) {
        return res.status(err.message.includes('already exists') ? 409 : 500).json({ message: err.message });
    }
};

// PUT /api/categories/:id  (admin)
export const updateCategory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const cat = await CategoryService.updateCategory(req.params.id as string, req.body);
        return res.json(cat);
    } catch (err: any) {
        return res.status(err.message.includes('not found') ? 404 : 500).json({ message: err.message });
    }
};

// DELETE /api/categories/:id  (admin)
export const deleteCategory = async (req: AuthRequest, res: Response): Promise<any> => {
    try {
        const result = await CategoryService.deleteCategory(req.params.id as string);
        return res.json(result);
    } catch (err: any) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('Cannot delete') ? 409 : 500;
        return res.status(status).json({ message: err.message });
    }
};
