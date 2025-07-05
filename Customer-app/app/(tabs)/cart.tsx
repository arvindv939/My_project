'use client';

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, CreditCard, Truck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/components/CartItem';
import { formatIndianCurrency } from '@/utils/currency';
import { orderService } from '@/services/orderService';
// 👇 Import your auth context here
import { useAuth } from '@/contexts/AuthContext';

export default function CartScreen() {
  const { items, getTotalPrice, clearCart } = useCart();
  // 👇 Get token from AuthContext
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '123 Main Street',
    city: 'City',
    state: 'State',
    zipCode: '12345',
  });

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 500 ? 0 : 40;
  const finalTotal = totalPrice + deliveryFee;

  const handleCheckout = async () => {
    try {
      if (items.length === 0) {
        Alert.alert(
          'Empty Cart',
          'Please add items to your cart before checkout.'
        );
        return;
      }

      if (
        !deliveryAddress.street.trim() ||
        !deliveryAddress.city.trim() ||
        !deliveryAddress.state.trim() ||
        !deliveryAddress.zipCode.trim()
      ) {
        Alert.alert('Address Required', 'Please complete all address fields.');
        return;
      }

      if (!token) {
        Alert.alert('Login Required', 'Please log in to place your order.');
        return;
      }

      setLoading(true);

      const orderPayload = {
        items: items.map((item) => ({
          productId: item.id || item._id, // support both id and _id
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: finalTotal,
        deliveryAddress,
        paymentMethod: 'cash', // ✅ required by backend
      };

      const order = await orderService.createOrder(orderPayload, token);

      Alert.alert('Success', 'Order placed successfully!');
      clearCart(); // optional
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <Text style={styles.headerSubtitle}>
            Your eco-friendly shopping basket
          </Text>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some eco-friendly products to get started!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <Text style={styles.headerSubtitle}>
          {items.length} items in your basket
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color="#27AE60" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            value={deliveryAddress.street}
            onChangeText={(text) =>
              setDeliveryAddress({ ...deliveryAddress, street: text })
            }
            placeholder="Street address"
          />
          <TextInput
            style={styles.addressInput}
            value={deliveryAddress.city}
            onChangeText={(text) =>
              setDeliveryAddress({ ...deliveryAddress, city: text })
            }
            placeholder="City"
          />
          <TextInput
            style={styles.addressInput}
            value={deliveryAddress.state}
            onChangeText={(text) =>
              setDeliveryAddress({ ...deliveryAddress, state: text })
            }
            placeholder="State"
          />
          <TextInput
            style={styles.addressInput}
            value={deliveryAddress.zipCode}
            onChangeText={(text) =>
              setDeliveryAddress({ ...deliveryAddress, zipCode: text })
            }
            placeholder="Zip Code"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#27AE60" />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.paymentOption}>
            <Text style={styles.paymentText}>💰 Cash on Delivery</Text>
            <Text style={styles.paymentSubtext}>
              Pay when your order arrives
            </Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Truck size={20} color="#27AE60" />
            <Text style={styles.sectionTitle}>Delivery Information</Text>
          </View>
          <View style={styles.deliveryInfo}>
            <Text style={styles.deliveryText}>🚚 Standard Delivery</Text>
            <Text style={styles.deliverySubtext}>
              Delivered within 2-3 hours
            </Text>
            <Text style={styles.deliveryNote}>
              {deliveryFee === 0
                ? 'Free delivery on orders above ₹500'
                : `Delivery fee: ${formatIndianCurrency(deliveryFee)}`}
            </Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Subtotal ({items.length} items)
            </Text>
            <Text style={styles.summaryValue}>
              {formatIndianCurrency(totalPrice)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text
              style={[
                styles.summaryValue,
                deliveryFee === 0 && styles.freeDelivery,
              ]}
            >
              {deliveryFee === 0 ? 'FREE' : formatIndianCurrency(deliveryFee)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              {formatIndianCurrency(finalTotal)}
            </Text>
          </View>

          <View style={styles.savingsContainer}>
            <Text style={styles.savingsText}>
              🌱 You're saving the environment with eco-friendly choices!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            loading && styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={loading}
        >
          <LinearGradient
            colors={['#27AE60', '#2ECC71']}
            style={styles.checkoutGradient}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.checkoutText}>Place Order</Text>
                <Text style={styles.checkoutAmount}>
                  {formatIndianCurrency(finalTotal)}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
  },
  itemsContainer: {
    padding: 20,
    gap: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  deliveryInfo: {
    gap: 4,
  },
  deliveryText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  deliverySubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  deliveryNote: {
    fontSize: 12,
    color: '#27AE60',
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
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
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  freeDelivery: {
    color: '#27AE60',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#27AE60',
  },
  savingsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  savingsText: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  checkoutContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  checkoutText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  checkoutAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
