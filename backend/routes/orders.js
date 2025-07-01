const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// ✅ Get orders for shop owner
router.get(
  "/shop-owner",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  async (req, res) => {
    try {
      console.log("Fetching orders for shop owner:", req.user.userId);

      const shopOwnerProducts = await Product.find({
        createdBy: req.user.userId,
      }).select("_id");

      const productIds = shopOwnerProducts.map((p) => p._id);

      const orders = await Order.find({
        "items.productId": { $in: productIds },
      })
        .populate("customerId", "name email")
        .populate("items.productId", "name price imageUrl")
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

// ✅ Get orders for customer
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user.userId })
      .populate("items.productId", "name price imageUrl")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your orders",
      error: error.message,
    });
  }
});

// ✅ Get all orders (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email")
      .populate("items.productId", "name price imageUrl")
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

// ✅ Get single order by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "name price imageUrl");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      req.user.role === "customer" &&
      order.customerId.toString() !== req.user.userId
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

// ✅ Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    let { items, deliveryAddress, paymentMethod, totalAmount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    const normalizedItems = items.map((item) => ({
      productId: item.product || item.productId,
      quantity: item.quantity,
      price: item.price,
    }));

    const order = new Order({
      customerId: req.user.userId,
      items: normalizedItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      status: "pending",
    });

    await order.save();
    await order.populate("customerId", "name email");
    await order.populate("items.productId", "name price imageUrl");

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

// ✅ Update order status
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
    ).populate("customerId", "name email");

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
