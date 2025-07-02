const Branch = require("../models/Branch");
const User = require("../models/User");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Get all branches
exports.getBranches = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const branches = await Branch.find(query)
      .populate("manager", "name email")
      .populate("shopOwners", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Branch.countDocuments(query);

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

// Get single branch
exports.getBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate("manager", "name email phone")
      .populate("shopOwners", "name email phone");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({
      success: true,
      branch,
    });
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching branch",
      error: error.message,
    });
  }
};

// Create branch
exports.createBranch = async (req, res) => {
  try {
    const {
      name,
      address,
      contact,
      manager,
      shopOwners,
      operatingHours,
      deliveryRadius,
      coordinates,
    } = req.body;

    // Validate required fields
    if (!name || !address || !contact) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if manager exists and has correct role
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser || !["admin", "manager"].includes(managerUser.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager selection",
        });
      }
    }

    // Validate shop owners
    if (shopOwners && shopOwners.length > 0) {
      const shopOwnerUsers = await User.find({
        _id: { $in: shopOwners },
        role: "ShopOwner",
      });

      if (shopOwnerUsers.length !== shopOwners.length) {
        return res.status(400).json({
          success: false,
          message: "One or more shop owners are invalid",
        });
      }
    }

    const branch = new Branch({
      name: name.trim(),
      address,
      contact,
      manager,
      shopOwners: shopOwners || [],
      operatingHours,
      deliveryRadius,
      coordinates,
    });

    await branch.save();

    await branch.populate("manager", "name email");
    await branch.populate("shopOwners", "name email");

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

// Update branch
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate manager if provided
    if (updates.manager) {
      const managerUser = await User.findById(updates.manager);
      if (!managerUser || !["admin", "manager"].includes(managerUser.role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager selection",
        });
      }
    }

    // Validate shop owners if provided
    if (updates.shopOwners && updates.shopOwners.length > 0) {
      const shopOwnerUsers = await User.find({
        _id: { $in: updates.shopOwners },
        role: "ShopOwner",
      });

      if (shopOwnerUsers.length !== updates.shopOwners.length) {
        return res.status(400).json({
          success: false,
          message: "One or more shop owners are invalid",
        });
      }
    }

    const branch = await Branch.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate("manager", "name email")
      .populate("shopOwners", "name email");

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({
      success: false,
      message: "Error updating branch",
      error: error.message,
    });
  }
};

// Delete branch
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // Check if branch has active orders
    const activeOrders = await Order.countDocuments({
      branch: id,
      status: { $in: ["pending", "confirmed", "preparing", "ready"] },
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete branch with active orders",
      });
    }

    // Soft delete
    await Branch.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting branch",
      error: error.message,
    });
  }
};

// Get branch analytics
exports.getBranchAnalytics = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const matchQuery = {};
    if (branchId) matchQuery.branch = mongoose.Types.ObjectId(branchId);
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const analytics = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$branch",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "_id",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: "$branch" },
    ]);

    res.json({
      success: true,
      analytics,
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

// Assign shop owner to branch
exports.assignShopOwner = async (req, res) => {
  try {
    const { branchId, shopOwnerId } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const shopOwner = await User.findById(shopOwnerId);
    if (!shopOwner || shopOwner.role !== "ShopOwner") {
      return res.status(400).json({
        success: false,
        message: "Invalid shop owner",
      });
    }

    if (!branch.shopOwners.includes(shopOwnerId)) {
      branch.shopOwners.push(shopOwnerId);
      await branch.save();
    }

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
