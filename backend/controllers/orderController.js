const express = require("express")
const router = express.Router()
const Order = require("../models/Order")
const QRCode = require("qrcode")
const authMiddleware = require("../middlewares/authMiddleware")

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
  } = req.body

  try {
    // Handle both 'products' and 'items' field names for compatibility
    const orderItems = items || products

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      })
    }

    // Calculate total if not provided
    let orderTotal = totalAmount || total
    if (!orderTotal) {
      orderTotal = orderItems.reduce((sum, item) => {
        return sum + (item.price || 0) * (item.quantity || 1)
      }, 0)
    }

    // Use deliveryAddress or address for order address
    const orderAddress = deliveryAddress || address || "Not specified"

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
    })

    await order.save()

    // Generate QR Code after saving to get the order ID
    const qrData = `OrderID:${order._id}`
    try {
      order.qrCode = await QRCode.toDataURL(qrData)
      await order.save()
    } catch (qrError) {
      console.log("QR Code generation failed, but order created:", qrError.message)
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({
      success: false,
      message: "Server error while creating order",
      error: error.message,
    })
  }
})

// Get Orders
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate("customer", "name email").populate("products.product")
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update Order Status
router.put("/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
    res.json({ message: "Order status updated", order })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get Orders by Customer
router.get("/customer", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).populate("products.product").sort({ createdAt: -1 })
    res.json({
      success: true,
      orders,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

// Get Single Order
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("customer", "name email").populate("products.product")

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
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

module.exports = router
