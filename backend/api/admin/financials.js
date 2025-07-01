router.get("/financials", authMiddleware, async (req, res) => {
  try {
    // Orders, Products, Users count
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments();

    // Calculate revenue & profit from orders
    const orders = await Order.find();
    let revenue = 0;
    let profit = 0;
    let loss = 0;

    orders.forEach((order) => {
      revenue += order.totalPrice; // assuming totalPrice in Order schema
      profit += order.totalPrice * 0.2; // sample 20% profit margin
      loss += order.totalPrice * 0.05; // sample 5% loss
    });

    // Category analysis
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Chart data sample
    const chartData = [
      { month: "Jan", revenue: 10000, profit: 3000, loss: 1000 },
      { month: "Feb", revenue: 15000, profit: 5000, loss: 2000 },
      { month: "Mar", revenue: 20000, profit: 7000, loss: 3000 },
    ];

    res.json({
      revenue,
      profit,
      loss,
      orders: totalOrders,
      products: totalProducts,
      users: totalUsers,
      chartData,
      categoryAnalysis: categories, // NEW
    });
  } catch (err) {
    console.error("Error in admin/financials route:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
