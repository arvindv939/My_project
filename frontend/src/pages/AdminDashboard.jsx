"use client";

import { useEffect, useState } from "react";
import API from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#0088FE",
];

function AdminDashboard() {
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    profit: 0,
    loss: 0,
    orders: 0,
    products: 0,
    users: 0,
    chartData: [],
    categoryAnalysis: [],
    monthlyData: [],
    userGrowth: [],
    topProducts: [],
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [financialsRes, ordersRes, productsRes, usersRes] =
        await Promise.all([
          API.get("/admin/financials", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          API.get("/admin/orders", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          API.get("/admin/products", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          API.get("/admin/users", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

      // Generate enhanced mock data for demonstration
      const enhancedData = {
        ...financialsRes.data,
        monthlyData: [
          { month: "Jan", revenue: 45000, orders: 120, users: 450 },
          { month: "Feb", revenue: 52000, orders: 145, users: 520 },
          { month: "Mar", revenue: 48000, orders: 135, users: 580 },
          { month: "Apr", revenue: 61000, orders: 165, users: 640 },
          { month: "May", revenue: 55000, orders: 150, users: 720 },
          { month: "Jun", revenue: 67000, orders: 180, users: 800 },
        ],
        userGrowth: [
          { week: "Week 1", customers: 120, shopOwners: 15 },
          { week: "Week 2", customers: 145, shopOwners: 18 },
          { week: "Week 3", customers: 160, shopOwners: 22 },
          { week: "Week 4", customers: 180, shopOwners: 25 },
        ],
        topProducts: [
          { name: "Organic Apples", sales: 245, revenue: 12250 },
          { name: "Fresh Spinach", sales: 189, revenue: 5670 },
          { name: "Whole Wheat Bread", sales: 156, revenue: 4680 },
          { name: "Organic Milk", sales: 134, revenue: 8040 },
          { name: "Free Range Eggs", sales: 98, revenue: 4900 },
        ],
        recentOrders: ordersRes.data?.orders?.slice(0, 10) || [],
      };

      setAnalytics(enhancedData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon, color, trend }) => (
    <div
      className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white hover:shadow-xl transition-shadow duration-200`}
      style={{
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <div
          className={`text-sm px-2 py-1 rounded-full ${
            trend === "up"
              ? "bg-green-500"
              : trend === "down"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        >
          {change}
        </div>
      </div>
      <h3 className="text-lg font-medium opacity-90">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
        isActive
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
      style={
        isActive
          ? {
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }
          : {}
      }
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}
          >
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive analytics and system management
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex space-x-2">
          {["24h", "7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === range
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${analytics.revenue?.toLocaleString() || 0}`}
            change="+12.5%"
            icon="💰"
            color="from-green-500 to-emerald-600"
            trend="up"
          />
          <StatCard
            title="Total Orders"
            value={analytics.orders || 0}
            change="+8.2%"
            icon="📦"
            color="from-blue-500 to-cyan-600"
            trend="up"
          />
          <StatCard
            title="Active Users"
            value={analytics.users || 0}
            change="+15.3%"
            icon="👥"
            color="from-purple-500 to-pink-600"
            trend="up"
          />
          <StatCard
            title="Products"
            value={analytics.products || 0}
            change="+5.7%"
            icon="🛍️"
            color="from-orange-500 to-red-600"
            trend="up"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex flex-wrap gap-4">
          <TabButton
            id="overview"
            label="Overview"
            icon="📊"
            isActive={activeTab === "overview"}
            onClick={setActiveTab}
          />
          <TabButton
            id="sales"
            label="Sales Analytics"
            icon="💹"
            isActive={activeTab === "sales"}
            onClick={setActiveTab}
          />
          <TabButton
            id="users"
            label="User Management"
            icon="👤"
            isActive={activeTab === "users"}
            onClick={setActiveTab}
          />
          <TabButton
            id="products"
            label="Product Analytics"
            icon="📈"
            isActive={activeTab === "products"}
            onClick={setActiveTab}
          />
          <TabButton
            id="orders"
            label="Order Management"
            icon="🚚"
            isActive={activeTab === "orders"}
            onClick={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <div className="transition-opacity duration-300">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Revenue Chart */}
              <div
                className="bg-white rounded-2xl p-6"
                style={{
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  Revenue Overview
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyData}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8884d8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Analysis */}
                <div
                  className="bg-white rounded-2xl p-6"
                  style={{
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Category Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryAnalysis}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {analytics.categoryAnalysis?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* User Growth */}
                <div
                  className="bg-white rounded-2xl p-6"
                  style={{
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    User Growth
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="customers" fill="#8884d8" />
                      <Bar dataKey="shopOwners" fill="#82ca9d" />
                      <Bar dataKey="workers" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sales" && (
            <div className="space-y-8">
              {/* Sales Performance */}
              <div
                className="bg-white rounded-2xl p-6"
                style={{
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  Sales Performance
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analytics.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#82ca9d"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke="#ff7300"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top Products */}
              <div
                className="bg-white rounded-2xl p-6"
                style={{
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h3 className="text-xl font-bold mb-4 text-gray-800">
                  Top Selling Products
                </h3>
                <div className="space-y-4">
                  {analytics.topProducts?.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl hover:shadow-md transition-shadow duration-200"
                      style={{
                        boxShadow:
                          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {product.sales} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₹{product.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div
              className="bg-white rounded-2xl p-6"
              style={{
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                User Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Total Customers</h4>
                  <p className="text-3xl font-bold">1,234</p>
                  <p className="text-sm opacity-80">+12% this month</p>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Shop Owners</h4>
                  <p className="text-3xl font-bold">45</p>
                  <p className="text-sm opacity-80">+3 new this week</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Workers</h4>
                  <p className="text-3xl font-bold">89</p>
                  <p className="text-sm opacity-80">+5 active today</p>
                </div>
              </div>

              {/* User Activity Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="customers" fill="#3B82F6" />
                  <Bar dataKey="shopOwners" fill="#10B981" />
                  <Bar dataKey="workers" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  className="bg-white rounded-2xl p-6"
                  style={{
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Product Categories
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryAnalysis}
                        dataKey="count"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {analytics.categoryAnalysis?.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div
                  className="bg-white rounded-2xl p-6"
                  style={{
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Inventory Status
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">
                        In Stock
                      </span>
                      <span className="font-bold text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-800">
                        Low Stock
                      </span>
                      <span className="font-bold text-yellow-600">12%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-800">
                        Out of Stock
                      </span>
                      <span className="font-bold text-red-600">3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div
              className="bg-white rounded-2xl p-6"
              style={{
                boxShadow:
                  "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                Recent Orders
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Order ID
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Customer
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.recentOrders?.map((order, index) => (
                      <tr
                        key={order._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4">#{order._id?.slice(-6)}</td>
                        <td className="py-3 px-4">
                          {order.customer?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4">₹{order.totalPrice || 0}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Processing"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
