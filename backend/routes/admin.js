const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const {
  getFinancials,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  getBranchAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getSalesAnalytics,
} = require("../controllers/adminController");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Shop = require("../models/Shop");

const router = express.Router();

// Dashboard stats
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalOrders = await Order.countDocuments();
      const totalShops = await Shop.countDocuments();

      const pendingOrders = await Order.countDocuments({ status: "pending" });
      const completedOrders = await Order.countDocuments({
        status: "delivered",
      });

      const revenueResult = await Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      const totalRevenue =
        revenueResult.length > 0 ? revenueResult[0].total : 0;

      res.json({
        totalUsers,
        totalProducts,
        totalOrders,
        totalShops,
        pendingOrders,
        completedOrders,
        totalRevenue,
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// ✅ Analytics routes from controller
router.get(
  "/financials",
  authMiddleware,
  roleMiddleware(["admin"]),
  getFinancials
);
router.get(
  "/orders",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminOrders
);
router.get(
  "/products",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAdminProducts
);
router.get("/users", authMiddleware, roleMiddleware(["admin"]), getAdminUsers);

// ✅ Additional analytics
router.get(
  "/analytics/branches",
  authMiddleware,
  roleMiddleware(["admin"]),
  getBranchAnalytics
);
router.get(
  "/analytics/revenue",
  authMiddleware,
  roleMiddleware(["admin"]),
  getRevenueAnalytics
);
router.get(
  "/analytics/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  getUserAnalytics
);
router.get(
  "/analytics/sales",
  authMiddleware,
  roleMiddleware(["admin"]),
  getSalesAnalytics
);

// Update user role
router.put(
  "/users/:id/role",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
      ).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete user
router.delete(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Recent orders (limited)
router.get(
  "/orders/recent",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const orders = await Order.find()
        .populate("customer", "name email")
        .populate("items.product", "name")
        .sort({ createdAt: -1 })
        .limit(10);
      res.json(orders);
    } catch (error) {
      console.error("Get recent orders error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
