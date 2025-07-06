"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Timing calculation function
const calculateWaitTime = (itemCount) => {
  if (itemCount < 5) return 5;
  if (itemCount >= 5 && itemCount <= 15) return 10;
  if (itemCount > 15 && itemCount < 20) return 15;
  return 20;
};

// Order timing management
class OrderTimingManager {
  constructor() {
    this.orderQueue = [];
    this.timers = new Map();
  }

  addOrder(orderId, itemCount) {
    const baseWaitTime = calculateWaitTime(itemCount);
    const currentTime = new Date();

    // Calculate cumulative wait time
    let cumulativeWaitTime = 0;
    this.orderQueue.forEach((order) => {
      if (order.status === "pending" || order.status === "preparing") {
        const remainingTime = Math.max(
          0,
          (order.estimatedCompletion.getTime() - currentTime.getTime()) /
            (1000 * 60)
        );
        cumulativeWaitTime += remainingTime;
      }
    });

    const actualWaitTime = baseWaitTime + cumulativeWaitTime;
    const estimatedCompletion = new Date(
      currentTime.getTime() + actualWaitTime * 60 * 1000
    );

    const orderTiming = {
      orderId,
      itemCount,
      baseWaitTime,
      actualWaitTime,
      startTime: currentTime,
      estimatedCompletion,
      status: "pending",
    };

    this.orderQueue.push(orderTiming);
    return orderTiming;
  }

  updateOrderStatus(orderId, status) {
    const orderIndex = this.orderQueue.findIndex(
      (order) => order.orderId === orderId
    );
    if (orderIndex !== -1) {
      this.orderQueue[orderIndex].status = status;
      if (status === "delivered" || status === "cancelled") {
        this.orderQueue.splice(orderIndex, 1);
        this.recalculateTimings();
      }
    }
  }

  recalculateTimings() {
    const currentTime = new Date();
    let cumulativeTime = 0;

    this.orderQueue.forEach((order) => {
      if (order.status === "pending") {
        const newEstimatedTime = new Date(
          currentTime.getTime() +
            (order.baseWaitTime + cumulativeTime) * 60 * 1000
        );
        order.estimatedCompletion = newEstimatedTime;
        order.actualWaitTime = order.baseWaitTime + cumulativeTime;
        cumulativeTime += order.baseWaitTime;
      }
    });
  }

  getRemainingTime(orderId) {
    const order = this.orderQueue.find((o) => o.orderId === orderId);
    if (!order) return 0;

    const currentTime = new Date();
    const remainingMs =
      order.estimatedCompletion.getTime() - currentTime.getTime();
    return Math.max(0, Math.ceil(remainingMs / (1000 * 60)));
  }

  formatTime(minutes) {
    if (minutes <= 0) return "Ready!";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}

// Global timing manager instance
const timingManager = new OrderTimingManager();

const LiveTimer = ({ orderId, onTimeUpdate }) => {
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const time = timingManager.getRemainingTime(orderId);
      setRemainingTime(time);
      if (onTimeUpdate) onTimeUpdate(time);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [orderId, onTimeUpdate]);

  const formatTime = (minutes) => {
    if (minutes <= 0) return "Ready!";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div
      className={`text-sm font-semibold ${
        remainingTime <= 0 ? "text-green-600" : "text-orange-600"
      }`}
    >
      {formatTime(remainingTime)}
    </div>
  );
};

