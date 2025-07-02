const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get all branches
router.get("/", authMiddleware, branchController.getBranches);

// Get single branch
router.get("/:id", authMiddleware, branchController.getBranch);

// Create branch (Admin only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.createBranch
);

// Update branch (Admin only)
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.updateBranch
);

// Delete branch (Admin only)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.deleteBranch
);

// Get branch analytics
router.get(
  "/analytics/summary",
  authMiddleware,
  roleMiddleware(["admin", "manager"]),
  branchController.getBranchAnalytics
);

// Assign shop owner to branch
router.post(
  "/assign-shop-owner",
  authMiddleware,
  roleMiddleware(["admin"]),
  branchController.assignShopOwner
);

module.exports = router;
