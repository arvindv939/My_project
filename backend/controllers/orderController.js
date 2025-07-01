// controllers/orderController.js
const Order = require("../models/Order");
const QRCode = require("qrcode");

exports.createOrder = async (req, res) => {
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
  } = req.body;

  try {
    // Handle both 'products' and 'items' field names for compatibility
    const orderItems = items || products;

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required",
      });
    }

    // Calculate total if not provided
    let orderTotal = total;
    if (!orderTotal) {
      orderTotal = orderItems.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0);
    }

    const order = new Order({
      customer: req.user.id,
      products: orderItems,
      total: orderTotal,
      scheduledDate,
      scheduledTime,
      orderType: orderType || "pickup",
      paymentMethod: paymentMethod || "cash",
      notes,
      address,
    });

    // Generate QR Code
    const qrData = `OrderID:${order._id}`;
    order.qrCode = await QRCode.toDataURL(qrData);

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "name email")
      .populate("products.product");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
