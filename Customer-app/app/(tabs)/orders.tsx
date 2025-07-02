'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  RotateCcw,
} from 'lucide-react-native';
import { orderService, type Order } from '@/services/orderService';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { timingService } from '@/services/timingService';
import { formatIndianCurrency } from '@/utils/currency';
import LiveTimer from '@/components/LiveTimer';

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return <Clock size={20} color="#F59E0B" />;
    case 'confirmed':
      return <CheckCircle size={20} color="#10B981" />;
    case 'preparing':
      return <Package size={20} color="#3B82F6" />;
    case 'out_for_delivery':
      return <Truck size={20} color="#8B5CF6" />;
    case 'delivered':
      return <CheckCircle size={20} color="#10B981" />;
    case 'cancelled':
      return <XCircle size={20} color="#EF4444" />;
    default:
      return <Clock size={20} color="#6B7280" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#F59E0B';
    case 'confirmed':
      return '#10B981';
    case 'preparing':
      return '#3B82F6';
    case 'out_for_delivery':
      return '#8B5CF6';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

export default function OrdersScreen() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'pending' | 'delivered' | 'cancelled'
  >('pending');
  const [timingServiceReady, setTimingServiceReady] = useState(false);

  useEffect(() => {
    // Initialize timing service and fetch orders
    const initializeServices = async () => {
      try {
        await timingService.init();
        setTimingServiceReady(true);
        await fetchOrders();
      } catch (error) {
        console.error('Error initializing services:', error);
        setTimingServiceReady(true); // Set to true anyway to prevent infinite loading
        await fetchOrders();
      }
    };

    initializeServices();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const fetchedOrders = await orderService.getOrders();
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await orderService.cancelOrder(orderId);
            fetchOrders();
            Alert.alert('✅ Success', 'Order cancelled successfully');
          } catch (error) {
            Alert.alert('❌ Error', 'Failed to cancel order');
          }
        },
      },
    ]);
  };

  const handleTrackOrder = (orderId: string, status: string) => {
    const trackingSteps = [
      { step: 'Order Placed', completed: true },
      {
        step: 'Confirmed',
        completed: [
          'confirmed',
          'preparing',
          'out_for_delivery',
          'delivered',
        ].includes(status.toLowerCase()),
      },
      {
        step: 'Preparing',
        completed: ['preparing', 'out_for_delivery', 'delivered'].includes(
          status.toLowerCase()
        ),
      },
      {
        step: 'Out for Delivery',
        completed: ['out_for_delivery', 'delivered'].includes(
          status.toLowerCase()
        ),
      },
      { step: 'Delivered', completed: status.toLowerCase() === 'delivered' },
    ];

    const trackingMessage = trackingSteps
      .map((step) => `${step.completed ? '✅' : '⏳'} ${step.step}`)
      .join('\n');

    Alert.alert(
      '📦 Order Tracking',
      `Order #${orderId.slice(-8)}\n\n${trackingMessage}`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  const handleReorder = async (order: Order) => {
    try {
      // Add all items from the order back to cart
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId) {
            addToCart(
              {
                id: item.productId._id || item.productId,
                name: item.productId.name || `Product ${item.productId}`,
                price: item.price,
                image:
                  item.productId.imageUrl ||
                  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
                category: item.productId.category || 'General',
                description: item.productId.description || '',
                isOrganic: item.productId.isOrganic || false,
                ecoFriendly: item.productId.ecoFriendly || false,
                inStock: true,
                rating: {
                  average: item.productId.rating || 4.5,
                  count: item.productId.reviews || 0,
                },
                unit: item.productId.unit || 'piece',
                quantity: 0,
              },
              item.quantity
            );
          }
        }
        Alert.alert(
          '🛒 Items Added to Cart',
          `${order.items.length} items from your previous order have been added to cart.`,
          [
            { text: 'Continue Shopping', style: 'default' },
            { text: 'View Cart', style: 'default' },
          ]
        );
      } else {
        Alert.alert(
          '❌ Error',
          'Unable to reorder - product information not available'
        );
      }
    } catch (error) {
      console.error('Error reordering:', error);
      Alert.alert('❌ Error', 'Failed to add items to cart');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemCount = (order: Order) => {
    return (
      order.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 0
    );
  };

  const getEstimatedWaitTime = (itemCount: number) => {
    if (itemCount < 5) return Math.floor(Math.random() * 3) + 3; // 3-5 minutes
    if (itemCount < 10) return 10; // 10 minutes
    if (itemCount < 20) return 15; // 15 minutes
    return 20; // 20+ minutes
  };

  const getRemainingTime = (orderId: string) => {
    if (!timingServiceReady) return 0;
    try {
      return timingService.getRemainingTime(orderId);
    } catch (error) {
      console.error('Error getting remaining time:', error);
      return 0;
    }
  };

  const formatTime = (minutes: number) => {
    if (!timingServiceReady) return '0m';
    try {
      return timingService.formatTimeDisplay(minutes);
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0m';
    }
  };

  const pendingOrders = orders.filter((order) =>
    ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(
      order.status.toLowerCase()
    )
  );

  const deliveredOrders = orders.filter(
    (order) => order.status.toLowerCase() === 'delivered'
  );

  const cancelledOrders = orders.filter(
    (order) => order.status.toLowerCase() === 'cancelled'
  );

  const getDisplayOrders = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'delivered':
        return deliveredOrders;
      case 'cancelled':
        return cancelledOrders;
      default:
        return pendingOrders;
    }
  };

  const displayOrders = getDisplayOrders();

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'pending':
        return `Pending (${pendingOrders.length})`;
      case 'delivered':
        return `Delivered (${deliveredOrders.length})`;
      case 'cancelled':
        return `Cancelled (${cancelledOrders.length})`;
      default:
        return `Pending (${pendingOrders.length})`;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'pending':
        return {
          title: 'No pending orders',
          subtitle: 'Your active orders will appear here',
        };
      case 'delivered':
        return {
          title: 'No delivered orders',
          subtitle: 'Your delivered orders will appear here',
        };
      case 'cancelled':
        return {
          title: 'No cancelled orders',
          subtitle: 'Your cancelled orders will appear here',
        };
      default:
        return {
          title: 'No orders',
          subtitle: 'Your orders will appear here',
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>
          Track your orders and delivery status
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText,
            ]}
          >
            {getTabTitle('pending')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'delivered' && styles.activeTab]}
          onPress={() => setActiveTab('delivered')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'delivered' && styles.activeTabText,
            ]}
          >
            {getTabTitle('delivered')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'cancelled' && styles.activeTabText,
            ]}
          >
            {getTabTitle('cancelled')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <ScrollView
        style={styles.ordersContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#27AE60" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : displayOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>{getEmptyMessage().title}</Text>
            <Text style={styles.emptySubtitle}>
              {getEmptyMessage().subtitle}
            </Text>
          </View>
        ) : (
          displayOrders.map((order) => {
            const itemCount = getItemCount(order);
            const remainingTime =
              getRemainingTime(order._id) || getEstimatedWaitTime(itemCount);

            return (
              <View key={order._id} style={styles.orderCard}>
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>
                      Order #{order._id.slice(-8)}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + '20' },
                    ]}
                  >
                    {getStatusIcon(order.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {formatStatus(order.status)}
                    </Text>
                  </View>
                </View>

                {/* Live Timer - Only for pending orders */}
                {activeTab === 'pending' &&
                  !['delivered', 'cancelled'].includes(
                    order.status.toLowerCase()
                  ) &&
                  timingServiceReady && (
                    <LiveTimer
                      orderId={order._id}
                      estimatedTime={remainingTime}
                      status={order.status}
                      itemCount={itemCount}
                    />
                  )}

                {/* Order Items */}
                <View style={styles.orderItems}>
                  <Text style={styles.itemsTitle}>
                    {itemCount} item{itemCount > 1 ? 's' : ''}
                  </Text>
                  {(order.items || []).slice(0, 2).map((item, index) => (
                    <View key={index} style={styles.orderItem}>
                      <Text style={styles.itemName}>
                        {item.productId?.name || `Product ${index + 1}`}
                      </Text>
                      <Text style={styles.itemDetails}>
                        {item.quantity}x ₹{item.price}
                      </Text>
                    </View>
                  ))}
                  {itemCount > 2 && (
                    <Text style={styles.moreItems}>
                      +{itemCount - 2} more item{itemCount - 2 > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>

                {/* Delivery Info */}
                {order.deliveryAddress && (
                  <View style={styles.deliveryInfo}>
                    <MapPin size={16} color="#6B7280" />
                    <Text style={styles.deliveryAddress} numberOfLines={1}>
                      {typeof order.deliveryAddress === 'string'
                        ? order.deliveryAddress
                        : JSON.stringify(order.deliveryAddress)}
                    </Text>
                  </View>
                )}

                {/* Order Footer */}
                <View style={styles.orderFooter}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>
                      {formatIndianCurrency(
                        order.totalAmount || order.total || 0
                      )}
                    </Text>
                  </View>

                  <View style={styles.orderActions}>
                    {activeTab === 'pending' &&
                      order.status.toLowerCase() === 'pending' && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => handleCancelOrder(order._id)}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                      )}

                    {activeTab === 'pending' && (
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() =>
                          handleTrackOrder(order._id, order.status)
                        }
                      >
                        <Text style={styles.trackButtonText}>Track</Text>
                      </TouchableOpacity>
                    )}

                    {(activeTab === 'delivered' ||
                      activeTab === 'cancelled') && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => handleReorder(order)}
                      >
                        <RotateCcw size={16} color="#ffffff" />
                        <Text style={styles.reorderButtonText}>Reorder</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
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
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#27AE60',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#ffffff',
  },
  ordersContainer: {
    flex: 1,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
  },
  itemDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  moreItems: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 4,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  deliveryAddress: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  trackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#27AE60',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#27AE60',
    gap: 6,
  },
  reorderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
