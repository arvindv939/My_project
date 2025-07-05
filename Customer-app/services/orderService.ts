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
  userId: string;
  items: Array<{
    productId: any;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  total?: number;
  status: string;
  deliveryAddress?: string | object;
  createdAt: string;
  updatedAt?: string;
}

class OrderService {
  private baseUrl = 'http://localhost:5000/api';

  // === Fetch orders for the current customer ===
  async getOrders(token: string): Promise<Order[]> {
    try {
      if (!token) throw new Error('User is not authenticated');
      const response = await fetch(`${this.baseUrl}/orders/customer`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        // Optionally: log backend error message for debugging
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
  async getShopOwnerOrders(token: string): Promise<Order[]> {
    try {
      if (!token) throw new Error('User is not authenticated');
      const response = await fetch(`${this.baseUrl}/orders/shop-owner`, {
        headers: {
          Authorization: `Bearer ${token}`,
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

  async createOrder(orderData: any, token: string): Promise<Order> {
    try {
      if (!token) throw new Error('User is not authenticated');

      // 🚨 Validate items before sending to backend
      if (!orderData.items || !Array.isArray(orderData.items)) {
        throw new Error('Order items are missing or invalid');
      }

      for (const item of orderData.items) {
        if (!item.productId || typeof item.productId !== 'string') {
          throw new Error(
            `Invalid or missing productId in item: ${JSON.stringify(item)}`
          );
        }
      }

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        let errMsg = 'Failed to create order';
        try {
          const errJson = await response.json();
          errMsg = errJson.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const { order } = await response.json();
      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // === Cancel an order ===
  async cancelOrder(orderId: string, token: string): Promise<void> {
    try {
      if (!token) throw new Error('User is not authenticated');
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    token: string
  ): Promise<void> {
    try {
      if (!token) throw new Error('User is not authenticated');
      const response = await fetch(`${this.baseUrl}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
