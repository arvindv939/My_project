const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Get orders for shop owner - MUST come before /:id route
router.get(
  "/shop-owner",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  async (req, res) => {
    try {
      console.log("Fetching orders for shop owner:", req.user.userId);

      // Find orders where the shop owner created products in the order
      const orders = await Order.find({
        "items.createdBy": req.user.userId,
      })
        .populate("customer", "name email")
        .populate("items.product", "name price imageUrl")
        .sort({ createdAt: -1 });

      console.log("Found orders:", orders.length);

      res.json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error("Error fetching shop owner orders:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching orders",
        error: error.message,
      });
    }
  }
);

// Get all orders (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("customer", "name email")
      .populate("items.product", "name price imageUrl")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// Get single order by ID - MUST come after specific routes
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.product", "name price imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user can access this order
    if (
      req.user.role === "customer" &&
      order.customer._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const order = new Order({
      customer: req.user.userId,
      items,
      deliveryAddress,
      paymentMethod,
      totalAmount,
      status: "pending",
    });

    await order.save();
    await order.populate("customer", "name email");
    await order.populate("items.product", "name price imageUrl");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
});

// Update order status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("customer", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
});

module.exports = router;
