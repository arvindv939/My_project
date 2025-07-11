import API from '@/utils/api';

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CreateOrderPayload {
  items: OrderItem[];
  totalAmount: number;
  orderType: 'online' | 'offline';
  deliveryAddress?: DeliveryAddress; // Make optional
  paymentMethod: string;
  notes?: string;
}

export interface Order {
  _id: string;
  customerId: string;
  items: Array<{
    productId: {
      _id: string;
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
    price: number;
    picked: boolean;
  }>;
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class OrderService {
  async createOrder(
    orderData: CreateOrderPayload,
    token: string
  ): Promise<Order> {
    try {
      console.log('📦 Creating order with data:', orderData);

      // Validate order data before sending
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      if (
        (!orderData.orderType || orderData.orderType === 'online') && // Only check for online!
        (!orderData.deliveryAddress || !orderData.deliveryAddress.street)
      ) {
        throw new Error('Delivery address is required');
      }

      if (!orderData.totalAmount || orderData.totalAmount <= 0) {
        throw new Error('Invalid total amount');
      }

      const response = await API.post('/orders', orderData);

      if (response.data.success) {
        console.log('✅ Order created successfully:', response.data.order);
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (error: any) {
      console.error('❌ Error creating order:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to create order. Please try again.');
      }
    }
  }

  async getCustomerOrders(token: string): Promise<Order[]> {
    try {
      console.log('📋 Fetching customer orders');
      const response = await API.get('/orders/customer');

      if (response.data.success) {
        console.log(
          '✅ Orders fetched successfully:',
          response.data.orders.length
        );
        return response.data.orders;
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch orders. Please try again.');
      }
    }
  }

  async getOrderById(orderId: string, token: string): Promise<Order> {
    try {
      console.log('🔍 Fetching order by ID:', orderId);
      const response = await API.get(`/orders/${orderId}`);

      if (response.data.success) {
        console.log('✅ Order fetched successfully:', response.data.order);
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to fetch order');
      }
    } catch (error: any) {
      console.error('❌ Error fetching order:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to fetch order. Please try again.');
      }
    }
  }

  async cancelOrder(orderId: string, token: string): Promise<Order> {
    try {
      console.log('❌ Cancelling order:', orderId);
      const response = await API.put(`/orders/${orderId}/status`, {
        status: 'cancelled',
      });

      if (response.data.success) {
        console.log('✅ Order cancelled successfully:', response.data.order);
        return response.data.order;
      } else {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('❌ Error cancelling order:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to cancel order. Please try again.');
      }
    }
  }
}

export const orderService = new OrderService();
