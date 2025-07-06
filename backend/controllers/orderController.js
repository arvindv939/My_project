const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const {
      products,
      total,
      paymentMethod,
      orderType,
      scheduledDate,
      scheduledTime,
      address,
      notes,
    } = req.body;
    const customerId = req.user.id;

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Products are required and must be a non-empty array",
      });
    }

    if (!total || total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be greater than 0",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    // Validate products and calculate total
    let calculatedTotal = 0;
    const orderProducts = [];

    for (const item of products) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each product must have a valid product ID and quantity",
        });
      }

      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`,
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }

      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      // Update product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Verify total matches calculated total (with small tolerance for floating point)
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total mismatch. Expected: ${calculatedTotal}, Received: ${total}`,
      });
    }

    // Create the order
    const order = new Order({
      customer: customerId,
      products: orderProducts,
      total: calculatedTotal,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      orderType: orderType || "delivery",
      scheduledDate: scheduledDate || new Date(),
      scheduledTime: scheduledTime || "ASAP",
      address: address.trim(),
      deliveryAddress: address.trim(),
      notes: notes || "",
      status: "pending",
    });

    await order.save();

    // Populate the order with product details
    const populatedOrder = await Order.findById(order._id)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Get orders for a customer
exports.getCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { status, limit = 50, page = 1 } = req.query;

    const query = { customer: customerId };
    if (status) {
      query.status = status;
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    const orders = await Order.find(query)
      .populate("products.product", "name category imageUrl")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(skip);

    const totalOrders = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalOrders / Number.parseInt(limit)),
        totalOrders,
        hasMore: skip + orders.length < totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get orders for shop owner
exports.getShopOwnerOrders = async (req, res) => {
  try {
    const { status, limit = 100, page = 1 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    const orders = await Order.find(query)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl")
      .sort({ createdAt: -1 })
      .limit(Number.parseInt(limit))
      .skip(skip);

    const totalOrders = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    res.json({
      success: true,
      orders,
      stats,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(totalOrders / Number.parseInt(limit)),
        totalOrders,
        hasMore: skip + orders.length < totalOrders,
      },
    });
  } catch (error) {
    console.error("Error fetching shop owner orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Valid statuses are: " + validStatuses.join(", "),
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update status
    order.status = status;

    // Set delivery time if delivered
    if (status === "delivered") {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = "paid"; // Mark as paid when delivered
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl");

    res.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

// Update payment method and status
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod, paymentStatus } = req.body;

    const validPaymentMethods = ["cash", "upi", "card", "online"];
    const validPaymentStatuses = ["pending", "paid", "failed", "refunded"];

    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment method. Valid methods are: " +
          validPaymentMethods.join(", "),
      });
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status. Valid statuses are: " +
          validPaymentStatuses.join(", "),
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update payment details
    if (paymentMethod) {
      order.paymentMethod = paymentMethod;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl");

    res.json({
      success: true,
      message: "Payment details updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating payment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment details",
      error: error.message,
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if user owns this order
    if (order.customer.toString() !== customerId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own orders",
      });
    }

    // Check if order can be cancelled
    if (["delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }

    // Restore product stock
    for (const item of order.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // Update order status
    order.status = "cancelled";
    order.paymentStatus = "refunded";
    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl");

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

// Get single order details
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(orderId)
      .populate("customer", "name email phone")
      .populate("products.product", "name category imageUrl price");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check permissions
    if (userRole === "customer" && order.customer._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Get order analytics for shop owner
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "24h":
        dateFilter = {
          createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
        };
        break;
      case "7d":
        dateFilter = {
          createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
        };
        break;
      case "30d":
        dateFilter = {
          createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) },
        };
        break;
      case "90d":
        dateFilter = {
          createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) },
        };
        break;
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    // Get daily order trends
    const dailyTrends = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          orderCount: { $sum: 1 },
          revenue: { $sum: "$total" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Get payment method distribution
    const paymentMethods = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    // Get top products
    const topProducts = await Order.aggregate([
      { $match: dateFilter },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.product",
          totalQuantity: { $sum: "$products.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$products.quantity", "$products.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
    ]);

    res.json({
      success: true,
      analytics: {
        orderStats,
        dailyTrends,
        paymentMethods,
        topProducts,
        period,
      },
    });
  } catch (error) {
    console.error("Error fetching order analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order analytics",
      error: error.message,
    });
  }
};
