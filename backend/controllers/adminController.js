const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Branch = require("../models/Branch");

const getFinancials = async (req, res) => {
  try {
    const orders = await Order.find({});
    const revenue = orders.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );
    const profit = revenue * 0.3;
    const loss = revenue * 0.05;

    res.json({ revenue, profit, loss });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch financials", error: err });
  }
};

const getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate({
        path: "customerId",
        select: "name email phone",
        strictPopulate: false,
      })
      .populate({
        path: "items.productId",
        select: "name price unit category",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    // Process orders to ensure proper total calculation and update database
    const processedOrders = await Promise.all(
      orders.map(async (order) => {
        const orderObj = order.toObject();

        // Add customer field for backward compatibility
        orderObj.customer = orderObj.customerId;

        // Calculate total from items
        if (orderObj.items && orderObj.items.length > 0) {
          let calculatedTotal = 0;

          orderObj.items.forEach((item) => {
            const productPrice = item.productId?.price || item.price || 0;
            calculatedTotal += productPrice * (item.quantity || 0);
          });

          // Update the order total if it's 0 or missing
          if (!orderObj.totalAmount || orderObj.totalAmount === 0) {
            orderObj.totalAmount = calculatedTotal;

            // Update the database record
            try {
              await Order.findByIdAndUpdate(order._id, {
                totalAmount: calculatedTotal,
              });
            } catch (updateError) {
              console.error("Error updating order total:", updateError);
            }
          }
        }

        return orderObj;
      })
    );

    res.json({ orders: processedOrders });
  } catch (err) {
    console.error("getAdminOrders error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch orders", error: err.message });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    const categories = {};

    products.forEach((prod) => {
      const cat = prod.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const categoryAnalysis = Object.entries(categories).map(([key, value]) => ({
      _id: key,
      count: value,
    }));

    res.json({
      productsCount: products.length,
      categoryAnalysis,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("name email role createdAt");

    // Only count Customer, ShopOwner, and Admin roles - exclude Worker completely
    const countByRole = {
      Customer: 0,
      ShopOwner: 0,
      Admin: 0,
    };

    users.forEach((user) => {
      if (countByRole[user.role] !== undefined) {
        countByRole[user.role]++;
      }
    });

    // Filter out any users with Worker role from the response
    const filteredUsers = users.filter((user) => user.role !== "Worker");

    res.json({
      total: filteredUsers.length,
      countByRole,
      users: filteredUsers,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users", error: err });
  }
};

const getBranchAnalytics = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .populate("shopOwners", "name email")
      .populate("manager", "name email");

    const branchAnalytics = await Promise.all(
      branches.map(async (branch) => {
        const branchOrders = await Order.find({ branch: branch._id });
        const branchRevenue = branchOrders.reduce(
          (sum, order) => sum + (order.totalAmount || 0),
          0
        );

        return {
          _id: branch._id,
          name: branch.name,
          code: branch.code,
          shopOwnersCount: branch.shopOwners.length,
          ordersCount: branchOrders.length,
          revenue: branchRevenue,
        };
      })
    );

    res.json({
      success: true,
      branchAnalytics,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch branch analytics",
      error: err.message,
    });
  }
};

const getSalesAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let groupBy;
    let dateRange;

    switch (period) {
      case "24h":
        groupBy = {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
        };
        dateRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          createdAt: { $gte: dateRange },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(salesData);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch sales analytics",
      error: err.message,
    });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let groupBy;
    let dateRange;

    switch (period) {
      case "24h":
        groupBy = {
          $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
        };
        dateRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
      case "30d":
        groupBy = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
        dateRange = new Date(
          Date.now() - (period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000
        );
        break;
      case "90d":
        groupBy = {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        };
        dateRange = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        groupBy = {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        };
        dateRange = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          status: "delivered",
          createdAt: { $gte: dateRange },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      revenueData,
      period,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: err.message,
    });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: "Worker" } });
    const activeUsers = await User.countDocuments({
      isActive: true,
      role: { $ne: "Worker" },
    });

    const usersByRole = await User.aggregate([
      {
        $match: { role: { $ne: "Worker" } },
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const userGrowth = await User.aggregate([
      {
        $match: { role: { $ne: "Worker" } },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      userAnalytics: {
        totalUsers,
        activeUsers,
        usersByRole,
        userGrowth,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: err.message,
    });
  }
};

module.exports = {
  getFinancials,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
  getBranchAnalytics,
  getRevenueAnalytics,
  getUserAnalytics,
  getSalesAnalytics, // ✅ Add this
};
