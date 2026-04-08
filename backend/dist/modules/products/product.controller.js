"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMyListing = exports.getMySellListings = exports.sellProduct = exports.getProductById = exports.getProducts = exports.rejectListing = exports.approveListing = exports.getPendingListings = exports.deleteProduct = exports.updateProduct = exports.createProduct = void 0;
const Product_1 = require("../../models/Product");
const redis_1 = require("../../config/redis");
// === Helper: Invalidate Product List Caches ===
const invalidateProductCaches = async () => {
    try {
        const keys = await redis_1.redisClient.sMembers('products:cache');
        if (keys.length > 0) {
            await redis_1.redisClient.del(keys);
        }
        await redis_1.redisClient.del('products:cache');
    }
    catch (err) {
        console.error("Redis cache invalidation error:", err);
    }
};
// === Admin Controllers ===
// @desc    Create a product (admin)
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
            status: 'approved',
        });
        const createdProduct = await product.save();
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
// @desc    Get all pending sell listings (for admin review)
// @route   GET /api/products/admin/pending
// @access  Private/Admin
const getPendingListings = async (req, res) => {
    try {
        const listings = await Product_1.Product.find({ status: 'pending' })
            .populate('seller_id', 'name email')
            .populate('category_id', 'name')
            .sort({ createdAt: -1 });
        return res.json(listings);
    }
    catch (error) {
        console.error("Error fetching pending listings:", error);
        return res.status(500).json({ message: "Server error fetching pending listings" });
    }
};
exports.getPendingListings = getPendingListings;
// @desc    Approve a sell listing
// @route   PATCH /api/products/admin/:id/approve
// @access  Private/Admin
const approveListing = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Listing not found" });
        product.status = 'approved';
        product.rejectionReason = undefined;
        await product.save();
        await invalidateProductCaches();
        return res.json({ message: "Listing approved", product });
    }
    catch (error) {
        console.error("Error approving listing:", error);
        return res.status(500).json({ message: "Server error approving listing" });
    }
};
exports.approveListing = approveListing;
// @desc    Reject a sell listing
// @route   PATCH /api/products/admin/:id/reject
// @access  Private/Admin
const rejectListing = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ message: "Listing not found" });
        const { reason } = req.body;
        product.status = 'rejected';
        product.rejectionReason = reason || 'Your listing did not meet our guidelines.';
        await product.save();
        await invalidateProductCaches();
        return res.json({ message: "Listing rejected", product });
    }
    catch (error) {
        console.error("Error rejecting listing:", error);
        return res.status(500).json({ message: "Server error rejecting listing" });
    }
};
exports.rejectListing = rejectListing;
// === Public Controllers ===
// @desc    Fetch all approved products (with pagination, filtering, search, sorting)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const cacheKey = `products:cache:${Buffer.from(JSON.stringify(req.query)).toString('base64')}`;
        const cachedData = await redis_1.redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData));
        }
        const keyword = req.query.search
            ? { title: { $regex: req.query.search, $options: "i" } }
            : {};
        // Always restrict to approved products in public listing
        const filter = { ...keyword, status: 'approved' };
        if (req.query.category)
            filter.category_id = req.query.category;
        let sortObj = {};
        if (req.query.sort) {
            const sortStr = req.query.sort;
            if (sortStr.startsWith("-")) {
                sortObj[sortStr.substring(1)] = -1;
            }
            else {
                sortObj[sortStr] = 1;
            }
        }
        else {
            sortObj = { createdAt: -1 };
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
        await redis_1.redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));
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
// === Customer Sell Controllers ===
// @desc    Customer submits a product listing for sale
// @route   POST /api/products/sell
// @access  Private (any authenticated user)
const sellProduct = async (req, res) => {
    try {
        const { title, description, price, stock, category_id, variants, discount } = req.body;
        // Collect uploaded image URLs from Cloudinary (via multer)
        const imageFiles = req.files;
        const images = imageFiles?.map((f) => f.path || f.secure_url || f.location) ?? [];
        if (!title || !description || !price || !stock || !category_id) {
            return res.status(400).json({ message: "Title, description, price, stock and category are required" });
        }
        const parsedVariants = variants
            ? (typeof variants === 'string' ? JSON.parse(variants) : variants)
            : [];
        const product = new Product_1.Product({
            title,
            description,
            price: Number(price),
            stock: Number(stock),
            category_id,
            images,
            variants: parsedVariants,
            discount: discount ? Number(discount) : 0,
            seller_id: req.user?._id,
            status: 'pending',
        });
        const createdProduct = await product.save();
        return res.status(201).json({
            message: "Your listing has been submitted and is pending review. We'll notify you once it's approved.",
            product: createdProduct,
        });
    }
    catch (error) {
        console.error("Error creating sell listing:", error);
        return res.status(500).json({ message: "Server error creating listing" });
    }
};
exports.sellProduct = sellProduct;
// @desc    Get current user's own sell listings (all statuses)
// @route   GET /api/products/my-listings
// @access  Private
const getMySellListings = async (req, res) => {
    try {
        const listings = await Product_1.Product.find({ seller_id: req.user?._id })
            .populate('category_id', 'name')
            .sort({ createdAt: -1 });
        return res.json(listings);
    }
    catch (error) {
        console.error("Error fetching user listings:", error);
        return res.status(500).json({ message: "Server error fetching listings" });
    }
};
exports.getMySellListings = getMySellListings;
// @desc    Delete own pending or rejected listing
// @route   DELETE /api/products/my-listings/:id
// @access  Private
const deleteMyListing = async (req, res) => {
    try {
        const product = await Product_1.Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Listing not found" });
        }
        if (product.seller_id?.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this listing" });
        }
        if (product.status === 'approved') {
            return res.status(400).json({ message: "Approved listings cannot be deleted. Contact support." });
        }
        await product.deleteOne();
        await invalidateProductCaches();
        return res.json({ message: "Listing deleted" });
    }
    catch (error) {
        console.error("Error deleting listing:", error);
        return res.status(500).json({ message: "Server error deleting listing" });
    }
};
exports.deleteMyListing = deleteMyListing;
//# sourceMappingURL=product.controller.js.map