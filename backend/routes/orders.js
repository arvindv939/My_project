const express = require("express")
const router = express.Router()
const authMiddleware = require("../middlewares/authMiddleware")
const roleMiddleware = require("../middlewares/roleMiddleware")
const Order = require("../models/Order")

// Get orders for shop owner - MUST come before /:id route
router.get("/shop-owner", authMiddleware, roleMiddleware(["shop_owner", "ShopOwner"]), async (req, res) => {
  try {
    console.log("Fetching orders for shop owner:", req.user.userId)

    // Find orders that contain products created by this shop owner
    const orders = await Order.find({
      "items.createdBy": req.user.userId,
    })
      .populate("customer", "name email phone")
      .populate("items.product", "name price imageUrl")
      .sort({ createdAt: -1 })

    // Filter items to only show products created by this shop owner
    const filteredOrders = orders
      .map((order) => ({
        ...order.toObject(),
        items: order.items.filter((item) => item.createdBy && item.createdBy.toString() === req.user.userId),
      }))
      .filter((order) => order.items.length > 0)

    res.json({
      success: true,
      orders: filteredOrders,
      total: filteredOrders.length,
    })
  } catch (error) {
    console.error("Get shop owner orders error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    })
  }
})

// Get single order by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.product", "name price imageUrl")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("Get order error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    })
  }
})

// Create new order
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, totalAmount } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      })
    }

    const order = new Order({
      customer: req.user.userId,
      items,
      deliveryAddress,
      paymentMethod,
      totalAmount,
      status: "pending",
    })

    await order.save()
    await order.populate("customer", "name email phone")
    await order.populate("items.product", "name price imageUrl")

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    })
  } catch (error) {
    console.error("Create order error:", error)
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    })
  }
})

// Update order status
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status, updatedAt: new Date() }, { new: true })
      .populate("customer", "name email phone")
      .populate("items.product", "name price imageUrl")

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      })
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    })
  } catch (error) {
    console.error("Update order status error:", error)
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    })
  }
})

// Get customer orders
router.get("/customer/my-orders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.userId })
      .populate("items.product", "name price imageUrl")
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    console.error("Get customer orders error:", error)
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    })
  }
})

module.exports = router
