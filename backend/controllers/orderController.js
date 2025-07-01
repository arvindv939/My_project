// controllers/orderController.js
const Order = require("../models/Order");
const QRCode = require("qrcode");

exports.createOrder = async (req, res) => {
  const { products, scheduledDate, scheduledTime, orderType } = req.body;
  try {
    const order = new Order({
      customer: req.user.id,
      products,
      scheduledDate,
      scheduledTime,
      orderType,
    });

    // Generate QR Code
    const qrData = `OrderID:${order._id}`;
    order.qrCode = await QRCode.toDataURL(qrData);

    await order.save();
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
