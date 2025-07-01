// Check every folder where is the error
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

// Get products for shop owner - MUST come before /:id route
router.get(
  "/my-products",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  productController.getMyProducts
);

// Get single product by ID
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

// Toggle product active status
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if user owns this product
      if (product.createdBy.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "You can only modify your own products",
        });
      }

      product.isActive = !product.isActive;
      await product.save();

      res.json({
        success: true,
        message: `Product ${
          product.isActive ? "activated" : "deactivated"
        } successfully`,
        product,
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product status",
        error: error.message,
      });
    }
  }
);

module.exports = router;
