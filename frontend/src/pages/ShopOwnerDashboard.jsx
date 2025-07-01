"use client";

import { useEffect, useState, useRef } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import QRCodeGenerator from "../components/QRCodeGenerator";
import OrderTable from "../components/OrderTable";

// Backend API URL
const API_URL = "http://localhost:5000/api/products";
const PROMOTIONS_API_URL = "http://localhost:5000/api/promotions";

// Cloudinary config
const CLOUDINARY_UPLOAD_PRESET = "Green_Mart_product_images";
const CLOUDINARY_CLOUD_NAME = "dum3uhmau";

const TABS = [
  { label: "Inventory Management", icon: "📦" },
  { label: "Product Analytics", icon: "📊" },
  { label: "Promotions & Offers", icon: "🎯" },
  { label: "Order Management", icon: "🚚" },
];

const CATEGORY_OPTIONS = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Bakery",
  "Snacks",
  "Beverages",
  "Staples",
  "Household",
  "Personal Care",
  "Others",
];

const UNIT_OPTIONS = [
  "Kg",
  "Grams",
  "Litres",
  "Millilitres",
  "Units",
  "Packets",
  "Pieces",
  "Dozen",
];

const SummaryCard = ({ color, icon, title, value, subtitle, trend }) => (
  <motion.div
    className={`rounded-2xl shadow-lg p-6 flex flex-col ${color} relative overflow-hidden`}
    whileHover={{ scale: 1.05, y: -5 }}
    transition={{ type: "spring", stiffness: 200 }}
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
    <div className="flex items-center space-x-3 mb-3">
      <span className="text-3xl">{icon}</span>
      <span className="font-bold text-lg text-white">{title}</span>
    </div>
    <div className="text-3xl font-bold text-white mb-2">{value}</div>
    <div className="text-sm text-white text-opacity-80 flex items-center">
      {subtitle}
      {trend && (
        <span
          className={`ml-2 px-2 py-1 rounded-full text-xs ${
            trend.type === "up" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {trend.value}
        </span>
      )}
    </div>
  </motion.div>
);

const ShopOwnerDashboard = () => {
  const [tab, setTab] = useState(TABS[0].label);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "",
    price: "",
    discount: "",
    stock: "",
    image: null,
  });

  const [editingId, setEditingId] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedProductForQR, setSelectedProductForQR] = useState(null);
  const csvInput = useRef(null);

  // Promotion form state
  const [promotionForm, setPromotionForm] = useState({
    type: "flash_sale",
    title: "",
    description: "",
    discountPercentage: "",
    startDate: "",
    endDate: "",
    applicableProducts: [],
    minOrderValue: "",
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (message) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        showToastMsg("Please login to view products", "error");
        return;
      }

      console.log("Fetching products with token:", token);

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Products response:", res.data);

      const productsData = res.data.products || res.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error("Error loading products:", err);

      if (err.response?.status === 401) {
        showToastMsg("Session expired. Please login again.", "error");
        localStorage.removeItem("token");
        window.location.href = "/";
      } else {
        showToastMsg(
          "Error loading products: " +
            (err.response?.data?.message || err.message),
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Fetching orders for shop owner...");

      const res = await axios.get(
        "http://localhost:5000/api/orders/shop-owner",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Orders response:", res.data);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Error loading orders:", err);
      // Don't show error toast for orders as it's not critical
      setOrders([]); // Set empty array as fallback
    }
  }

  async function fetchPromotions() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Fetching promotions...");

      const res = await axios.get(PROMOTIONS_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Promotions response:", res.data);
      setPromotions(res.data.promotions || []);
    } catch (err) {
      console.error("Error loading promotions:", err);
      setPromotions([]); // Set empty array as fallback
    }
  }

  async function handleProductSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Starting product submission...");
      console.log("Form data:", form);

      // Validate required fields
      if (!form.name.trim()) {
        showToastMsg("Product name is required", "error");
        return;
      }
      if (!form.category) {
        showToastMsg("Please select a category", "error");
        return;
      }
      if (!form.unit) {
        showToastMsg("Please select a unit", "error");
        return;
      }
      if (!form.price || Number(form.price) <= 0) {
        showToastMsg("Please enter a valid price", "error");
        return;
      }
      if (
        form.stock === "" ||
        isNaN(Number(form.stock)) ||
        Number(form.stock) < 0
      ) {
        showToastMsg("Please enter a valid stock quantity", "error");
        return;
      }

      let imageUrl = "";

      // Handle image upload to Cloudinary if a new image is selected
      if (form.image && form.image instanceof File) {
        try {
          console.log("Uploading image to Cloudinary...");

          const formData = new FormData();
          formData.append("file", form.image);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!cloudinaryResponse.ok) {
            const errorText = await cloudinaryResponse.text();
            console.error("Cloudinary error response:", errorText);
            throw new Error(
              `Cloudinary upload failed: ${cloudinaryResponse.status}`
            );
          }

          const cloudinaryData = await cloudinaryResponse.json();
          imageUrl = cloudinaryData.secure_url;
          console.log("Image uploaded successfully:", imageUrl);
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          showToastMsg(
            "Image upload failed. Continuing without image.",
            "error"
          );
          // Continue without image instead of returning
        }
      } else if (typeof form.image === "string") {
        imageUrl = form.image;
      }

      // Prepare product data
      const productData = {
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        price: Number(form.price),
        discount: form.discount ? Number(form.discount) : 0,
        stock: Number(form.stock),
        imageUrl: imageUrl,
        rating: 4.5, // Default rating
        views: 0, // Default views
      };

      console.log("Sending product data:", productData);

      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        showToastMsg("Authentication required. Please login again.", "error");
        return;
      }

      // Send to backend
      let response;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (editingId) {
        console.log("Updating product with ID:", editingId);
        response = await axios.put(
          `${API_URL}/${editingId}`,
          productData,
          config
        );
        showToastMsg("Product updated successfully!", "success");
      } else {
        console.log("Creating new product");
        response = await axios.post(API_URL, productData, config);
        showToastMsg("Product added successfully!", "success");
      }

      console.log("Backend response:", response.data);

      // Close modal and refresh
      setShowProductModal(false);
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error saving product:", err);

      let errorMessage = "An error occurred while saving the product";

      if (err.response) {
        errorMessage =
          err.response.data?.error ||
          err.response.data?.message ||
          `Server error: ${err.response.status}`;
        console.error("Server error details:", err.response.data);
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
        console.error("Network error:", err.request);
      } else {
        errorMessage = err.message || "Unexpected error occurred";
        console.error("Unexpected error:", err.message);
      }

      showToastMsg(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handlePromotionSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Creating promotion with data:", promotionForm);

      // Validate required fields
      if (!promotionForm.title.trim()) {
        showToastMsg("Promotion title is required", "error");
        return;
      }
      if (
        !promotionForm.discountPercentage ||
        Number(promotionForm.discountPercentage) <= 0
      ) {
        showToastMsg("Please enter a valid discount percentage", "error");
        return;
      }
      if (!promotionForm.startDate) {
        showToastMsg("Start date is required", "error");
        return;
      }
      if (!promotionForm.endDate) {
        showToastMsg("End date is required", "error");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        showToastMsg("Authentication required. Please login again.", "error");
        return;
      }

      const response = await axios.post(PROMOTIONS_API_URL, promotionForm, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Promotion created:", response.data);

      showToastMsg("Promotion created successfully!", "success");
      setShowPromotionModal(false);
      setPromotionForm({
        type: "flash_sale",
        title: "",
        description: "",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        applicableProducts: [],
        minOrderValue: "",
      });
      await fetchPromotions();
    } catch (err) {
      console.error("Error creating promotion:", err);

      let errorMessage = "Error creating promotion";

      if (err.response) {
        errorMessage =
          err.response.data?.message ||
          err.response.data?.error ||
          `Server error: ${err.response.status}`;
        console.error("Server error details:", err.response.data);
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection.";
      } else {
        errorMessage = err.message || "Unexpected error occurred";
      }

      showToastMsg(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      category: "",
      unit: "",
      price: "",
      discount: "",
      stock: "",
      image: null,
    });
    setEditingId(null);
  }

  function handleEditProduct(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit || "",
      price: product.price,
      discount: product.discount || "",
      stock: product.stock || "",
      image: product.imageUrl || null,
    });
    setShowProductModal(true);
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToastMsg("Product deleted successfully!", "success");
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      showToastMsg(
        "Error deleting product: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOrderStatusUpdate(orderId, newStatus) {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToastMsg("Order status updated successfully!", "success");
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      showToastMsg(
        "Error updating order status: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(stock) {
    stock = Number(stock);
    if (stock === 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
          Out of Stock
        </span>
      );
    }
    if (stock < 20) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
        In Stock
      </span>
    );
  }

  function showToastMsg(msg, type = "success") {
    setMessage(msg);
    setMessageType(type);
    setShowToast(true);
  }

  const handleGenerateQR = (product) => {
    setSelectedProductForQR(product);
    setShowQRModal(true);
  };

  // Image component with better error handling
  const ProductImage = ({ src, alt, className }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      setImageSrc(src);
      setIsLoading(true);
      setHasError(false);
    }, [src]);

    const handleImageLoad = () => {
      setIsLoading(false);
      setHasError(false);
    };

    const handleImageError = () => {
      console.log("Image failed to load:", src);
      setIsLoading(false);
      setHasError(true);
      setImageSrc("/placeholder.svg?height=48&width=48");
    };

    if (!src || hasError) {
      return (
        <div
          className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        >
          <span className="text-xs text-gray-500">No Image</span>
        </div>
      );
    }

    return (
      <div className="relative">
        {isLoading && (
          <div
            className={`absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
          </div>
        )}
        <img
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          className={className}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: isLoading ? "none" : "block" }}
        />
      </div>
    );
  };

  // Calculate dashboard metrics
  const totalProducts = products.length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + Number(p.price || 0) * Number(p.stock || 0),
    0
  );
  const stockAlerts = products.filter((p) => Number(p.stock || 0) < 20).length;
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "Pending"
  ).length;
  const completedOrders = orders.filter(
    (o) =>
      o.status?.toLowerCase() === "completed" ||
      o.status?.toLowerCase() === "delivered"
  ).length;

  // Helper function to get dynamic labels based on selected unit
  const getPriceLabel = () => {
    return form.unit ? `Price (₹ per ${form.unit})*` : "Price (₹)*";
  };

  const getStockLabel = () => {
    return form.unit ? `Stock (in ${form.unit})*` : "Stock*";
  };

  const getStockPlaceholder = () => {
    return form.unit ? `Enter quantity in ${form.unit}` : "Enter quantity";
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen p-6 font-sans relative overflow-x-auto">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-center font-semibold text-gray-700">
              Processing...
            </p>
          </div>
        </div>
      )}

      {/* Toast/Alert */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl z-50 ${
              messageType === "success"
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                : messageType === "error"
                ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">
                {messageType === "success"
                  ? "✅"
                  : messageType === "error"
                  ? "❌"
                  : "ℹ️"}
              </span>
              <span className="font-medium">{message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Shop Owner Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your store, products, and promotions
        </p>
      </motion.div>

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          icon="📦"
          title="Total Products"
          value={totalProducts}
          subtitle="Active inventory items"
          trend={{ type: "up", value: "+5%" }}
        />
        <SummaryCard
          color="bg-gradient-to-br from-green-500 to-green-600"
          icon="💰"
          title="Inventory Value"
          value={`₹${inventoryValue.toLocaleString()}`}
          subtitle="Total stock value"
          trend={{ type: "up", value: "+12%" }}
        />
        <SummaryCard
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          icon="⚠️"
          title="Stock Alerts"
          value={stockAlerts}
          subtitle="Low/Out of stock items"
          trend={{ type: "down", value: "-3%" }}
        />
        <SummaryCard
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          icon="🚚"
          title="Total Orders"
          value={totalOrders}
          subtitle="All time orders"
          trend={{ type: "up", value: "+8%" }}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:space-x-6 space-y-4 md:space-y-0 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="font-bold text-lg text-gray-800 mb-2 md:mb-0">
          Quick Actions
        </span>
        <div className="flex flex-wrap gap-3">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={csvInput}
            onChange={() =>
              showToastMsg("Bulk upload feature coming soon!", "info")
            }
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => csvInput.current.click()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
            disabled={loading}
          >
            📊 Bulk Upload
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
            onClick={() =>
              showToastMsg("Bulk price update coming soon!", "info")
            }
            disabled={loading}
          >
            💰 Price Update
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
            onClick={() => setShowPromotionModal(true)}
            disabled={loading}
          >
            🎯 Create Promotion
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <motion.button
            key={t.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all font-semibold ${
              tab === t.label
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
            onClick={() => setTab(t.label)}
            disabled={loading}
          >
            <span className="text-xl">{t.icon}</span>
            <span>{t.label}</span>
          </motion.button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        <AnimatePresence mode="wait">
          {tab === "Inventory Management" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-2xl text-gray-800">
                    Product Inventory
                  </h2>
                  <p className="text-gray-600">
                    Manage your shop's product catalog
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg disabled:opacity-50"
                  onClick={() => {
                    setShowProductModal(true);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  <span className="text-xl">+</span>
                  <span>Add Product</span>
                </motion.button>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
                      <th className="p-4 font-semibold text-gray-700">Image</th>
                      <th className="p-4 font-semibold text-gray-700">
                        Product Name
                      </th>
                      <th className="p-4 font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="p-4 font-semibold text-gray-700">Unit</th>
                      <th className="p-4 font-semibold text-gray-700">Price</th>
                      <th className="p-4 font-semibold text-gray-700">
                        Discount
                      </th>
                      <th className="p-4 font-semibold text-gray-700">Stock</th>
                      <th className="p-4 font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="p-4 font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map((product, index) => (
                        <motion.tr
                          key={product._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-4">
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            />
                          </td>
                          <td className="p-4 font-medium text-gray-800">
                            {product.name}
                          </td>
                          <td className="p-4 text-gray-600">
                            {product.category}
                          </td>
                          <td className="p-4 text-gray-600">{product.unit}</td>
                          <td className="p-4 font-semibold text-green-600">
                            ₹{product.price}
                          </td>
                          <td className="p-4">
                            {product.discount ? (
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                {product.discount}% OFF
                              </span>
                            ) : (
                              <span className="text-gray-400">--</span>
                            )}
                          </td>
                          <td className="p-4 font-medium">{product.stock}</td>
                          <td className="p-4">
                            {getStatusLabel(product.stock)}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg disabled:opacity-50"
                                onClick={() => handleEditProduct(product)}
                                disabled={loading}
                                title="Edit Product"
                              >
                                ✏️
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-green-600 hover:bg-green-50 p-2 rounded-lg disabled:opacity-50"
                                onClick={() => handleGenerateQR(product)}
                                disabled={loading}
                                title="Generate QR Code"
                              >
                                📱
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg disabled:opacity-50"
                                onClick={() => handleDeleteProduct(product._id)}
                                disabled={loading}
                                title="Delete Product"
                              >
                                🗑️
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center p-8 text-gray-500"
                        >
                          {loading
                            ? "Loading products..."
                            : "No products found. Click 'Add Product' to get started!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === "Product Analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="font-bold text-2xl mb-4 text-gray-800">
                Product Performance Analytics
              </h2>
              <p className="text-gray-600 mb-8">
                Track your best-performing products and inventory insights
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <h4 className="font-bold text-lg mb-4 text-blue-800">
                    Top Selling Products
                  </h4>
                  {products.length > 0 ? (
                    [...products]
                      .sort(
                        (a, b) =>
                          (b.rating?.average || 0) - (a.rating?.average || 0)
                      )
                      .slice(0, 5)
                      .map((product, index) => (
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white p-4 rounded-xl flex justify-between items-center mb-3 shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <span className="font-medium text-gray-800">
                                {product.name}
                              </span>
                              <p className="text-sm text-gray-500">
                                {product.stock} in stock
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              ₹{product.price}
                            </p>
                            <p className="text-xs text-gray-500">
                              per {product.unit}
                            </p>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <p className="text-gray-500">No products available</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
                  <h4 className="font-bold text-lg mb-4 text-orange-800">
                    Low Stock Alerts
                  </h4>
                  {products.filter((p) => p.stock < 20).length > 0 ? (
                    products
                      .filter((p) => p.stock < 20)
                      .slice(0, 5)
                      .map((product, index) => (
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white p-4 rounded-xl flex justify-between items-center mb-3 shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              ⚠️
                            </div>
                            <div>
                              <span className="font-medium text-gray-800">
                                {product.name}
                              </span>
                              <p className="text-sm text-orange-600">
                                {product.stock} remaining
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              product.stock === 0
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                          </span>
                        </motion.div>
                      ))
                  ) : (
                    <p className="text-gray-500">
                      All products are well stocked!
                    </p>
                  )}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="mt-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-4 text-purple-800">
                  Category Distribution
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CATEGORY_OPTIONS.map((category) => {
                    const count = products.filter(
                      (p) => p.category === category
                    ).length;
                    return (
                      <div
                        key={category}
                        className="bg-white rounded-xl p-4 text-center shadow-sm"
                      >
                        <div className="text-2xl font-bold text-purple-600">
                          {count}
                        </div>
                        <div className="text-sm text-gray-600">{category}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {tab === "Promotions & Offers" && (
            <motion.div
              key="promotions"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="font-bold text-2xl text-gray-800">
                    Promotions & Offers
                  </h2>
                  <p className="text-gray-600">
                    Create and manage special offers to boost sales
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPromotionModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold px-6 py-3 rounded-xl flex items-center space-x-2 shadow-lg"
                >
                  <span className="text-xl">🎯</span>
                  <span>Create Promotion</span>
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="border-2 border-dashed border-red-300 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-red-500 bg-gradient-to-br from-red-50 to-red-100"
                  onClick={() => {
                    setPromotionForm({ ...promotionForm, type: "flash_sale" });
                    setShowPromotionModal(true);
                  }}
                >
                  <span className="text-4xl mb-4">⚡</span>
                  <span className="font-bold text-lg text-red-700">
                    Flash Sale
                  </span>
                  <span className="text-sm text-red-600 text-center mt-2">
                    Limited time offers with high discounts
                  </span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="border-2 border-dashed border-green-300 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-green-500 bg-gradient-to-br from-green-50 to-green-100"
                  onClick={() => {
                    setPromotionForm({
                      ...promotionForm,
                      type: "bundle_offer",
                    });
                    setShowPromotionModal(true);
                  }}
                >
                  <span className="text-4xl mb-4">📦</span>
                  <span className="font-bold text-lg text-green-700">
                    Bundle Offer
                  </span>
                  <span className="text-sm text-green-600 text-center mt-2">
                    Combine products for better deals
                  </span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="border-2 border-dashed border-yellow-300 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100"
                  onClick={() => {
                    setPromotionForm({
                      ...promotionForm,
                      type: "seasonal_discount",
                    });
                    setShowPromotionModal(true);
                  }}
                >
                  <span className="text-4xl mb-4">🌟</span>
                  <span className="font-bold text-lg text-yellow-700">
                    Seasonal Discount
                  </span>
                  <span className="text-sm text-yellow-600 text-center mt-2">
                    Holiday and seasonal promotions
                  </span>
                </motion.div>
              </div>

              {/* Active Promotions */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                <h4 className="font-bold text-lg mb-4 text-gray-800">
                  Active Promotions
                </h4>
                {promotions.length > 0 ? (
                  <div className="space-y-4">
                    {promotions.map((promotion, index) => (
                      <motion.div
                        key={promotion._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="font-bold text-lg text-gray-800">
                              {promotion.title}
                            </h5>
                            <p className="text-gray-600">
                              {promotion.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {promotion.type.replace("_", " ").toUpperCase()}
                              </span>
                              <span className="text-sm text-green-600 font-semibold">
                                {promotion.discountPercentage}% OFF
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {new Date(
                                promotion.startDate
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(promotion.endDate).toLocaleDateString()}
                            </p>
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Active
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-4 block">🎯</span>
                    <p className="text-gray-500">
                      No active promotions. Create your first promotion to boost
                      sales!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === "Order Management" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6">
                <h2 className="font-bold text-2xl text-gray-800">
                  Order Management
                </h2>
                <p className="text-gray-600">
                  Track and manage customer orders
                </p>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Total Orders</h4>
                  <p className="text-3xl font-bold">{totalOrders}</p>
                  <p className="text-sm opacity-80">All time orders</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Pending Orders</h4>
                  <p className="text-3xl font-bold">{pendingOrders}</p>
                  <p className="text-sm opacity-80">Awaiting processing</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                  <h4 className="text-lg font-semibold">Completed Orders</h4>
                  <p className="text-3xl font-bold">{completedOrders}</p>
                  <p className="text-sm opacity-80">Successfully delivered</p>
                </div>
              </div>

              {/* Orders Table */}
              <OrderTable
                orders={orders}
                handleOrderStatusUpdate={handleOrderStatusUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Add/Edit Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            key="productModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingId ? "Edit Product" : "Add New Product"}
                  </h2>
                  <button
                    className="text-gray-500 hover:text-red-600 text-2xl"
                    onClick={() => setShowProductModal(false)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Product Name*
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      disabled={loading}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Category*
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        value={form.category}
                        onChange={(e) =>
                          setForm({ ...form, category: e.target.value })
                        }
                        disabled={loading}
                      >
                        <option value="">Select Category</option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Unit*
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        value={form.unit}
                        onChange={(e) =>
                          setForm({ ...form, unit: e.target.value })
                        }
                        disabled={loading}
                      >
                        <option value="">Select Unit</option>
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        {getPriceLabel()}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          className="w-full border border-gray-300 rounded-xl p-3 pl-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                          value={form.price}
                          onChange={(e) =>
                            setForm({ ...form, price: e.target.value })
                          }
                          disabled={loading}
                          placeholder="0.00"
                        />
                      </div>
                      {form.unit && (
                        <p className="text-xs text-gray-500 mt-1">
                          Price per {form.unit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={form.discount}
                        onChange={(e) =>
                          setForm({ ...form, discount: e.target.value })
                        }
                        disabled={loading}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        {getStockLabel()}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        value={form.stock}
                        onChange={(e) =>
                          setForm({ ...form, stock: e.target.value })
                        }
                        disabled={loading}
                        placeholder={getStockPlaceholder()}
                      />
                      {form.unit && (
                        <p className="text-xs text-gray-500 mt-1">
                          Quantity in {form.unit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showToastMsg(
                              "Image size should be less than 5MB",
                              "error"
                            );
                            e.target.value = "";
                            return;
                          }
                          if (!file.type.startsWith("image/")) {
                            showToastMsg(
                              "Please select a valid image file",
                              "error"
                            );
                            e.target.value = "";
                            return;
                          }
                          setForm({ ...form, image: file });
                        }
                      }}
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Supported formats: JPG, PNG, GIF (Max size: 5MB)
                    </p>

                    {form.image && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">
                          Image Preview:
                        </p>
                        {typeof form.image === "string" ? (
                          <ProductImage
                            src={form.image}
                            alt="Product Preview"
                            className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                          />
                        ) : form.image instanceof File ? (
                          <div className="flex items-center space-x-4">
                            <img
                              src={
                                // eslint-disable-next-line no-constant-binary-expression
                                URL.createObjectURL(form.image) ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                              onError={(e) => {
                                console.log("File preview failed to load");
                                e.target.src =
                                  "/placeholder.svg?height=128&width=128";
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium">
                                {form.image.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(form.image.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                      onClick={() => setShowProductModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading
                        ? "Processing..."
                        : editingId
                        ? "Update Product"
                        : "Add Product"}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotion Modal */}
      <AnimatePresence>
        {showPromotionModal && (
          <motion.div
            key="promotionModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Create New Promotion
                  </h2>
                  <button
                    className="text-gray-500 hover:text-red-600 text-2xl"
                    onClick={() => setShowPromotionModal(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handlePromotionSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Promotion Type*
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      value={promotionForm.type}
                      onChange={(e) =>
                        setPromotionForm({
                          ...promotionForm,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="flash_sale">Flash Sale</option>
                      <option value="bundle_offer">Bundle Offer</option>
                      <option value="seasonal_discount">
                        Seasonal Discount
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Title*
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                      value={promotionForm.title}
                      onChange={(e) =>
                        setPromotionForm({
                          ...promotionForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter promotion title"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      value={promotionForm.description}
                      onChange={(e) =>
                        setPromotionForm({
                          ...promotionForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your promotion"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Discount Percentage*
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        value={promotionForm.discountPercentage}
                        onChange={(e) =>
                          setPromotionForm({
                            ...promotionForm,
                            discountPercentage: e.target.value,
                          })
                        }
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
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        value={promotionForm.minOrderValue}
                        onChange={(e) =>
                          setPromotionForm({
                            ...promotionForm,
                            minOrderValue: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Start Date*
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        value={promotionForm.startDate}
                        onChange={(e) =>
                          setPromotionForm({
                            ...promotionForm,
                            startDate: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        End Date*
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                        value={promotionForm.endDate}
                        onChange={(e) =>
                          setPromotionForm({
                            ...promotionForm,
                            endDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold"
                      onClick={() => setShowPromotionModal(false)}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? "Creating..." : "Create Promotion"}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && selectedProductForQR && (
          <motion.div
            key="qrModal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40 flex justify-center items-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    Product QR Code
                  </h2>
                  <button
                    className="text-gray-500 hover:text-red-600 text-2xl"
                    onClick={() => setShowQRModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="text-center mb-6">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {selectedProductForQR.name}
                  </h3>
                  <p className="text-gray-600">
                    ₹{selectedProductForQR.price} per{" "}
                    {selectedProductForQR.unit}
                  </p>
                </div>

                <div className="flex justify-center mb-6">
                  <QRCodeGenerator
                    data={JSON.stringify({
                      productId: selectedProductForQR._id,
                      name: selectedProductForQR.name,
                      price: selectedProductForQR.price,
                      discount: selectedProductForQR.discount,
                      type: "PRODUCT_INFO",
                    })}
                    size={200}
                  />
                </div>

                <p className="text-sm text-gray-500 text-center mb-6">
                  Customers can scan this QR code to view product details and
                  add to cart
                </p>

                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowQRModal(false)}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopOwnerDashboard;
