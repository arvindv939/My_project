const express = require("express");
const router = express.Router();
const bulkOrderController = require("../controllers/bulkOrderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get all bulk orders
router.get("/", authMiddleware, bulkOrderController.getBulkOrders);

// Get bulk order by ID
router.get("/:id", authMiddleware, bulkOrderController.getBulkOrderById);

// Create bulk order (Shop Owner only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  bulkOrderController.createBulkOrder
);

// Update bulk order (Shop Owner only)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  bulkOrderController.updateBulkOrder
);

// Delete bulk order (Shop Owner only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  bulkOrderController.deleteBulkOrder
);

module.exports = router;
