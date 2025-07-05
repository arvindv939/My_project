const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// GET orders for shop owner
router.get(
  "/shop-owner",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  async (req, res) => {
    try {
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

      res.json({ success: true, orders });
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

// GET orders for logged-in customer
router.get("/customer", authMiddleware, async (req, res) => {
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

// GET all orders (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status) query.status = status;

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

// GET single order by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "name price imageUrl");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only customer who placed order or admin/shop_owner can see order
    if (
      req.user.role === "customer" &&
      order.customerId.toString() !== req.user.userId
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
});

// CREATE new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    let { items, deliveryAddress, paymentMethod, totalAmount } = req.body;

    // ✅ Validate inputs
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }
    if (
      !deliveryAddress ||
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.zipCode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required",
      });
    }
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }
    if (typeof totalAmount !== "number") {
      return res.status(400).json({
        success: false,
        message: "Total amount is required",
      });
    }

    const normalizedItems = [];

    // ✅ Check stock and update stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // Deduct stock and save
      product.stock -= item.quantity;
      await product.save();

      normalizedItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: item.price,
        picked: false,
      });
    }

    // ✅ Create order
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
    console.error("❌ Error creating order:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
});

// UPDATE order status
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate("customerId", "name email");

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
});

// UPDATE item as picked/unpicked
router.put(
  "/:orderId/items/:productId",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  async (req, res) => {
    const { orderId, productId } = req.params;
    const { picked } = req.body;

    try {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      const item = order.items.find(
        (i) => i.productId.toString() === productId
      );
      if (!item)
        return res.status(404).json({ message: "Item not found in order" });

      item.picked = picked;
      await order.save();

      res.json({ success: true, message: "Item updated", order });
    } catch (err) {
      console.error("Update item error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to update item",
        error: err.message,
      });
    }
  }
);

// Update payment status
router.put("/:id/payment", authMiddleware, async (req, res) => {
  try {
    const { paymentMethod, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentMethod = paymentMethod || order.paymentMethod;
    order.paymentStatus = paymentStatus || order.paymentStatus;

    await order.save();
    res.json({ success: true, message: "Payment updated", order });
  } catch (error) {
    console.error("Payment update error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update payment" });
  }
});

module.exports = router;
