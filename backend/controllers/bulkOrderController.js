const mongoose = require("mongoose");
const BulkOrder = require("../models/BulkOrder");
const Product = require("../models/Product");

// Get all bulk orders
exports.getBulkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive, branch, shop } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (branch) query.branch = branch;
    if (shop) query.shop = shop;

    const bulkOrders = await BulkOrder.find(query)
      .populate("products.product", "name images category")
      .populate("branch", "name code")
      .populate("shop", "name")
      .populate("createdBy", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await BulkOrder.countDocuments(query);

    res.json({
      success: true,
      bulkOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching bulk orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bulk orders",
      error: error.message,
    });
  }
};

// Get single bulk order
exports.getBulkOrder = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id)
      .populate("products.product", "name images category description")
      .populate("branch", "name code address")
      .populate("shop", "name address")
      .populate("createdBy", "name email");

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    res.json({
      success: true,
      bulkOrder,
    });
  } catch (error) {
    console.error("Error fetching bulk order:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bulk order",
      error: error.message,
    });
  }
};

// Create bulk order
exports.createBulkOrder = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      products,
      pricing,
      minimumQuantity,
      maximumQuantity,
      availableQuantity,
      validFrom,
      validUntil,
      deliveryOptions,
      terms,
      images,
      tags,
      branch,
      shop,
    } = req.body;

    // Validate required fields
    if (!title || !description || !type || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate products exist
    const productIds = products.map((p) => p.product);
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products not found",
      });
    }

    const bulkOrder = new BulkOrder({
      title: title.trim(),
      description: description.trim(),
      type,
      products,
      pricing,
      minimumQuantity,
      maximumQuantity,
      availableQuantity,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      deliveryOptions,
      terms,
      images,
      tags,
      branch,
      shop,
      createdBy: req.user.id,
    });

    await bulkOrder.save();

    await bulkOrder.populate("products.product", "name images category");

    res.status(201).json({
      success: true,
      message: "Bulk order created successfully",
      bulkOrder,
    });
  } catch (error) {
    console.error("Error creating bulk order:", error);
    res.status(500).json({
      success: false,
      message: "Error creating bulk order",
      error: error.message,
    });
  }
};

// Update bulk order
exports.updateBulkOrder = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id);

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    // Check if user has permission to update
    if (
      bulkOrder.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this bulk order",
      });
    }

    const updatedBulkOrder = await BulkOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("products.product", "name images category");

    res.json({
      success: true,
      message: "Bulk order updated successfully",
      bulkOrder: updatedBulkOrder,
    });
  } catch (error) {
    console.error("Error updating bulk order:", error);
    res.status(500).json({
      success: false,
      message: "Error updating bulk order",
      error: error.message,
    });
  }
};

// Delete bulk order
exports.deleteBulkOrder = async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findById(req.params.id);

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    // Check if user has permission to delete
    if (
      bulkOrder.createdBy.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this bulk order",
      });
    }

    await BulkOrder.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Bulk order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting bulk order:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting bulk order",
      error: error.message,
    });
  }
};

// Get bulk order analytics
exports.getBulkOrderAnalytics = async (req, res) => {
  try {
    const { branch, shop, startDate, endDate } = req.query;

    const matchQuery = {};
    if (branch) matchQuery.branch = mongoose.Types.ObjectId(branch);
    if (shop) matchQuery.shop = mongoose.Types.ObjectId(shop);
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const analytics = await BulkOrder.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalBulkOrders: { $sum: 1 },
          totalRevenue: { $sum: "$pricing.discountedPrice" },
          totalSavings: { $sum: "$pricing.savings" },
          averageOrderValue: { $avg: "$pricing.discountedPrice" },
          totalQuantitySold: { $sum: "$soldQuantity" },
        },
      },
    ]);

    const typeAnalytics = await BulkOrder.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          revenue: { $sum: "$pricing.discountedPrice" },
        },
      },
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalBulkOrders: 0,
        totalRevenue: 0,
        totalSavings: 0,
        averageOrderValue: 0,
        totalQuantitySold: 0,
      },
      typeAnalytics,
    });
  } catch (error) {
    console.error("Error fetching bulk order analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching bulk order analytics",
      error: error.message,
    });
  }
};
