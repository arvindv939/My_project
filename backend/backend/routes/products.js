const express = require("express");
const Product = require("../models/Product");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const productController = require("../controllers/productController");

const router = express.Router();

// Public routes
router.get("/", productController.getProducts);
router.get("/search", productController.searchProducts);
router.get("/category/:category", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

// Protected routes - Shop Owner only
router.get(
  "/my-products",
  authMiddleware,
  roleMiddleware(["shop_owner"]),
  productController.getMyProducts
);
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

module.exports = router;
