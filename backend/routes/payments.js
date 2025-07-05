const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authMiddleware = require("../middlewares/authMiddleware");

// Dummy Payment Processing
router.post("/process", authMiddleware, async (req, res) => {
  const { orderId, amount, paymentMethod, cardDetails } = req.body;

  try {
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Dummy payment logic - simulate success/failure
    const isPaymentSuccessful = Math.random() > 0.1; // 90% success rate

    if (isPaymentSuccessful) {
      // Generate dummy transaction ID
      const transactionId = `TXN${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;

      // Update order with payment details
      order.paymentStatus = "paid";
      order.transactionId = transactionId;
      order.status = "confirmed";
      await order.save();

      res.json({
        success: true,
        message: "Payment processed successfully",
        transactionId,
        paymentStatus: "paid",
      });
    } else {
      // Payment failed
      order.paymentStatus = "failed";
      await order.save();

      res.status(400).json({
        success: false,
        message: "Payment processing failed. Please try again.",
        paymentStatus: "failed",
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during payment processing",
      error: error.message,
    });
  }
});

// Get Payment Status
router.get("/status/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Refund Payment (Dummy)
router.post("/refund", authMiddleware, async (req, res) => {
  const { orderId, reason } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot refund unpaid order",
      });
    }

    // Simulate refund processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    order.paymentStatus = "refunded";
    order.status = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      refundId: `REF${Date.now()}`,
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during refund processing",
      error: error.message,
    });
  }
});

module.exports = router;
