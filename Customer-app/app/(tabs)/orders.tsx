'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { orderService, type Order } from '../../services/orderService';

type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export default function OrdersScreen() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'delivered' | 'cancelled'
  >('pending');

  const fetchOrders = async (showLoading = true) => {
    if (!token) return;

    try {
      if (showLoading) setLoading(true);
      const fetchedOrders = await orderService.getOrders(token);
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await orderService.cancelOrder(orderId, token!);
            Alert.alert('Success', 'Order cancelled successfully');
            fetchOrders(false);
          } catch (error) {
            Alert.alert('Error', 'Failed to cancel order');
          }
        },
      },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'preparing':
        return 'restaurant-outline';
      case 'ready':
        return 'bag-check-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const filteredOrders = orders.filter((order) => {
    switch (activeTab) {
      case 'pending':
        return ['pending', 'confirmed', 'preparing', 'ready'].includes(
          order.status.toLowerCase()
        );
      case 'delivered':
        return order.status.toLowerCase() === 'delivered';
      case 'cancelled':
        return order.status.toLowerCase() === 'cancelled';
      default:
        return true;
    }
  });

  const renderOrderItem = (order: Order) => (
    <View key={order._id} className="bg-white p-4 mb-3 rounded-lg shadow-sm">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">
            Order #{order._id.slice(-6).toUpperCase()}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}
        >
          <View className="flex-row items-center">
            <Ionicons
              name={getStatusIcon(order.status) as any}
              size={14}
              color={
                order.status.toLowerCase() === 'delivered'
                  ? '#166534'
                  : order.status.toLowerCase() === 'cancelled'
                  ? '#dc2626'
                  : '#92400e'
              }
            />
            <Text
              className={`text-xs font-medium ml-1 capitalize ${getStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </Text>
          </View>
        </View>
      </View>

      <View className="border-t border-gray-100 pt-3">
        <Text className="text-sm text-gray-600 mb-2">
          Items: {order.items?.length || order.products?.length || 0}
        </Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-lg font-bold text-green-600">
            ₹{order.totalAmount || order.total || 0}
          </Text>
          {order.status.toLowerCase() === 'pending' && (
            <TouchableOpacity
              onPress={() => handleCancelOrder(order._id)}
              className="bg-red-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white text-sm font-medium">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {order.deliveryAddress && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-start">
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text className="text-sm text-gray-600 ml-2 flex-1">
              {typeof order.deliveryAddress === 'string'
                ? order.deliveryAddress
                : `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderTabButton = (
    tab: 'pending' | 'delivered' | 'cancelled',
    label: string,
    count: number
  ) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 px-4 rounded-lg mx-1 ${
        activeTab === tab ? 'bg-green-500' : 'bg-white'
      }`}
    >
      <Text
        className={`text-center font-medium ${
          activeTab === tab ? 'text-white' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
      <Text
        className={`text-center text-xs mt-1 ${
          activeTab === tab ? 'text-green-100' : 'text-gray-500'
        }`}
      >
        ({count})
      </Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-green-500 px-4 py-6">
          <Text className="text-white text-2xl font-bold">My Orders</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500 text-lg">
            Please login to view your orders
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingCount = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(
      o.status.toLowerCase()
    )
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.status.toLowerCase() === 'delivered'
  ).length;
  const cancelledCount = orders.filter(
    (o) => o.status.toLowerCase() === 'cancelled'
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-green-500 px-4 py-6">
        <Text className="text-white text-2xl font-bold">My Orders</Text>
        <Text className="text-green-100 mt-1">
          Track your orders and delivery status
        </Text>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row p-4 bg-gray-50">
        {renderTabButton('pending', 'Pending', pendingCount)}
        {renderTabButton('delivered', 'Delivered', deliveredCount)}
        {renderTabButton('cancelled', 'Cancelled', cancelledCount)}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-500 mt-2">Loading orders...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredOrders.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="receipt-outline" size={80} color="#ccc" />
              <Text className="text-gray-500 text-lg mt-4">
                No {activeTab} orders
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Your {activeTab} orders will appear here
              </Text>
            </View>
          ) : (
            filteredOrders.map(renderOrderItem)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
