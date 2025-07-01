"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Search,
  Filter,
  QrCode,
  User,
  Clock,
  Star,
  Plus,
  Minus,
  X,
} from "lucide-react";
import API from "../services/api";
import React from "react";


const CATEGORIES = [
  "All",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Bakery",
  "Snacks",
  "Beverages",
  "Staples",
  "Household",
  "Personal Care",
];

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState("browse");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    loadCartFromStorage();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await API.get("/products/public");
      setProducts(response.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      showMessage("Error loading products", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await API.get("/orders/customer");
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem("greenmart_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCartToStorage = (cartData) => {
    localStorage.setItem("greenmart_cart", JSON.stringify(cartData));
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item._id === product._id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((item) =>
        item._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    setCart(newCart);
    saveCartToStorage(newCart);
    showMessage(`${product.name} added to cart!`, "success");
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map((item) =>
      item._id === productId ? { ...item, quantity: newQuantity } : item
    );

    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item._id !== productId);
    setCart(newCart);
    saveCartToStorage(newCart);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price =
        item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      showMessage("Your cart is empty!", "error");
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        products: cart.map((item) => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
        })),
        totalPrice: getCartTotal(),
        orderType: "online",
      };

      const response = await API.post("/orders", orderData);

      if (response.data.success) {
        showMessage(
          "Order placed successfully! Check your orders for pickup token.",
          "success"
        );
        setCart([]);
        saveCartToStorage([]);
        setShowCart(false);
        fetchOrders();
        setActiveTab("orders");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      showMessage("Failed to place order. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.stock > 0;
  });

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("greenmart_cart");
    window.location.href = "/";
  };

  const ProductCard = ({ product }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
    >
      <div className="relative">
        <img
          src={
            product.imageUrl ||
            "/placeholder.svg?height=200&width=200&query=grocery+product"
          }
          alt={product.name}
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = "/placeholder.svg?height=200&width=200";
          }}
        />
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            {product.discount}% OFF
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center bg-white rounded-full px-2 py-1">
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
          <span className="text-xs ml-1">{product.rating || 4.5}</span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-2">{product.category}</p>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {product.discount > 0 ? (
              <>
                <span className="text-lg font-bold text-green-600">
                  ₹{(product.price * (1 - product.discount / 100)).toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.price}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ₹{product.price}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">per {product.unit}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Stock: {product.stock} {product.unit}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );

  const CartItem = ({ item }) => (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-200">
      <img
        src={
          item.imageUrl ||
          "/placeholder.svg?height=60&width=60&query=grocery+product"
        }
        alt={item.name}
        className="w-12 h-12 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <p className="text-sm text-gray-500">
          ₹
          {item.discount > 0
            ? (item.price * (1 - item.discount / 100)).toFixed(2)
            : item.price}{" "}
          per {item.unit}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateCartQuantity(item._id, item.quantity - 1)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => updateCartQuantity(item._id, item.quantity + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <button
        onClick={() => removeFromCart(item._id)}
        className="text-red-500 hover:text-red-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            Order #{order._id?.slice(-6)}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.status === "Completed"
                ? "bg-green-100 text-green-800"
                : order.status === "Processing"
                ? "bg-blue-100 text-blue-800"
                : order.status === "Ready"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {order.products?.slice(0, 2).map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>
              {item.product?.name || "Product"} x{item.quantity}
            </span>
            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        {order.products?.length > 2 && (
          <p className="text-sm text-gray-500">
            +{order.products.length - 2} more items
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="font-semibold">
          Total: ₹{order.totalPrice?.toFixed(2)}
        </span>
        {order.pickupToken && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Pickup Token</p>
            <p className="font-mono font-bold text-green-600">
              {order.pickupToken}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Green Mart</h1>
                <p className="text-sm text-gray-500">Fresh & Convenient</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowQRScanner(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <QrCode className="w-6 h-6" />
              </button>

              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <User className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "browse", label: "Browse Products", icon: Search },
              { id: "orders", label: "My Orders", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Toast Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
              messageType === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "browse" && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Search and Filter */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                        selectedCategory === category
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}

              {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No products found matching your criteria.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                My Orders
              </h2>

              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order._id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No orders yet. Start shopping to see your orders here!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Shopping Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Shopping Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {cart.length > 0 ? (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <CartItem key={item._id} item={item} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Your cart is empty</p>
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>₹{getCartTotal().toFixed(2)}</span>
                    </div>
                    <button
                      onClick={placeOrder}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      {loading ? "Placing Order..." : "Place Order"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowQRScanner(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <QrCode className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">QR Code Scanner</h3>
                <p className="text-gray-600 mb-4">
                  Scan QR codes in-store to quickly browse and add products to
                  your cart.
                </p>
                <div className="bg-gray-100 rounded-lg p-8 mb-4">
                  <p className="text-sm text-gray-500">
                    QR Scanner will be activated here
                  </p>
                </div>
                <button
                  onClick={() => setShowQRScanner(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerDashboard;
