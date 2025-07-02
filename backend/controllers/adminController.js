const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const getFinancials = async (req, res) => {
  try {
    const orders = await Order.find({});
    const revenue = orders.reduce(
      (sum, order) => sum + (order.totalPrice || 0),
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
      .populate("customer", "name email")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err });
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

module.exports = {
  getFinancials,
  getAdminOrders,
  getAdminProducts,
  getAdminUsers,
};
