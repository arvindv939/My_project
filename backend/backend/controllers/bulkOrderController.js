const BulkOrder = require("../models/BulkOrder");
const Product = require("../models/Product");

// Get all bulk orders
exports.getBulkOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    const query = { isActive: true };
    if (type) {
      query.type = type;
    }

    // If user is shop owner, only show their bulk orders
    if (req.user.role === "ShopOwner") {
      query.createdBy = req.user.userId;
    }

    const bulkOrders = await BulkOrder.find(query)
      .populate("products.product", "name price imageUrl unit")
      .populate("createdBy", "name email")
      .populate("branch", "name code")
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

// Create bulk order
exports.createBulkOrder = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      products,
      minQuantity,
      maxQuantity,
      validFrom,
      validUntil,
      imageUrl,
    } = req.body;

    // Validate required fields
    if (!title || !type || !products || !validFrom || !validUntil) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Calculate total price and discounted price
    let totalPrice = 0;
    let discountedPrice = 0;

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }

      const itemTotal = product.price * item.quantity;
      totalPrice += itemTotal;

      const discountAmount = (itemTotal * (item.discountPercentage || 0)) / 100;
      discountedPrice += itemTotal - discountAmount;
    }

    const bulkOrder = new BulkOrder({
      title: title.trim(),
      description: description?.trim(),
      type,
      products,
      totalPrice,
      discountedPrice,
      minQuantity: minQuantity || 1,
      maxQuantity,
      validFrom,
      validUntil,
      createdBy: req.user.userId,
      imageUrl,
    });

    await bulkOrder.save();

    // Populate the fields for response
    await bulkOrder.populate("products.product", "name price imageUrl unit");
    await bulkOrder.populate("createdBy", "name email");

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
    const { id } = req.params;
    const updates = req.body;

    const bulkOrder = await BulkOrder.findById(id);

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    // Check if user owns this bulk order
    if (bulkOrder.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own bulk orders",
      });
    }

    // Recalculate prices if products are updated
    if (updates.products) {
      let totalPrice = 0;
      let discountedPrice = 0;

      for (const item of updates.products) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Product ${item.product} not found`,
          });
        }

        const itemTotal = product.price * item.quantity;
        totalPrice += itemTotal;

        const discountAmount =
          (itemTotal * (item.discountPercentage || 0)) / 100;
        discountedPrice += itemTotal - discountAmount;
      }

      updates.totalPrice = totalPrice;
      updates.discountedPrice = discountedPrice;
    }

    const updatedBulkOrder = await BulkOrder.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("products.product", "name price imageUrl unit")
      .populate("createdBy", "name email");

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
    const { id } = req.params;

    const bulkOrder = await BulkOrder.findById(id);

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: "Bulk order not found",
      });
    }

    // Check if user owns this bulk order
    if (bulkOrder.createdBy.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own bulk orders",
      });
    }

    // Soft delete
    await BulkOrder.findByIdAndUpdate(id, { isActive: false });

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

// Get bulk order by ID
exports.getBulkOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const bulkOrder = await BulkOrder.findById(id)
      .populate("products.product", "name price imageUrl unit stock")
      .populate("createdBy", "name email")
      .populate("branch", "name code");

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
