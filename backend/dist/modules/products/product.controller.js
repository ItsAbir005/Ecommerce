"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductById = exports.getProducts = exports.deleteProduct = exports.updateProduct = exports.createProduct = void 0;
const Product_1 = require("../../models/Product");
const redis_1 = require("../../config/redis");
// === Helper: Invalidate Product List Caches ===
const invalidateProductCaches = async () => {
    try {
        const keys = await redis_1.redisClient.sMembers('products:cache');
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
        await redis_1.redisClient.del('products:cache'); // Clear the set itself
    }
    catch (err) {
        console.error("Redis cache invalidation error:", err);
    }
};
// === Admin Controllers ===
// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        const { title, description, price, stock, category_id, images, variants, discount } = req.body;
        const product = new Product_1.Product({
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
        // Invalidate product cache
        await invalidateProductCaches();
        return res.status(201).json(createdProduct);
    }
    catch (error) {
        console.error("Error creating product:", error);
        return res.status(500).json({ message: "Server error creating product" });
    }
};
exports.createProduct = createProduct;
// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        const { title, description, price, stock, category_id, images, variants, discount } = req.body;
        const product = await Product_1.Product.findById(req.params.id);
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
            // Invalidate product cache
            await invalidateProductCaches();
            await redis_1.redisClient.del(`product:${req.params.id}`);
            return res.json(updatedProduct);
        }
        else {
            return res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({ message: "Server error updating product" });
    }
};
exports.updateProduct = updateProduct;
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            // Invalidate product cache
            await invalidateProductCaches();
            await redis_1.redisClient.del(`product:${req.params.id}`);
            return res.json({ message: "Product removed" });
        }
        else {
            return res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error("Error deleting product:", error);
        return res.status(500).json({ message: "Server error deleting product" });
    }
};
exports.deleteProduct = deleteProduct;
// === Public Controllers ===
// @desc    Fetch all products (with pagination, filtering, search, sorting)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        // Generate a unique cache key based on the query parameters
        const cacheKey = `products:cache:${Buffer.from(JSON.stringify(req.query)).toString('base64')}`;
        // Attempt to get data from cache
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        // Search
        const keyword = req.query.search
            ? {
                title: {
                    $regex: req.query.search,
                    $options: "i",
                },
            }
            : {};
        // Filtering
        const filter = { ...keyword };
        if (req.query.category)
            filter.category_id = req.query.category;
        // Sorting
        let sortObj = {};
        if (req.query.sort) {
            const sortStr = req.query.sort;
            // e.g., ?sort=price or ?sort=-price for descending
            if (sortStr.startsWith("-")) {
                sortObj[sortStr.substring(1)] = -1;
            }
            else {
                sortObj[sortStr] = 1;
            }
        }
        else {
            sortObj = { createdAt: -1 }; // default sort
        }
        const count = await Product_1.Product.countDocuments(filter);
        const products = await Product_1.Product.find(filter)
            .sort(sortObj)
            .limit(pageSize)
            .skip(pageSize * (page - 1));
        const responseData = {
            products,
            page,
            pages: Math.ceil(count / pageSize),
            total: count
        };
        // Cache the response for 1 hour
        await redis_1.redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
        // Add this key to a master list so we can easily bust all list caches
        await redis_1.redisClient.sAdd('products:cache', cacheKey);
        return res.json(responseData);
    }
    catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({ message: "Server error fetching products" });
    }
};
exports.getProducts = getProducts;
// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const cacheKey = `product:${req.params.id}`;
        const cachedProduct = await redis_1.redisClient.get(cacheKey);
        if (cachedProduct) {
            return res.json(JSON.parse(cachedProduct));
        }
        const product = await Product_1.Product.findById(req.params.id);
        if (product) {
            // Cache single product for 1 hour
            await redis_1.redisClient.setEx(cacheKey, 3600, JSON.stringify(product));
            return res.json(product);
        }
        else {
            return res.status(404).json({ message: "Product not found" });
        }
    }
    catch (error) {
        console.error("Error fetching product by ID:", error);
        return res.status(500).json({ message: "Server error fetching product" });
    }
};
exports.getProductById = getProductById;
//# sourceMappingURL=product.controller.js.map