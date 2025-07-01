const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

const router = express.Router();

// Create order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod } = req.body;

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${product.name}` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    const order = new Order({
      customer: req.user.userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      status: "pending",
    });

    await order.save();
    await order.populate("items.product", "name images");
    await order.populate("customer", "name email phone");

    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user orders
router.get("/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.userId })
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get shop owner orders
router.get(
  "/shop-owner",
  authMiddleware,
  roleMiddleware(["shop_owner", "ShopOwner"]),
  async (req, res) => {
    try {
      console.log("Fetching orders for shop owner:", req.user.id);

      // Find products created by this shop owner
      const shopOwnerProducts = await Product.find({
        createdBy: req.user.userId,
      }).select("_id");
      const productIds = shopOwnerProducts.map((p) => p._id);

      console.log("Shop owner products:", productIds);

      // Find orders that contain these products
      const orders = await Order.find({
        "items.product": { $in: productIds },
      })
        .populate("items.product", "name imageUrl")
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 });

      console.log("Found orders:", orders.length);

      res.json({
        success: true,
        orders: orders || [],
        total: orders.length,
      });
    } catch (error) {
      console.error("Get shop owner orders error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// Get order by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name images")
      .populate("customer", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order or is admin/shop_owner
    if (
      order.customer._id.toString() !== req.user.userId &&
      !["admin", "shop_owner", "ShopOwner"].includes(req.user.role)
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update order status (admin/shop_owner only)
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware(["admin", "shop_owner", "ShopOwner"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      )
        .populate("items.product", "name images")
        .populate("customer", "name email phone");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Cancel order
router.put("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user owns this order
    if (order.customer.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Can only cancel pending orders
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel this order" });
    }

    // Restore product stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all orders (admin only)
router.get("/", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("items.product", "name images")
      .populate("customer", "name email phone")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
