"use client";

import { useEffect, useState } from "react";
import API from "../services/api";
import OrderTable from "../components/OrderTable";
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

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sales", label: "Sales Analytics", icon: "💹" },
  { id: "users", label: "User Management", icon: "👤" },
  { id: "products", label: "Product Analytics", icon: "📈" },
  { id: "orders", label: "Order Management", icon: "🚚" },
  { id: "branches", label: "Branch Management", icon: "🏪" },
  { id: "announcements", label: "Announcements", icon: "📢" },
];

function AdminDashboard() {
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    profit: 0,
    loss: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalShops: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    chartData: [],
    categoryAnalysis: [],
    monthlyData: [],
    userGrowth: [],
    topProducts: [],
    recentOrders: [],
    usersByRole: [],
    salesData: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");

  // Branch and announcement states
  const [branches, setBranches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
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
    discountPercentage: "",
    minOrderValue: "",
  });

  // User management states
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Orders state for OrderTable
  const [orders, setOrders] = useState([]);

  // Helper function to convert time range to API format
  const getTimeRangeParam = (range) => {
    switch (range) {
      case "24h":
        return "1day";
      case "7d":
        return "7days";
      case "30d":
        return "30days";
      case "90d":
        return "90days";
      default:
        return "7days";
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchFinancials(),
        fetchOrders(),
        fetchProducts(),
        fetchUsers(),
        fetchBranches(),
        fetchAnnouncements(),
        fetchSalesAnalytics(),
        fetchRevenueAnalytics(),
        fetchUserAnalytics(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(`/admin/dashboard?period=${timeParam}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnalytics((prev) => ({
        ...prev,
        ...response.data,
      }));
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchFinancials = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(`/admin/financials?period=${timeParam}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnalytics((prev) => ({
        ...prev,
        revenue: response.data.revenue,
        profit: response.data.profit,
        loss: response.data.loss,
      }));
    } catch (error) {
      console.error("Error fetching financials:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(`/admin/orders?period=${timeParam}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const ordersData = response.data.orders || [];
      setOrders(ordersData);
      setAnalytics((prev) => ({
        ...prev,
        recentOrders: ordersData,
        totalOrders: ordersData.length,
      }));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await API.get("/admin/products", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setAnalytics((prev) => ({
        ...prev,
        categoryAnalysis: response.data.categoryAnalysis || [],
        totalProducts: response.data.productsCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await API.get("/admin/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data.users || []);
      setAnalytics((prev) => ({
        ...prev,
        totalUsers: response.data.users?.length || 0,
        usersByRole: Object.entries(response.data.countByRole || {})
          .filter(([role]) => role !== "Worker") // Exclude Worker role
          .map(([role, count]) => ({
            _id: role,
            count: count,
          })),
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await API.get("/admin/analytics/branches", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBranches(response.data.branchAnalytics || []);
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

  const fetchSalesAnalytics = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(
        `/admin/analytics/sales?period=${timeParam}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setAnalytics((prev) => ({
        ...prev,
        salesData: response.data || [],
      }));
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
    }
  };

  const fetchRevenueAnalytics = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(
        `/admin/analytics/revenue?period=${timeParam}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setAnalytics((prev) => ({
        ...prev,
        monthlyData: response.data.revenueData || [],
        totalRevenue: response.data.totalRevenue || 0,
      }));
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const timeParam = getTimeRangeParam(timeRange);
      const response = await API.get(
        `/admin/analytics/users?period=${timeParam}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setAnalytics((prev) => ({
        ...prev,
        userGrowth: response.data.userAnalytics.userGrowth || [],
      }));
    } catch (error) {
      console.error("Error fetching user analytics:", error);
    }
  };

  // Order management functions for OrderTable
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await API.put(
        `/orders/${orderId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      // Update local orders state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Refresh orders data
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status. Please try again.");
    }
  };

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
      alert("Error creating branch. Please try again.");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await API.put(
          `/announcements/${editingAnnouncement._id}`,
          announcementForm,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        await API.post("/announcements", announcementForm, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      }
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({
        title: "",
        message: "",
        type: "info",
        targetAudience: "all",
        priority: "medium",
        expiresAt: "",
        discountPercentage: "",
        minOrderValue: "",
      });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Error saving announcement. Please try again.");
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      targetAudience: announcement.targetAudience,
      priority: announcement.priority,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : "",
      discountPercentage: announcement.discountPercentage || "",
      minOrderValue: announcement.minOrderValue || "",
    });
    setShowAnnouncementModal(true);
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        await API.delete(`/announcements/${announcementId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchAnnouncements();
      } catch (error) {
        console.error("Error deleting announcement:", error);
        alert("Error deleting announcement. Please try again.");
      }
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await API.put(
        `/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      fetchUsers();
      setShowUserModal(false);
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Error updating user role. Please try again.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await API.delete(`/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user. Please try again.");
      }
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
            value={`₹${analytics.totalRevenue?.toLocaleString() || 0}`}
            change="+12.5%"
            icon="💰"
            color="from-green-500 to-emerald-600"
            trend="up"
          />
          <StatCard
            title="Total Orders"
            value={analytics.totalOrders || 0}
            change="+8.2%"
            icon="📦"
            color="from-blue-500 to-cyan-600"
            trend="up"
          />
          <StatCard
            title="Active Users"
            value={analytics.totalUsers || 0}
            change="+15.3%"
            icon="👥"
            color="from-purple-500 to-pink-600"
            trend="up"
          />
          <StatCard
            title="Products"
            value={analytics.totalProducts || 0}
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
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="totalRevenue"
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
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="newUsers" fill="#8884d8" />
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
                  <LineChart data={analytics.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      stroke="#8884d8"
                      strokeWidth={3}
                    />
                    <Line
                      type="monotone"
                      dataKey="orderCount"
                      stroke="#82ca9d"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
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
                {analytics.usersByRole?.map((roleData, index) => (
                  <div
                    key={roleData._id}
                    className={`bg-gradient-to-r ${
                      COLORS[index % COLORS.length] === "#8884d8"
                        ? "from-blue-500 to-blue-600"
                        : COLORS[index % COLORS.length] === "#82ca9d"
                        ? "from-green-500 to-green-600"
                        : COLORS[index % COLORS.length] === "#ffc658"
                        ? "from-yellow-500 to-yellow-600"
                        : "from-purple-500 to-purple-600"
                    } rounded-xl p-6 text-white`}
                  >
                    <h4 className="text-lg font-semibold">{roleData._id}s</h4>
                    <p className="text-3xl font-bold">{roleData.count}</p>
                  </div>
                ))}
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter((user) => user.role !== "Worker")
                      .map((user) => (
                        <tr
                          key={user._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                        >
                          <td className="py-3 px-4">{user.name}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === "Admin"
                                  ? "bg-red-100 text-red-800"
                                  : user.role === "ShopOwner"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
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
                    Product Statistics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-blue-800">
                        Total Products
                      </span>
                      <span className="font-bold text-blue-600">
                        {analytics.totalProducts || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-800">
                        Categories
                      </span>
                      <span className="font-bold text-green-600">
                        {analytics.categoryAnalysis?.length || 0}
                      </span>
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
                Order Management
              </h3>
              <OrderTable
                orders={orders}
                handleOrderStatusUpdate={handleOrderStatusUpdate}
              />
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
                        👥 {branch.shopOwnersCount || 0} Shop Owners
                      </p>
                      <p className="text-sm text-gray-600">
                        📦 {branch.ordersCount || 0} Orders
                      </p>
                      <p className="text-sm text-gray-600">
                        💰 ₹{branch.revenue?.toLocaleString() || 0} Revenue
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
                    Announcements & Promotions
                  </h3>
                  <p className="text-gray-600">
                    Create and manage platform-wide announcements and discount
                    offers
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementForm({
                      title: "",
                      message: "",
                      type: "info",
                      targetAudience: "all",
                      priority: "medium",
                      expiresAt: "",
                      discountPercentage: "",
                      minOrderValue: "",
                    });
                    setShowAnnouncementModal(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  Create Announcement
                </button>
              </div>

              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative overflow-hidden"
                  >
                    {/* Discount Banner */}
                    {announcement.discountPercentage > 0 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-bl-2xl">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {announcement.discountPercentage}%
                          </div>
                          <div className="text-xs">OFF</div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 pr-16">
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
                                : announcement.type === "promotion"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-red-100 text-red-800"
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

                        {/* Discount Details */}
                        {announcement.discountPercentage > 0 && (
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3 mb-2">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="font-semibold text-orange-800">
                                🎉 Special Offer:{" "}
                                {announcement.discountPercentage}% Discount
                              </span>
                              {announcement.minOrderValue > 0 && (
                                <span className="text-orange-600">
                                  Min Order: ₹{announcement.minOrderValue}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

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
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteAnnouncement(announcement._id)
                          }
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Edit Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                      Edit User
                    </h2>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-500 hover:text-red-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={selectedUser.name}
                        disabled
                        className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={selectedUser.email}
                        disabled
                        className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Role
                      </label>
                      <select
                        value={selectedUser.role}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            role: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Customer">Customer</option>
                        <option value="ShopOwner">Shop Owner</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateUserRole(
                          selectedUser._id,
                          selectedUser.role
                        )
                      }
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Update Role
                    </button>
                  </div>
                </div>
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
                      {editingAnnouncement
                        ? "Edit Announcement"
                        : "Create Announcement"}
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

                    {/* Discount Section */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
                      <h4 className="font-semibold text-orange-800 mb-3">
                        🎯 Discount Settings (Optional)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">
                            Discount Percentage
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={announcementForm.discountPercentage}
                            onChange={(e) =>
                              setAnnouncementForm({
                                ...announcementForm,
                                discountPercentage: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-semibold mb-2">
                            Minimum Order Value
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={announcementForm.minOrderValue}
                            onChange={(e) =>
                              setAnnouncementForm({
                                ...announcementForm,
                                minOrderValue: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
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
                        {editingAnnouncement
                          ? "Update Announcement"
                          : "Create Announcement"}
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
