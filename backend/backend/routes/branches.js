const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get all branches
router.get("/", authMiddleware, branchController.getBranches);

// Create new branch (Admin only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.createBranch
);

// Assign shop owner to branch (Admin only)
router.post(
  "/:branchId/assign-shop-owner",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.assignShopOwner
);

// Remove shop owner from branch (Admin only)
router.delete(
  "/:branchId/shop-owners/:shopOwnerId",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.removeShopOwner
);

// Get branch analytics
router.get(
  "/:branchId/analytics",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.getBranchAnalytics
);

module.exports = router;
