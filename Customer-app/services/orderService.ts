// services/orderService.ts

export interface Product {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
  category?: string;
  description?: string;
  isOrganic?: boolean;
  ecoFriendly?: boolean;
  unit?: string;
  rating?: number;
  reviews?: number;
}

export interface OrderItem {
  productId: Product | string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  customerId?: string;
  customer?: string;
  userId?: string;
  items: Array<{
    productId: any;
    quantity: number;
    price: number;
  }>;
  products?: Array<{
    product: any;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  total?: number;
  status: string;
  deliveryAddress?: string | object;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

class OrderService {
  private baseUrl = 'http://localhost:5000/api';

  // Helper method to get token
  private getAuthToken(): string | null {
    // Try to get token from localStorage first (for web compatibility)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    // For React Native, you might want to use AsyncStorage
    // For now, return null and handle in the calling component
    return null;
  }

  // === Fetch orders for the current customer ===
  async getOrders(token?: string): Promise<Order[]> {
    try {
      const authToken = token || this.getAuthToken();
      if (!authToken) throw new Error('User is not authenticated');

      const response = await fetch(`${this.baseUrl}/orders/customer`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errMsg = 'Failed to fetch orders';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      return result.orders || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  // === Fetch orders for the current shop owner ===
  async getShopOwnerOrders(token?: string): Promise<Order[]> {
    try {
      const authToken = token || this.getAuthToken();
      if (!authToken) throw new Error('User is not authenticated');

      const response = await fetch(`${this.baseUrl}/orders/shop-owner`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errMsg = 'Failed to fetch shop owner orders';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const result = await response.json();
      return result.orders || [];
    } catch (error) {
      console.error('Error fetching shop owner orders:', error);
      return [];
    }
  }

  // === Create a new order ===
  async createOrder(orderData: any, token?: string): Promise<Order> {
    try {
      const authToken = token || this.getAuthToken();
      if (!authToken) throw new Error('User is not authenticated');

      // Transform the order data to match backend expectations
      const transformedOrderData = {
        // Support both 'items' and 'products' field names
        products: orderData.items || orderData.products,
        items: orderData.items || orderData.products,
        // Support both 'deliveryAddress' and 'address' field names
        address: orderData.deliveryAddress || orderData.address,
        deliveryAddress: orderData.deliveryAddress || orderData.address,
        // Support both 'totalAmount' and 'total' field names
        total: orderData.totalAmount || orderData.total,
        totalAmount: orderData.totalAmount || orderData.total,
        paymentMethod: orderData.paymentMethod || 'cash',
        orderType: orderData.orderType || 'delivery',
        scheduledDate: orderData.scheduledDate || new Date().toISOString(),
        scheduledTime: orderData.scheduledTime || 'ASAP',
        notes: orderData.notes || '',
      };

      console.log(
        'OrderService: Sending transformed order data:',
        transformedOrderData
      );

      const response = await fetch(`${this.baseUrl}/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(transformedOrderData),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create order';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
          console.error('OrderService: Backend error response:', errJson);
        } catch (parseError) {
          console.error(
            'OrderService: Failed to parse error response:',
            parseError
          );
        }
        throw new Error(errMsg);
      }

      const result = await response.json();
      console.log('OrderService: Order created successfully:', result);
      return result.order || result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // === Cancel an order ===
  async cancelOrder(orderId: string, token?: string): Promise<void> {
    try {
      const authToken = token || this.getAuthToken();
      if (!authToken) throw new Error('User is not authenticated');

      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to cancel order';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  // === Update order status ===
  async updateOrderStatus(
    orderId: string,
    status: string,
    token?: string
  ): Promise<void> {
    try {
      const authToken = token || this.getAuthToken();
      if (!authToken) throw new Error('User is not authenticated');

      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        let errMsg = 'Failed to update order status';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
