"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { ShoppingBag, Leaf, CreditCard, Truck } from "lucide-react-native"
import { CartItem } from "@/components/CartItem"
import { useCart } from "@/contexts/CartContext"
import { useAuth } from "@/contexts/AuthContext"
import { orderService } from "@/services/orderService"
import { formatIndianCurrency } from "@/utils/currency"

export default function CartScreen() {
  const { items, getTotalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const totalPrice = getTotalPrice()
  const deliveryFee = totalPrice > 500 ? 0 : 40
  const finalTotal = totalPrice + deliveryFee

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Please add items to your cart before checkout.")
      return
    }

    if (!user) {
      Alert.alert("Authentication Required", "Please login to place an order.")
      return
    }

    try {
      // Prepare order data
      const orderData = {
        products: items.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        orderType: "pickup" as const,
        paymentMethod: "cash" as const,
        notes: "Order placed from mobile app",
      }

      console.log("Placing order with data:", orderData)

      // Create the order
      const order = await orderService.createOrder(orderData)

      console.log("Order created successfully:", order)

      // Clear cart and show success
      clearCart()

      Alert.alert(
        "Order Placed Successfully!",
        `Your order #${order._id.slice(-6)} has been placed. You will receive a pickup notification shortly.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to orders screen or show order details
              console.log("Order placed, navigating to orders...")
            },
          },
        ],
      )
    } catch (error) {
      console.error("Error placing order:", error)

      let errorMessage = "Failed to place order. Please try again."

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String(error.message)
      }

      Alert.alert("Order Failed", errorMessage)
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shopping Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add some eco-friendly products to get started!</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        <Text style={styles.itemCount}>{items.length} items</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsList}>
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </View>

        {/* Eco Options */}
        <View style={styles.ecoOptions}>
          <View style={styles.ecoHeader}>
            <Leaf size={20} color="#16A34A" />
            <Text style={styles.ecoTitle}>Eco-Friendly Options</Text>
          </View>
          <View style={styles.ecoOption}>
            <View style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.ecoOptionText}>Use reusable packaging (Save ₹5)</Text>
          </View>
          <View style={styles.ecoOption}>
            <View style={styles.checkbox}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
            <Text style={styles.ecoOptionText}>Carbon-neutral delivery</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatIndianCurrency(totalPrice)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeDelivery]}>
              {deliveryFee === 0 ? "FREE" : formatIndianCurrency(deliveryFee)}
            </Text>
          </View>

          {deliveryFee === 0 && <Text style={styles.freeDeliveryNote}>🎉 Free delivery on orders above ₹500!</Text>}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatIndianCurrency(finalTotal)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutInfo}>
          <View style={styles.deliveryInfo}>
            <Truck size={16} color="#16A34A" />
            <Text style={styles.deliveryText}>Ready for pickup in 2-3 hours</Text>
          </View>
          <View style={styles.paymentInfo}>
            <CreditCard size={16} color="#6B7280" />
            <Text style={styles.paymentText}>UPI, Card, Cash accepted</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Place Order • {formatIndianCurrency(finalTotal)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
  },
  itemCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  itemsList: {
    padding: 20,
  },
  ecoOptions: {
    backgroundColor: "#F0FDF4",
    margin: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  ecoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  ecoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#166534",
  },
  ecoOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ecoOptionText: {
    fontSize: 14,
    color: "#15803D",
  },
  summary: {
    backgroundColor: "#ffffff",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  freeDelivery: {
    color: "#16A34A",
  },
  freeDeliveryNote: {
    fontSize: 12,
    color: "#16A34A",
    textAlign: "center",
    marginTop: -8,
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },
  checkoutContainer: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    padding: 20,
  },
  checkoutInfo: {
    marginBottom: 16,
    gap: 8,
  },
  deliveryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deliveryText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  paymentText: {
    fontSize: 12,
    color: "#6B7280",
  },
  checkoutButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
})
