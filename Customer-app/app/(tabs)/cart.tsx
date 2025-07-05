'use client';

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { orderService } from '../../services/orderService';
import { router } from 'expo-router';

export default function CartScreen() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal } =
    useCart();
  const { user, token } = useAuth();
  const [deliveryAddress, setDeliveryAddress] = useState(
    '123 Main Street, City, State 12345'
  );
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addressError, setAddressError] = useState('');

  const validateAddress = (address: string) => {
    if (!address || address.trim().length < 10) {
      setAddressError(
        'Please enter a complete delivery address (minimum 10 characters)'
      );
      return false;
    }
    setAddressError('');
    return true;
  };

  const handlePlaceOrder = async () => {
    console.log('Cart: Starting order placement process');

    if (!user || !token) {
      Alert.alert('Error', 'Please login to place an order');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }

    if (!validateAddress(deliveryAddress)) {
      return;
    }

    setIsPlacingOrder(true);

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        totalAmount: getCartTotal(),
        orderType: 'delivery',
        scheduledTime: 'ASAP',
        notes: '',
      };

      console.log('Cart: Sending order data:', orderData);

      const order = await orderService.createOrder(orderData, token);

      console.log('Cart: Order created successfully:', order);

      Alert.alert('Success', 'Your order has been placed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            router.push('/(tabs)/orders');
          },
        },
      ]);
    } catch (error) {
      console.error('Cart: Error placing order:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to place order. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderCartItem = (item: any) => (
    <View
      key={item._id}
      className="flex-row items-center bg-white p-4 mb-3 rounded-lg shadow-sm"
    >
      <Image
        source={{ uri: item.imageUrl || '/placeholder.svg?height=60&width=60' }}
        className="w-15 h-15 rounded-lg mr-4"
        style={{ resizeMode: 'cover' }}
      />
      <View className="flex-1">
        <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
        <Text className="text-sm text-gray-600">₹{item.price}/kg</Text>
        <View className="flex-row items-center mt-2">
          <TouchableOpacity
            onPress={() =>
              updateQuantity(item._id, Math.max(0, item.quantity - 1))
            }
            className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
          >
            <Ionicons name="remove" size={16} color="#666" />
          </TouchableOpacity>
          <Text className="mx-4 text-lg font-semibold">{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item._id, item.quantity + 1)}
            className="w-8 h-8 bg-green-500 rounded-full items-center justify-center"
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-lg font-bold text-green-600">
          ₹{item.price * item.quantity}
        </Text>
        <TouchableOpacity
          onPress={() => removeFromCart(item._id)}
          className="mt-2 p-1"
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-green-500 px-4 py-6">
          <Text className="text-white text-2xl font-bold">Shopping Cart</Text>
          <Text className="text-green-100 mt-1">Your cart is empty</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Ionicons name="cart-outline" size={80} color="#ccc" />
          <Text className="text-gray-500 text-lg mt-4">
            No items in your cart
          </Text>
          <Text className="text-gray-400 text-center mt-2 px-8">
            Browse our products and add items to your cart
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/')}
            className="bg-green-500 px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-green-500 px-4 py-6">
        <Text className="text-white text-2xl font-bold">Shopping Cart</Text>
        <Text className="text-green-100 mt-1">
          {cartItems.length} items in your basket
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {cartItems.map(renderCartItem)}

        {/* Delivery Address */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="location-outline" size={20} color="#10b981" />
            <Text className="text-lg font-semibold ml-2">Delivery Address</Text>
          </View>
          <TextInput
            value={deliveryAddress}
            onChangeText={(text) => {
              setDeliveryAddress(text);
              if (addressError) validateAddress(text);
            }}
            placeholder="Enter your complete delivery address"
            className={`border rounded-lg p-3 text-gray-700 ${
              addressError ? 'border-red-500' : 'border-gray-300'
            }`}
            multiline
            numberOfLines={3}
          />
          {addressError ? (
            <Text className="text-red-500 text-sm mt-1">{addressError}</Text>
          ) : null}
        </View>

        {/* Payment Method */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="card-outline" size={20} color="#10b981" />
            <Text className="text-lg font-semibold ml-2">Payment Method</Text>
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="cash-outline" size={20} color="#f59e0b" />
            <Text className="ml-2 text-gray-700">Cash on Delivery</Text>
            <Text className="ml-auto text-sm text-gray-500">
              Pay when your order arrives
            </Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Information */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={20} color="#10b981" />
            <Text className="text-lg font-semibold ml-2">
              Delivery Information
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="bicycle-outline" size={20} color="#f59e0b" />
            <Text className="ml-2 text-gray-700">Standard Delivery</Text>
          </View>
          <Text className="text-sm text-gray-500 mt-1">
            Delivered within 2-3 hours
          </Text>
          <Text className="text-xs text-green-600 mt-1">
            Free delivery on orders above ₹500
          </Text>
        </View>

        {/* Order Summary */}
        <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
          <Text className="text-lg font-semibold mb-3">Order Summary</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">
              Subtotal ({cartItems.length} items)
            </Text>
            <Text className="font-semibold">₹{getCartTotal()}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className="font-semibold text-green-600">FREE</Text>
          </View>
          <View className="border-t border-gray-200 pt-2 mt-2">
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold">Total Amount</Text>
              <Text className="text-lg font-bold text-green-600">
                ₹{getCartTotal()}
              </Text>
            </View>
          </View>
        </View>

        {/* Eco-friendly message */}
        <View className="bg-green-50 p-3 rounded-lg mb-4 flex-row items-center">
          <Ionicons name="leaf-outline" size={20} color="#10b981" />
          <Text className="text-green-700 text-sm ml-2 flex-1">
            You're saving the environment with eco-friendly choices!
          </Text>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="p-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || !!addressError}
          className={`py-4 rounded-lg items-center ${
            isPlacingOrder || addressError ? 'bg-gray-400' : 'bg-green-500'
          }`}
        >
          {isPlacingOrder ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-bold text-lg ml-2">
                Placing Order...
              </Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-lg">
              Place Order ₹{getCartTotal()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
