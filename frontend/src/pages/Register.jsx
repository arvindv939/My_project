import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "ShopOwner",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // for feedback

  // Handle field changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(""); // Clear any message on change
  };

  // Validation function
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.email.trim() &&
      formData.password.trim() &&
      formData.role.trim()
    );
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setMessage("Please fill all the fields!");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // eslint-disable-next-line no-unused-vars
      const res = await API.post("/auth/register", formData);
      setMessage("Registration successful! Redirecting to sign in...");
      setTimeout(() => {
        navigate("/");
      }, 1800);
    } catch (err) {
      // Backend should send a message on duplicate user or validation fail
      if (err.response && err.response.data && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage("An unexpected error occurred.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            A
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-1">
          Create Account
        </h2>
        <p className="text-center text-gray-500 mb-4">Join us today</p>
        {/* Message box */}
        {message && (
          <div
            className={`mb-4 text-center p-2 rounded ${
              message.toLowerCase().includes("success")
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-gray-600">Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            onChange={handleChange}
            value={formData.name}
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <label className="block mb-2 text-gray-600">Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            onChange={handleChange}
            value={formData.email}
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <label className="block mb-2 text-gray-600">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create a strong password"
            onChange={handleChange}
            value={formData.password}
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <label className="block mb-2 text-gray-600">Account Type</label>
          <select
            name="role"
            onChange={handleChange}
            value={formData.role}
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="Admin">Administrator</option>
            <option value="ShopOwner">Shop Owner</option>
          </select>
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`w-full py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded hover:from-pink-600 hover:to-purple-600 transition duration-300 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <a href="/" className="text-purple-600 hover:underline">
            Sign In
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
