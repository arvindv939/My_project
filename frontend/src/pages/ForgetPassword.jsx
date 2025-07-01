import React, { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await API.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      // Optional: Redirect to login after a short delay
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setMessage(err.response.data.error);
      } else {
        setMessage("Error sending reset link.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-100 to-pink-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-purple-700 mb-1">
          Forgot Password
        </h2>
        <p className="text-center text-gray-500 mb-4">
          Enter your email to receive a password reset link.
        </p>
        {message && (
          <div className="mb-4 text-center p-2 rounded bg-red-100 text-red-700">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="w-full px-4 py-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded hover:from-purple-600 hover:to-pink-600 transition duration-300"
          >
            Send Reset Link
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
