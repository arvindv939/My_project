import API from '@/utils/api';
import type { Product } from '@/types';

export interface OrderItem {
  product: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  notes?: string;
}

export interface Order {
  _id: string;
  customer: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  deliveryAddress: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class OrderService {
  async createOrder(
    cartItems: Product[],
    deliveryAddress: string,
    paymentMethod = 'cash'
  ): Promise<Order> {
    try {
      console.log('OrderService: Creating order with cart items:', cartItems);

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // Transform cart items to order items format
      const items: OrderItem[] = cartItems.map((item) => ({
        product: item.id,
        quantity: item.quantity || 1,
        price: item.price,
      }));

      const totalAmount = cartItems.reduce(
        (total, item) => total + item.price * (item.quantity || 1),
        0
      );

      const orderData: CreateOrderRequest = {
        items,
        totalAmount,
        deliveryAddress,
        paymentMethod,
      };

      console.log('OrderService: Sending order data:', orderData);

      const response = await API.post('/orders', orderData);

      console.log('OrderService: Order created successfully:', response.data);

      return response.data.order || response.data;
    } catch (error: any) {
      console.error('OrderService: Error creating order:', error);

      if (error.response) {
        console.error('OrderService: Error response:', error.response.data);
        console.error('OrderService: Error status:', error.response.status);
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }

      throw error;
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await API.get('/orders/my-orders');
      return response.data.orders || response.data || [];
    } catch (error) {
      console.error('OrderService: Error fetching orders:', error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order> {
    try {
      const response = await API.get(`/orders/${id}`);
      return response.data.order || response.data;
    } catch (error) {
      console.error('OrderService: Error fetching order:', error);
      throw error;
    }
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    try {
      const response = await API.put(`/orders/${id}/status`, { status });
      return response.data.order || response.data;
    } catch (error) {
      console.error('OrderService: Error updating order status:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
