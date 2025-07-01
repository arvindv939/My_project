"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState(""); // For feedback
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/auth/login", formData);

      // Save JWT token to localStorage
      localStorage.setItem("token", res.data.token);

      // Determine user role and redirect
      const role = res.data.user.role;
      if (role === "Admin") {
        navigate("/admin-dashboard");
      } else if (role === "ShopOwner") {
        navigate("/shop-owner-dashboard");
      } else if (role === "Customer") {
        navigate("/customer-dashboard");
      } else {
        setMessage("Invalid role, contact administrator.");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage("Invalid credentials");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            A
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-1">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-4">
          Sign in to your account
        </p>
        {/* Feedback Message */}
        {message && (
          <div className="mb-4 text-center p-2 rounded bg-red-100 text-red-700">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-gray-600">Email Address</label>
          <div className="relative mb-4">
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
              autoComplete="username"
            />
          </div>
          <label className="block mb-2 text-gray-600">Password</label>
          <div className="relative mb-4">
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-between text-sm mb-4">
            <a href="#" className="text-purple-600 hover:underline">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Don’t have an account?{" "}
          <a href="/register" className="text-purple-600 hover:underline">
            Create Account
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
