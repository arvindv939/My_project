"use client";

import { useState } from "react";

const OrderTable = ({ orders }) => {
  // ← Removed handleOrderStatusUpdate
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const calculateOrderTotal = (order) => {
    if (order.totalAmount && order.totalAmount > 0) {
      return order.totalAmount;
    }
    if (order.items && order.items.length > 0) {
      let total = 0;
      order.items.forEach((item) => {
        const price = item.productId?.price || item.price || 0;
        const quantity = item.quantity || 0;
        total += price * quantity;
      });
      return total;
    }
    return 0;
  };

  const formatCurrency = (amount) => {
    if (amount === 0) return "Calculating...";
    return `₹${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
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
              Items
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Total
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Status
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Payment
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Wait Time
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Date
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order._id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
            >
              <td className="py-3 px-4">
                <span className="font-mono text-sm">
                  #{order._id?.slice(-6) || "N/A"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div>
                  <p className="font-medium">
                    {order.customerId?.name || order.customer?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.customerId?.email || order.customer?.email || ""}
                  </p>
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <span className="font-medium">
                    × {order.items?.length || 0}
                  </span>
                  <p className="text-sm text-gray-500">
                    Total: {order.items?.length || 0} items
                  </p>
                  {order.items && order.items.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index}>
                          {item.productId?.name || item.name || "Unknown"} (₹
                          {item.productId?.price || item.price || 0} each)
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div>+{order.items.length - 2} more...</div>
                      )}
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-bold text-lg">
                  {formatCurrency(calculateOrderTotal(order))}
                </span>
              </td>
              <td className="py-3 px-4">
                {/* Show as pill, no select/dropdown */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status || "Pending"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                      order.paymentStatus
                    )}`}
                  >
                    {(order.paymentStatus || "Pending").toUpperCase()}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.paymentMethod
                      ? `via ${order.paymentMethod.toUpperCase()}`
                      : ""}
                  </p>
                </div>
              </td>

              <td className="py-3 px-4">
                <span className="text-sm text-gray-600">Completed</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600">
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewOrder(order)}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded text-sm"
                  >
                    View
                  </button>
                  <button className="text-gray-600 hover:bg-gray-50 p-1 rounded text-sm">
                    ⋮
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Order Details
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-red-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Order Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order ID:</span>
                        <span className="font-mono">
                          #{selectedOrder._id?.slice(-6) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            selectedOrder.status
                          )}`}
                        >
                          {selectedOrder.status || "Pending"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-lg">
                          {formatCurrency(calculateOrderTotal(selectedOrder))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            selectedOrder.paymentStatus
                          )}`}
                        >
                          {(
                            selectedOrder.paymentStatus || "Pending"
                          ).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span>
                          {selectedOrder.createdAt
                            ? new Date(
                                selectedOrder.createdAt
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Show confirmation time if order is confirmed and has statusHistory */}
                  {selectedOrder.status === "confirmed" &&
                    selectedOrder.statusHistory && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Confirmed At:</span>
                        <span>
                          {(
                            selectedOrder.statusHistory.find(
                              (s) => s.status === "confirmed"
                            ) || {}
                          ).timestamp
                            ? new Date(
                                selectedOrder.statusHistory.find(
                                  (s) => s.status === "confirmed"
                                ).timestamp
                              ).toLocaleString()
                            : "N/A"}
                        </span>
                      </div>
                    )}

                  {/* Customer Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span>
                          {selectedOrder.customerId?.name ||
                            selectedOrder.customer?.name ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span>
                          {selectedOrder.customerId?.email ||
                            selectedOrder.customer?.email ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span>
                          {selectedOrder.customerId?.phone ||
                            selectedOrder.customer?.phone ||
                            "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {item.productId?.name ||
                                item.name ||
                                "Unknown Product"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              ₹{item.productId?.price || item.price || 0} ×{" "}
                              {item.quantity || 0}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">
                              ₹
                              {(
                                (item.productId?.price || item.price || 0) *
                                (item.quantity || 0)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No items found</p>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(calculateOrderTotal(selectedOrder))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 px-6 py-3 rounded-xl font-semibold"
                >
                  Close
                </button>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
