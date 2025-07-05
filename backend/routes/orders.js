const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const QRCode = require("qrcode");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// CREATE new order
router.post("/create", authMiddleware, async (req, res) => {
  console.log("OrdersRoute: Received order creation request");
  console.log("OrdersRoute: Request body:", JSON.stringify(req.body, null, 2));
  console.log("OrdersRoute: User ID:", req.user.userId || req.user.id);

  try {
    const {
      products,
      items,
      scheduledDate,
      scheduledTime,
      orderType,
      paymentMethod,
      notes,
      address,
      total,
      totalAmount,
      deliveryAddress,
    } = req.body;

    // Get order items from either 'items' or 'products' field
    const orderItems = items || products;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      console.log("OrdersRoute: No order items provided");
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Get delivery address from either field
    const orderAddress = deliveryAddress || address;

    if (
      !orderAddress ||
      typeof orderAddress !== "string" ||
      orderAddress.trim().length < 10
    ) {
      console.log("OrdersRoute: Invalid delivery address:", orderAddress);
      return res.status(400).json({
        success: false,
        message:
          "Complete delivery address is required (minimum 10 characters)",
      });
    }

    // Calculate total if not provided
    let orderTotal = totalAmount || total;
    if (!orderTotal) {
      orderTotal = orderItems.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);
    }

    console.log("OrdersRoute: Creating order with data:", {
      customerId: req.user.userId || req.user.id,
      items: orderItems.length,
      total: orderTotal,
      address: orderAddress,
    });

    // Normalize items for the order
    const normalizedItems = orderItems.map((item) => ({
      productId: item.productId || item.product || item.id,
      quantity: item.quantity || 1,
      price: item.price || 0,
      picked: false,
    }));

    const order = new Order({
      customerId: req.user.userId || req.user.id,
      items: normalizedItems,
      totalAmount: orderTotal,
      deliveryAddress: {
        street: orderAddress,
        city: "Default City",
        state: "Default State",
        zipCode: "00000",
      },
      paymentMethod: paymentMethod || "cash",
      status: "pending",
      orderType: orderType || "delivery",
      scheduledDate: scheduledDate || new Date(),
      scheduledTime: scheduledTime || "ASAP",
      notes: notes || "",
    });

    await order.save();
    console.log("OrdersRoute: Order saved successfully:", order._id);

    // Generate QR Code
    try {
      const qrData = `OrderID:${order._id}`;
      order.qrCode = await QRCode.toDataURL(qrData);
      await order.save();
      console.log("OrdersRoute: QR Code generated successfully");
    } catch (qrError) {
      console.log("OrdersRoute: QR Code generation failed:", qrError.message);
    }

    // Populate the order before sending response
    await order.populate("customerId", "name email");
    await order.populate("items.productId", "name price imageUrl");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("OrdersRoute: Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
});

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
    const orders = await Order.find({
      customerId: req.user.userId || req.user.id,
    })
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
      order.customerId.toString() !== (req.user.userId || req.user.id)
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

module.exports = router;
