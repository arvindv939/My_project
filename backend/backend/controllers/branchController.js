const Branch = require("../models/Branch");
const User = require("../models/User");

// Get all branches
exports.getBranches = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const branches = await Branch.find({ isActive: true })
      .populate("manager", "name email")
      .populate("shopOwners", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Branch.countDocuments({ isActive: true });

    res.json({
      success: true,
      branches,
      totalPages: Math.ceil(total / limit),
      currentPage: Number.parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching branches",
      error: error.message,
    });
  }
};

// Create new branch
exports.createBranch = async (req, res) => {
  try {
    const { name, address, contact, manager, operatingHours, settings } =
      req.body;

    // Validate required fields
    if (!name || !address || !contact) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, address, contact",
      });
    }

    const branch = new Branch({
      name: name.trim(),
      address,
      contact,
      manager,
      operatingHours,
      settings,
    });

    await branch.save();

    // Populate the manager field for response
    await branch.populate("manager", "name email");

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    res.status(500).json({
      success: false,
      message: "Error creating branch",
      error: error.message,
    });
  }
};

// Assign shop owner to branch
exports.assignShopOwner = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { shopOwnerId } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const shopOwner = await User.findById(shopOwnerId);
    if (!shopOwner || shopOwner.role !== "ShopOwner") {
      return res.status(404).json({
        success: false,
        message: "Shop owner not found",
      });
    }

    // Check if shop owner is already assigned
    if (branch.shopOwners.includes(shopOwnerId)) {
      return res.status(400).json({
        success: false,
        message: "Shop owner already assigned to this branch",
      });
    }

    branch.shopOwners.push(shopOwnerId);
    await branch.save();

    await branch.populate("shopOwners", "name email");

    res.json({
      success: true,
      message: "Shop owner assigned successfully",
      branch,
    });
  } catch (error) {
    console.error("Error assigning shop owner:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning shop owner",
      error: error.message,
    });
  }
};

// Remove shop owner from branch
exports.removeShopOwner = async (req, res) => {
  try {
    const { branchId, shopOwnerId } = req.params;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    branch.shopOwners = branch.shopOwners.filter(
      (id) => id.toString() !== shopOwnerId
    );
    await branch.save();

    await branch.populate("shopOwners", "name email");

    res.json({
      success: true,
      message: "Shop owner removed successfully",
      branch,
    });
  } catch (error) {
    console.error("Error removing shop owner:", error);
    res.status(500).json({
      success: false,
      message: "Error removing shop owner",
      error: error.message,
    });
  }
};

// Get branch analytics
exports.getBranchAnalytics = async (req, res) => {
  try {
    const { branchId } = req.params;

    const branch = await Branch.findById(branchId)
      .populate("shopOwners", "name email")
      .populate("manager", "name email");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Get branch-specific analytics
    const Order = require("../models/Order");
    const Product = require("../models/Product");

    const totalOrders = await Order.countDocuments({ branch: branchId });
    const totalProducts = await Product.countDocuments({
      createdBy: { $in: branch.shopOwners },
    });

    const revenueResult = await Order.aggregate([
      { $match: { branch: branchId, status: "delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      analytics: {
        branch,
        totalOrders,
        totalProducts,
        totalRevenue,
        shopOwnersCount: branch.shopOwners.length,
      },
    });
  } catch (error) {
    console.error("Error fetching branch analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching branch analytics",
      error: error.message,
    });
  }
};
