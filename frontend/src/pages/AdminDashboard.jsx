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

// Add this new tab to the TABS array at the top
const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sales", label: "Sales Analytics", icon: "💹" },
  { id: "users", label: "User Management", icon: "👤" },
  { id: "products", label: "Product Analytics", icon: "📈" },
  { id: "orders", label: "Order Management", icon: "🚚" },
  { id: "branches", label: "Branch Management", icon: "🏪" }, // Add this new tab
  { id: "announcements", label: "Announcements", icon: "📢" }, // Add this new tab
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

  // Add these new state variables
  const [branches, setBranches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    contact: {
      phone: "",
      email: "",
    },
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    message: "",
    type: "info",
    targetAudience: "all",
    priority: "medium",
    expiresAt: "",
  });

  // Add these fetch functions
  const fetchBranches = async () => {
    try {
      const response = await API.get("/branches", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await API.get("/announcements", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnnouncements(response.data.announcements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchBranches();
    fetchAnnouncements();
    const interval = setInterval(() => {
      fetchAnalytics();
      fetchBranches();
      fetchAnnouncements();
    }, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Add these handler functions
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await API.post("/branches", branchForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowBranchModal(false);
      setBranchForm({
        name: "",
        address: { street: "", city: "", state: "", zipCode: "" },
        contact: { phone: "", email: "" },
      });
      fetchBranches();
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await API.post("/announcements", announcementForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: "",
        message: "",
        type: "info",
        targetAudience: "all",
        priority: "medium",
        expiresAt: "",
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [financialsRes, ordersRes] = await Promise.all([
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
        orders: ordersRes.data?.orders?.length || 0,
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
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
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
                        {analytics.categoryAnalysis?.map((_entry, index) => (
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
                        {analytics.categoryAnalysis?.map((_entry, index) => (
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
                    //
                    {analytics.recentOrders?.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="py-3 px-4">#{order._id?.slice(-6)}</td>
                        <td className="py-3 px-4">
                          {order.customer?.name || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          ₹{order.totalPrice || order.totalAmount || 0}
                        </td>
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

          {activeTab === "branches" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Branch Management
                  </h3>
                  <p className="text-gray-600">
                    Manage store branches and assign shop owners
                  </p>
                </div>
                <button
                  onClick={() => setShowBranchModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Add New Branch
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                  <div
                    key={branch._id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          {branch.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Code: {branch.code}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        📍 {branch.address.city}, {branch.address.state}
                      </p>
                      <p className="text-sm text-gray-600">
                        📞 {branch.contact.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        👥 {branch.shopOwners?.length || 0} Shop Owners
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 bg-gray-50 text-gray-600 py-2 px-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                        Assign Owner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "announcements" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Announcements & Communications
                  </h3>
                  <p className="text-gray-600">
                    Create and manage platform-wide announcements
                  </p>
                </div>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Create Announcement
                </button>
              </div>

              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-bold text-lg text-gray-800">
                            {announcement.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              announcement.type === "info"
                                ? "bg-blue-100 text-blue-800"
                                : announcement.type === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : announcement.type === "success"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {announcement.type.toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              announcement.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : announcement.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {announcement.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {announcement.message}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Target: {announcement.targetAudience}</span>
                          <span>
                            Created:{" "}
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString()}
                          </span>
                          {announcement.expiresAt && (
                            <span>
                              Expires:{" "}
                              {new Date(
                                announcement.expiresAt
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg">
                          ✏️
                        </button>
                        <button className="text-red-600 hover:bg-red-50 p-2 rounded-lg">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branch Modal */}
          {showBranchModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Add New Branch
                    </h2>
                    <button
                      onClick={() => setShowBranchModal(false)}
                      className="text-gray-500 hover:text-red-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleCreateBranch} className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Branch Name*
                      </label>
                      <input
                        type="text"
                        required
                        value={branchForm.name}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, name: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter branch name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Street Address*
                        </label>
                        <input
                          type="text"
                          required
                          value={branchForm.address.street}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              address: {
                                ...branchForm.address,
                                street: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter street address"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          City*
                        </label>
                        <input
                          type="text"
                          required
                          value={branchForm.address.city}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              address: {
                                ...branchForm.address,
                                city: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          State*
                        </label>
                        <input
                          type="text"
                          required
                          value={branchForm.address.state}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              address: {
                                ...branchForm.address,
                                state: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          ZIP Code*
                        </label>
                        <input
                          type="text"
                          required
                          value={branchForm.address.zipCode}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              address: {
                                ...branchForm.address,
                                zipCode: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter ZIP code"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Phone*
                        </label>
                        <input
                          type="tel"
                          required
                          value={branchForm.contact.phone}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              contact: {
                                ...branchForm.contact,
                                phone: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={branchForm.contact.email}
                          onChange={(e) =>
                            setBranchForm({
                              ...branchForm,
                              contact: {
                                ...branchForm.contact,
                                email: e.target.value,
                              },
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowBranchModal(false)}
                        className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Create Branch
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Announcement Modal */}
          {showAnnouncementModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      Create Announcement
                    </h2>
                    <button
                      onClick={() => setShowAnnouncementModal(false)}
                      className="text-gray-500 hover:text-red-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Title*
                      </label>
                      <input
                        type="text"
                        required
                        value={announcementForm.title}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            title: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter announcement title"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Message*
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={announcementForm.message}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            message: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter announcement message"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Type
                        </label>
                        <select
                          value={announcementForm.type}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              type: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="success">Success</option>
                          <option value="promotion">Promotion</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Target Audience
                        </label>
                        <select
                          value={announcementForm.targetAudience}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              targetAudience: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="all">All Users</option>
                          <option value="customers">Customers</option>
                          <option value="shop_owners">Shop Owners</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2">
                          Priority
                        </label>
                        <select
                          value={announcementForm.priority}
                          onChange={(e) =>
                            setAnnouncementForm({
                              ...announcementForm,
                              priority: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Expires At (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={announcementForm.expiresAt}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            expiresAt: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                      <button
                        type="button"
                        onClick={() => setShowAnnouncementModal(false)}
                        className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Create Announcement
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