const OrderTable = ({ orders, handleOrderStatusUpdate }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [orderTimings, setOrderTimings] = useState(new Map());
  const [showOrderDetails, setShowOrderDetails] = useState(null);

  // Auto-refresh orders every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update timers and status
      setStatusMap((prev) => ({ ...prev }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Initialize order timings when orders are loaded
  useEffect(() => {
    orders.forEach((order) => {
      if (!orderTimings.has(order._id)) {
        const itemCount =
          order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const timing = timingManager.addOrder(order._id, itemCount);
        setOrderTimings((prev) => new Map(prev.set(order._id, timing)));
      }
    });
  }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;

    const formattedStatus = newStatus.toLowerCase();
    setStatusMap((prev) => ({ ...prev, [orderId]: formattedStatus }));

    // Update timing manager
    timingManager.updateOrderStatus(orderId, formattedStatus);

    await handleOrderStatusUpdate(orderId, formattedStatus);
  };

  const handleViewDetails = (order) => {
    setShowOrderDetails(order);
    setSelectedOrderId(null);
  };

  const handleContactCustomer = (order) => {
    const customerPhone = order.customerId?.phone || "N/A";
    const customerEmail = order.customerId?.email || "N/A";
    const customerName = order.customerId?.name || "Customer";

    alert(
      `Contact Information for ${customerName}:\n\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n\nOrder ID: #${order._id.slice(
        -6
      )}`
    );
    setSelectedOrderId(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full table-auto">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
            <tr>
              <th className="p-4 font-semibold text-gray-700">Order ID</th>
              <th className="p-4 font-semibold text-gray-700">Customer</th>
              <th className="p-4 font-semibold text-gray-700">Items</th>
              <th className="p-4 font-semibold text-gray-700">Total</th>
              <th className="p-4 font-semibold text-gray-700">Status</th>
              <th className="p-4 font-semibold text-gray-700">Payment</th>
              <th className="p-4 font-semibold text-gray-700">Wait Time</th>
              <th className="p-4 font-semibold text-gray-700">Date</th>
              <th className="p-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, i) => {
                const currentStatus = (
                  statusMap[order._id] ||
                  order.status ||
                  ""
                ).toLowerCase();
                const totalAmount = order.items?.reduce((sum, item) => {
                  return sum + (item.productId?.price || 0) * item.quantity;
                }, 0);
                const itemCount =
                  order.items?.reduce((sum, item) => sum + item.quantity, 0) ||
                  0;

                return (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4">#{order._id.slice(-6)}</td>
                    <td className="p-4">{order.customerId?.name || "N/A"}</td>
                    <td className="p-4">
                      <ul className="space-y-1">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="text-sm">
                            {item.productId?.name} × {item.quantity}{" "}
                            {item.productId?.unit || ""}
                          </li>
                        ))}
                      </ul>
                      <div className="text-xs text-gray-500 mt-1">
                        Total: {itemCount} items
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-green-600">
                      ₹{totalAmount || 0}
                    </td>
                    <td className="p-4">
                      <select
                        value={currentStatus}
                        onChange={(e) =>
                          handleStatusChange(order._id, e.target.value)
                        }
                        className={`text-sm px-3 py-1 rounded-full font-semibold focus:outline-none ${
                          STATUS_COLORS[currentStatus] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            (order.paymentStatus || "pending") === "paid"
                              ? "bg-green-100 text-green-700"
                              : (order.paymentStatus || "pending") === "failed"
                              ? "bg-red-100 text-red-700"
                              : (order.paymentStatus || "pending") ===
                                "refunded"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {(order.paymentStatus || "pending").toUpperCase()}
                        </span>
                        {order.paymentMethod && (
                          <span className="text-xs text-gray-500">
                            via {order.paymentMethod.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {currentStatus === "pending" ||
                      currentStatus === "preparing" ||
                      currentStatus === "confirmed" ? (
                        <div className="flex flex-col">
                          <LiveTimer
                            orderId={order._id}
                            onTimeUpdate={(time) => {
                              // Optional: Handle time updates
                            }}
                          />
                          <div className="text-xs text-gray-500">
                            Base: {calculateWaitTime(itemCount)}min
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          {currentStatus === "ready"
                            ? "Ready!"
                            : currentStatus === "delivered"
                            ? "Completed"
                            : currentStatus === "cancelled"
                            ? "Cancelled"
                            : "-"}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-center relative">
                      <button
                        className="text-gray-600 hover:text-black"
                        onClick={() =>
                          setSelectedOrderId(
                            selectedOrderId === order._id ? null : order._id
                          )
                        }
                      >
                        ⋮
                      </button>
                      <AnimatePresence>
                        {selectedOrderId === order._id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 bg-white border rounded-md shadow-md z-10 w-40"
                          >
                            <ul className="text-left text-sm">
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleViewDetails(order)}
                              >
                                View Details
                              </li>
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleContactCustomer(order)}
                              >
                                Contact Customer
                              </li>
                              <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
                                onClick={() =>
                                  handleStatusChange(order._id, "cancelled")
                                }
                              >
                                Cancel Order
                              </li>
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center p-8 text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
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
                    Order Details
                  </h2>
                  <button
                    className="text-gray-500 hover:text-red-600 text-2xl"
                    onClick={() => setShowOrderDetails(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-lg mb-3">
                      Order Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-semibold">
                          #{showOrderDetails._id.slice(-6)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Date</p>
                        <p className="font-semibold">
                          {new Date(
                            showOrderDetails.createdAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            STATUS_COLORS[
                              showOrderDetails.status?.toLowerCase()
                            ] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {showOrderDetails.status?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (showOrderDetails.paymentStatus || "pending") ===
                            "paid"
                              ? "bg-green-100 text-green-700"
                              : (showOrderDetails.paymentStatus ||
                                  "pending") === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {(
                            showOrderDetails.paymentStatus || "pending"
                          ).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h3 className="font-semibold text-lg mb-3">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-semibold">
                          {showOrderDetails.customerId?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">
                          {showOrderDetails.customerId?.phone || "N/A"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">
                          {showOrderDetails.customerId?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h3 className="font-semibold text-lg mb-3">Order Items</h3>
                    <div className="space-y-3">
                      {showOrderDetails.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-white p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {item.productId?.name || "Unknown Product"}
                            </p>
                            <p className="text-sm text-gray-600">
                              ₹{item.productId?.price || 0} per{" "}
                              {item.productId?.unit || "unit"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-green-600 font-bold">
                              ₹{(item.productId?.price || 0) * item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">
                          Total Amount:
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          ₹
                          {showOrderDetails.items?.reduce(
                            (sum, item) =>
                              sum +
                              (item.productId?.price || 0) * item.quantity,
                            0
                          ) || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowOrderDetails(null)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default OrderTable;
