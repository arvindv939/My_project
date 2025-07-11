'use client';

import { useState, useEffect } from 'react';
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
import { MapPin, CreditCard, Truck, Wifi, WifiOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/components/CartItem';
import { formatIndianCurrency } from '@/utils/currency';
import { orderService } from '@/services/orderService';
import { useAuth } from '@/contexts/AuthContext';
import { testConnection } from '@/utils/api';

export default function CartScreen() {
  const { items, getTotalPrice, clearCart } = useCart();
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(
    null
  );
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '123 Main Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
  });
  const [orderType, setOrderType] = useState<'online' | 'offline'>('online');

  const totalPrice = getTotalPrice();
  const deliveryFee = orderType === 'online' ? (totalPrice > 500 ? 0 : 40) : 0;
  const finalTotal = totalPrice + deliveryFee;

  // Test connection on component mount
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const isConnected = await testConnection();
      setConnectionStatus(isConnected);
    } catch (error) {
      setConnectionStatus(false);
    }
  };

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

      // Check connection before placing order
      setLoading(true);
      const isConnected = await testConnection();

      if (!isConnected) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to server. Please check your internet connection and try again.'
        );
        setLoading(false);
        return;
      }

      const orderPayload = {
        items: items.map((item) => ({
          productId: item.id || item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: finalTotal,
        deliveryAddress,
        paymentMethod: 'cash',
        notes: 'Order placed from mobile app',
      };

      console.log('📦 Placing order with payload:', orderPayload);

      const order = await orderService.createOrder(orderPayload, token);

      Alert.alert(
        'Success! 🎉',
        `Order #${order._id.slice(
          -6
        )} placed successfully!\n\nYou will receive updates about your order status.`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearCart();
              // Navigate to orders tab or order details
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error placing order:', error);

      Alert.alert(
        'Order Failed',
        error.message || 'Failed to place order. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleCheckout(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
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
      {/* Header with connection status */}
      <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Shopping Cart</Text>
            <Text style={styles.headerSubtitle}>
              {items.length} items in your basket
            </Text>
          </View>
          <View style={styles.connectionIndicator}>
            {connectionStatus === null ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : connectionStatus ? (
              <Wifi size={20} color="#ffffff" />
            ) : (
              <WifiOff size={20} color="#ff6b6b" />
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          {items.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
        </View>
        <View style={styles.orderTypeContainer}>
          <TouchableOpacity
            style={[
              styles.orderTypeButton,
              orderType === 'online' && styles.orderTypeButtonActive,
            ]}
            onPress={() => setOrderType('online')}
          >
            <Text
              style={[
                styles.orderTypeText,
                orderType === 'online' && styles.orderTypeTextActive,
              ]}
            >
              Online Delivery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.orderTypeButton,
              orderType === 'offline' && styles.orderTypeButtonActive,
            ]}
            onPress={() => setOrderType('offline')}
          >
            <Text
              style={[
                styles.orderTypeText,
                orderType === 'offline' && styles.orderTypeTextActive,
              ]}
            >
              Offline Pickup
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}

        {/* Delivery Address Section */}
        {orderType === 'online' && (
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
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.addressInput, styles.addressInputHalf]}
                value={deliveryAddress.city}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, city: text })
                }
                placeholder="City"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={[styles.addressInput, styles.addressInputHalf]}
                value={deliveryAddress.state}
                onChangeText={(text) =>
                  setDeliveryAddress({ ...deliveryAddress, state: text })
                }
                placeholder="State"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TextInput
              style={styles.addressInput}
              value={deliveryAddress.zipCode}
              onChangeText={(text) =>
                setDeliveryAddress({ ...deliveryAddress, zipCode: text })
              }
              placeholder="Zip Code"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        )}

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
        {orderType === 'online' && (
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
        )}
        {orderType === 'offline' && (
          <View style={styles.section}>
            <Text
              style={{
                textAlign: 'center',
                color: '#15803D',
                fontFamily: 'Inter-Medium',
              }}
            >
              Please visit the store counter to pickup your order!
            </Text>
          </View>
        )}

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

          {orderType === 'online' && (
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
          )}

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
            (loading || connectionStatus === false) &&
              styles.checkoutButtonDisabled,
          ]}
          onPress={handleCheckout}
          disabled={loading || connectionStatus === false}
        >
          <LinearGradient
            colors={
              connectionStatus === false
                ? ['#9CA3AF', '#6B7280']
                : ['#27AE60', '#2ECC71']
            }
            style={styles.checkoutGradient}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.checkoutText}>
                  {connectionStatus === false ? 'No Connection' : 'Place Order'}
                </Text>
                <Text style={styles.checkoutAmount}>
                  {formatIndianCurrency(finalTotal)}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {connectionStatus === false && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkConnection}
          >
            <Text style={styles.retryText}>Tap to retry connection</Text>
          </TouchableOpacity>
        )}
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  connectionIndicator: {
    marginTop: 4,
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
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addressInputHalf: {
    flex: 1,
  },
  paymentOption: {
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
    marginTop: 2,
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
  retryButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
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
  orderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  orderTypeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#27AE60',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  orderTypeButtonActive: {
    backgroundColor: '#27AE60',
  },
  orderTypeText: {
    color: '#27AE60',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  orderTypeTextActive: {
    color: '#fff',
  },
});
