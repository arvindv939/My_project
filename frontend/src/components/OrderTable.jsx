// OrderTable.jsx with checkbox popup for order actions + status dropdown (Updated total and unit display)

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-yellow-100 text-yellow-800",
  ready: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const OrderTable = ({ orders, handleOrderStatusUpdate }) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    const formattedStatus = newStatus.toLowerCase();
    setStatusMap((prev) => ({ ...prev, [orderId]: formattedStatus }));
    await handleOrderStatusUpdate(orderId, formattedStatus);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full table-auto">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
          <tr>
            <th className="p-4 font-semibold text-gray-700">Order ID</th>
            <th className="p-4 font-semibold text-gray-700">Customer</th>
            <th className="p-4 font-semibold text-gray-700">Items</th>
            <th className="p-4 font-semibold text-gray-700">Total</th>
            <th className="p-4 font-semibold text-gray-700">Status</th>
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
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                              View Details
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                              Contact Customer
                            </li>
                            <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-600">
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
              <td colSpan={7} className="text-center p-8 text-gray-500">
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
