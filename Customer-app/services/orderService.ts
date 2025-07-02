import { timingService } from './timingService';

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
  private orders: Order[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create orders with proper chronological order
    const now = Date.now();

    this.orders = [
      // Order #c6f5bb - OLDEST order (should have longest wait time in LIFO)
      {
        _id: 'c6f5bb',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 25, // 25 items = 20min base time
            price: 52,
          },
        ],
        totalAmount: 1300,
        status: 'pending',
        deliveryAddress: '987 Cedar Ln, City',
        createdAt: new Date(now - 60 * 60000).toISOString(), // 60 minutes ago (OLDEST)
      },
      // Order #fabc6d - Second oldest
      {
        _id: 'fabc6d',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod2',
              name: 'raddish',
              imageUrl:
                'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 4, // 4 items = 3-5min base time
            price: 80,
          },
        ],
        totalAmount: 320,
        status: 'confirmed',
        deliveryAddress: '456 Oak Ave, City',
        createdAt: new Date(now - 50 * 60000).toISOString(), // 50 minutes ago
      },
      // Order #b97e37 - NEWEST order (should have shortest wait time in LIFO)
      {
        _id: 'b97e37',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 5, // 5 items = 10min base time
            price: 50,
          },
        ],
        totalAmount: 250,
        status: 'confirmed',
        deliveryAddress: '123 Main St, City',
        createdAt: new Date(now - 40 * 60000).toISOString(), // 40 minutes ago (NEWEST)
      },
      // Delivered orders (don't affect queue)
      {
        _id: 'fabc19',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 5,
            price: 50,
          },
        ],
        totalAmount: 250,
        status: 'delivered',
        deliveryAddress: '789 Pine St, City',
        createdAt: new Date(now - 2 * 24 * 60 * 60000).toISOString(), // 2 days ago
      },
      {
        _id: 'fabaf6',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 1,
            price: 50,
          },
        ],
        totalAmount: 50,
        status: 'delivered',
        deliveryAddress: '321 Elm St, City',
        createdAt: new Date(now - 3 * 24 * 60 * 60000).toISOString(), // 3 days ago
      },
      // Cancelled orders
      {
        _id: 'fab9ca',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 10,
            price: 50,
          },
        ],
        totalAmount: 770,
        status: 'cancelled',
        deliveryAddress: '654 Maple Ave, City',
        createdAt: new Date(now - 4 * 24 * 60 * 60000).toISOString(), // 4 days ago
      },
      {
        _id: 'c6f738',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 11,
            price: 52,
          },
        ],
        totalAmount: 520,
        status: 'delivered',
        deliveryAddress: '654 Maple Dr, City',
        createdAt: new Date(now - 5 * 24 * 60 * 60000).toISOString(), // 5 days ago
      },
      {
        _id: '233518',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 9,
            price: 50,
          },
        ],
        totalAmount: 600,
        status: 'delivered',
        deliveryAddress: '147 Birch St, City',
        createdAt: new Date(now - 6 * 24 * 60 * 60000).toISOString(), // 6 days ago
      },
      {
        _id: '233372',
        userId: 'user1',
        items: [
          {
            productId: {
              _id: 'prod1',
              name: 'cucumber',
              imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=300&h=300&fit=crop',
              category: 'Vegetables',
              unit: 'piece',
            },
            quantity: 9,
            price: 50,
          },
        ],
        totalAmount: 600,
        status: 'delivered',
        deliveryAddress: '258 Spruce Ave, City',
        createdAt: new Date(now - 7 * 24 * 60 * 60000).toISOString(), // 7 days ago
      },
    ];

    this.initializeTimingService();
  }

  private async initializeTimingService() {
    try {
      // Clear existing queue first
      await timingService.clearQueue();

      // Add orders to timing service in chronological order (oldest first)
      const sortedOrders = [...this.orders]
        .filter(
          (order) =>
            order.status !== 'cancelled' &&
            order.status !== 'delivered' &&
            order.status !== 'completed'
        )
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

      console.log(
        'Initializing timing service with orders:',
        sortedOrders.map((o) => ({
          id: o._id,
          created: o.createdAt,
          status: o.status,
          items: o.items.reduce((sum, item) => sum + item.quantity, 0),
        }))
      );

      for (const order of sortedOrders) {
        const itemCount = order.items.reduce(
          (total, item) => total + item.quantity,
          0
        );
        const orderDate = new Date(order.createdAt);

        await timingService.addOrderToQueue(order._id, itemCount, orderDate);

        // Update status if not pending
        if (order.status !== 'pending') {
          await timingService.updateOrderStatus(order._id, order.status as any);
        }
      }
    } catch (error) {
      console.error('Error initializing timing service:', error);
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      // Return orders sorted by creation date (newest first for display)
      return [...this.orders].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      const orderIndex = this.orders.findIndex(
        (order) => order._id === orderId
      );
      if (orderIndex !== -1) {
        this.orders[orderIndex].status = 'cancelled';
        await timingService.updateOrderStatus(orderId, 'cancelled');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      const orderIndex = this.orders.findIndex(
        (order) => order._id === orderId
      );
      if (orderIndex !== -1) {
        this.orders[orderIndex].status = status;
        await timingService.updateOrderStatus(orderId, status as any);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }
}

export const orderService = new OrderService();
