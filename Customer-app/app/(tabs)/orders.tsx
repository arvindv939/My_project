"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { Package, Clock, CheckCircle, XCircle, Truck, MapPin } from "lucide-react-native"
import { orderService, type Order } from "@/services/orderService"
import { useAuth } from "@/contexts/AuthContext"
import { formatIndianCurrency } from "@/utils/currency"

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock size={20} color="#F59E0B" />
    case "confirmed":
      return <CheckCircle size={20} color="#10B981" />
    case "preparing":
      return <Package size={20} color="#3B82F6" />
    case "out_for_delivery":
      return <Truck size={20} color="#8B5CF6" />
    case "delivered":
      return <CheckCircle size={20} color="#10B981" />
    case "cancelled":
      return <XCircle size={20} color="#EF4444" />
    default:
      return <Clock size={20} color="#6B7280" />
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "#F59E0B"
    case "confirmed":
      return "#10B981"
    case "preparing":
      return "#3B82F6"
    case "out_for_delivery":
      return "#8B5CF6"
    case "delivered":
      return "#10B981"
    case "cancelled":
      return "#EF4444"
    default:
      return "#6B7280"
  }
}

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function OrdersScreen() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const fetchedOrders = await orderService.getUserOrders()
      setOrders(fetchedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      Alert.alert("Error", "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchOrders()
    setRefreshing(false)
  }

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            await orderService.cancelOrder(orderId)
            fetchOrders()
            Alert.alert("Success", "Order cancelled successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to cancel order")
          }
        },
      },
    ])
  }

  const handleTrackOrder = (orderId: string) => {
    // Navigate to order tracking screen
    Alert.alert("Track Order", `Tracking order ${orderId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status.toLowerCase()))

  const completedOrders = orders.filter((order) => ["delivered", "cancelled"].includes(order.status.toLowerCase()))

  const displayOrders = activeTab === "active" ? activeOrders : completedOrders

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track your orders and delivery status</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text style={[styles.tabText, activeTab === "completed" && styles.activeTabText]}>
            Completed ({completedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{activeTab === "active" ? "No active orders" : "No completed orders"}</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "active" ? "Your active orders will appear here" : "Your order history will appear here"}
            </Text>
          </View>
        ) : (
          displayOrders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              {/* Order Header */}
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>Order #{order._id.slice(-8)}</Text>
                  <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                  {getStatusIcon(order.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                    {formatStatus(order.status)}
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.orderItems}>
                <Text style={styles.itemsTitle}>
                  {order.items?.length || order.products?.length || 0} item
                  {(order.items?.length || order.products?.length || 0) > 1 ? "s" : ""}
                </Text>
                {(order.items || order.products || []).slice(0, 2).map((item: any, index: number) => (
                  <View key={index} style={styles.orderItem}>
                    <Text style={styles.itemName}>{item.name || `Product ${index + 1}`}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity}x {formatIndianCurrency(item.price)}
                    </Text>
                  </View>
                ))}
                {(order.items?.length || order.products?.length || 0) > 2 && (
                  <Text style={styles.moreItems}>
                    +{(order.items?.length || order.products?.length || 0) - 2} more item
                    {(order.items?.length || order.products?.length || 0) - 2 > 1 ? "s" : ""}
                  </Text>
                )}
              </View>

              {/* Delivery Info */}
              {order.deliveryAddress && (
                <View style={styles.deliveryInfo}>
                  <MapPin size={16} color="#6B7280" />
                  <Text style={styles.deliveryAddress} numberOfLines={1}>
                    {order.deliveryAddress}
                  </Text>
                </View>
              )}

              {/* Order Footer */}
              <View style={styles.orderFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>{formatIndianCurrency(order.totalAmount || order.total || 0)}</Text>
                </View>

                <View style={styles.orderActions}>
                  {activeTab === "active" && order.status.toLowerCase() === "pending" && (
                    <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancelOrder(order._id)}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === "active" && (
                    <TouchableOpacity style={styles.trackButton} onPress={() => handleTrackOrder(order._id)}>
                      <Text style={styles.trackButtonText}>Track</Text>
                    </TouchableOpacity>
                  )}

                  {activeTab === "completed" && (
                    <TouchableOpacity style={styles.reorderButton}>
                      <Text style={styles.reorderButtonText}>Reorder</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#8B5CF6",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#ffffff",
  },
  ordersContainer: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
  },
  itemDetails: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  moreItems: {
    fontSize: 12,
    color: "#8B5CF6",
    marginTop: 4,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  deliveryAddress: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  orderActions: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  trackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  reorderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#10B981",
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
})
