const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Public routes (no authentication required)
router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:category", productController.getProductsByCategory);

// Protected routes (authentication required)
router.get(
  "/my-products",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  productController.getMyProducts
);

// Product CRUD operations (shop owner only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  productController.createProduct
);

// Single product routes - MUST come after specific routes
router.get("/:id", productController.getProductById);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  productController.updateProduct
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  productController.deleteProduct
);

module.exports = router;
