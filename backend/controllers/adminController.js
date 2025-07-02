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
        path: "customer",
        select: "name email",
        strictPopulate: false,
      })
      .populate({
        path: "items.product",
        select: "name",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    res.json({ orders });
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

    const countByRole = {
      Customer: 0,
      ShopOwner: 0,
      Worker: 0,
      Admin: 0,
    };

    users.forEach((user) => {
      if (countByRole[user.role] !== undefined) {
        countByRole[user.role]++;
      }
    });

    res.json({
      total: users.length,
      countByRole,
      users,
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

const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "month" } = req.query;

    let groupBy;
    let dateRange;

    switch (period) {
      case "day":
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "week":
        groupBy = { $dateToString: { format: "%Y-%U", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        dateRange = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000);
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
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    const userGrowth = await User.aggregate([
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
};
