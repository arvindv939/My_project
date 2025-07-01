const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public routes
router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:category", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

// Protected routes - Shop Owner only
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  productController.createProduct
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  productController.updateProduct
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  productController.deleteProduct
);

// Get products for shop owner
router.get(
  "/my-products",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const page = Number.parseInt(req.query.page) || 1;
      const limit = Number.parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = { createdBy: req.user.userId };

      // Add category filter if provided
      if (req.query.category) {
        filter.category = req.query.category;
      }

      // Add search filter if provided
      if (req.query.search) {
        filter.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Product.countDocuments(filter);

      res.json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (error) {
      console.error("Error fetching shop owner products:", error);
      res.status(500).json({
        message: "Error fetching products",
        error: error.message,
      });
    }
  }
);

// Toggle product active status
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check if user owns this product
      if (product.createdBy.toString() !== req.user.userId) {
        return res
          .status(403)
          .json({ message: "You can only modify your own products" });
      }

      product.isActive = !product.isActive;
      await product.save();

      res.json({
        message: `Product ${
          product.isActive ? "activated" : "deactivated"
        } successfully`,
        product,
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      res.status(500).json({
        message: "Error updating product status",
        error: error.message,
      });
    }
  }
);

module.exports = router;
