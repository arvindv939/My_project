import React, { useEffect, useState } from "react";
import API from "../services/api";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
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
} from "recharts";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F",
  "#FFBB28",
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
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get("/admin/financials", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
        alert("Error fetching analytics data");
      }
    };

    fetchAnalytics();

    // Auto-refresh every 1 minute
    const interval = setInterval(fetchAnalytics, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Admin Dashboard
      </h1>

      {/* Revenue & performance cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-green-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-2xl text-green-600 font-bold">
            ₹{analytics.revenue.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-blue-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Profit</h3>
          <p className="text-2xl text-blue-600 font-bold">
            ₹{analytics.profit.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-red-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Loss</h3>
          <p className="text-2xl text-red-600 font-bold">
            ₹{analytics.loss.toLocaleString()}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-purple-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Orders</h3>
          <p className="text-2xl text-purple-600 font-bold">
            {analytics.orders}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-pink-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Products</h3>
          <p className="text-2xl text-pink-600 font-bold">
            {analytics.products}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-yellow-100 p-4 rounded shadow"
        >
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p className="text-2xl text-yellow-600 font-bold">
            {analytics.users}
          </p>
        </motion.div>
      </div>

      {/* Line chart */}
      <h2 className="text-xl font-bold mb-2">Revenue & Profit Overview</h2>
      <LineChart width={800} height={300} data={analytics.chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
        <Line type="monotone" dataKey="profit" stroke="#82ca9d" />
        <Line type="monotone" dataKey="loss" stroke="#ff7300" />
      </LineChart>

      {/* Category analysis pie chart */}
      <h2 className="text-xl font-bold mt-8 mb-2">Category Analysis</h2>
      <PieChart width={400} height={300}>
        <Pie
          data={analytics.categoryAnalysis}
          dataKey="count"
          nameKey="_id"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {analytics.categoryAnalysis.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}

export default AdminDashboard;
