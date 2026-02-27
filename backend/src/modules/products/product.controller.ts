import { Request, Response } from "express";
import { Product } from "../../models/Product";

// === Admin Controllers ===

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, price, stock, category_id, images, variants, discount } = req.body;

        const product = new Product({
            title,
            description,
            price,
            stock,
            category_id,
            images,
            variants,
            discount,
        });

        const createdProduct = await product.save();
        return res.status(201).json(createdProduct);
    } catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({ message: "Server error creating product" });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const { title, description, price, stock, category_id, images, variants, discount } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.title = title || product.title;
            product.description = description || product.description;
            product.price = price || product.price;
            product.stock = stock !== undefined ? stock : product.stock;
            product.category_id = category_id || product.category_id;
            product.images = images || product.images;
            product.variants = variants || product.variants;
            product.discount = discount !== undefined ? discount : product.discount;

            const updatedProduct = await product.save();
            return res.json(updatedProduct);
        } else {
            return res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: "Server error updating product" });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: Request, res: Response): Promise<any> => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne();
            return res.json({ message: "Product removed" });
        } else {
            return res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: "Server error deleting product" });
    }
};

// === Public Controllers ===

// @desc    Fetch all products (with pagination, filtering, search, sorting)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response): Promise<any> => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;

        // Search
        const keyword = req.query.search
            ? {
                title: {
                    $regex: req.query.search as string,
                    $options: "i",
                },
            }
            : {};

        // Filtering
        const filter: any = { ...keyword };
        if (req.query.category) filter.category_id = req.query.category;

        // Sorting
        let sortObj: any = {};
        if (req.query.sort) {
            const sortStr = req.query.sort as string;
            // e.g., ?sort=price or ?sort=-price for descending
            if (sortStr.startsWith("-")) {
                sortObj[sortStr.substring(1)] = -1;
            } else {
                sortObj[sortStr] = 1;
            }
        } else {
            sortObj = { createdAt: -1 }; // default sort
        }

        const count = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort(sortObj)
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        return res.json({
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ message: "Server error fetching products" });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req: Request, res: Response): Promise<any> => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            return res.json(product);
        } else {
            return res.status(404).json({ message: "Product not found" });
        }
    } catch (error) {
        console.error("Error fetching product by ID:", error);
        return res.status(500).json({ message: "Server error fetching product" });
    }
};
