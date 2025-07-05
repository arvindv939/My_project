const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const QRCode = require("qrcode");
const authMiddleware = require("../middlewares/authMiddleware");

// Create Order
router.post("/create", authMiddleware, async (req, res) => {
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

  try {
    const orderItems = items || products;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    let orderTotal = totalAmount || total;
    if (!orderTotal) {
      orderTotal = orderItems.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1);
      }, 0);
    }

    const orderAddress = deliveryAddress || address || "Not specified";

    const order = new Order({
      customer: req.user.id,
      products: orderItems.map((item) => ({
        product: item.product || item.id,
        quantity: item.quantity || 1,
        price: item.price || 0,
      })),
      total: orderTotal,
      scheduledDate: scheduledDate || new Date(),
      scheduledTime: scheduledTime || "ASAP",
      orderType: orderType || "delivery",
      paymentMethod: paymentMethod || "cash",
      notes: notes || "",
      address: orderAddress,
      status: "pending",
    });

    await order.save();

    // Generate QR
    const qrData = `OrderID:${order._id}`;
    try {
      order.qrCode = await QRCode.toDataURL(qrData);
      await order.save();
    } catch (qrError) {
      console.log("QR Code failed:", qrError.message);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: error.message,
    });
  }
});

// Get All Orders (Admin)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("products.product", "name price unit"); // include unit
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Shop Owner Orders
// Get Orders for Shop Owner
router.get("/shop-owner", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "name")
      .populate("items.productId", "name price unit")
      .select("+paymentStatus +paymentMethod"); // Ensure payment fields are included

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching shop owner orders:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
    });
  }
});

// Update Order Status
router.put("/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (
    !["pending", "confirmed", "ready", "delivered", "cancelled"].includes(
      status?.toLowerCase()
    )
  ) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get Customer Orders
router.get("/customer", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .populate("products.product", "name price unit")
      .sort({ createdAt: -1 });

    const transformed = orders.map((order) => ({
      ...order.toObject(),
      items: order.products.map((p) => ({
        productId: p.product,
        quantity: p.quantity,
        price: p.price,
      })),
    }));

    res.json({ success: true, orders: transformed });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// Get Single Order
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email")
      .populate("products.product", "name price unit");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const formatted = {
      ...order.toObject(),
      items: order.products.map((p) => ({
        productId: p.product,
        quantity: p.quantity,
        price: p.price,
      })),
    };

    res.json({ success: true, order: formatted });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
