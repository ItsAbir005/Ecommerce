"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getProductsByCategory = exports.getCategoryTree = exports.getAllCategories = void 0;
const CategoryService = __importStar(require("./category.service"));
// GET /api/categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategories();
        return res.json(categories);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getAllCategories = getAllCategories;
// GET /api/categories/tree
const getCategoryTree = async (req, res) => {
    try {
        const tree = await CategoryService.getCategoryTree();
        return res.json(tree);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getCategoryTree = getCategoryTree;
// GET /api/categories/:id/products
const getProductsByCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const result = await CategoryService.getProductsByCategory(req.params.id, page, limit);
        return res.json(result);
    }
    catch (err) {
        return res.status(500).json({ message: err.message });
    }
};
exports.getProductsByCategory = getProductsByCategory;
// POST /api/categories  (admin)
const createCategory = async (req, res) => {
    try {
        const cat = await CategoryService.createCategory(req.body);
        return res.status(201).json(cat);
    }
    catch (err) {
        return res.status(err.message.includes('already exists') ? 409 : 500).json({ message: err.message });
    }
};
exports.createCategory = createCategory;
// PUT /api/categories/:id  (admin)
const updateCategory = async (req, res) => {
    try {
        const cat = await CategoryService.updateCategory(req.params.id, req.body);
        return res.json(cat);
    }
    catch (err) {
        return res.status(err.message.includes('not found') ? 404 : 500).json({ message: err.message });
    }
};
exports.updateCategory = updateCategory;
// DELETE /api/categories/:id  (admin)
const deleteCategory = async (req, res) => {
    try {
        const result = await CategoryService.deleteCategory(req.params.id);
        return res.json(result);
    }
    catch (err) {
        const status = err.message.includes('not found') ? 404
            : err.message.includes('Cannot delete') ? 409 : 500;
        return res.status(status).json({ message: err.message });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=category.controller.js.map