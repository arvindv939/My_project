'use client';

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OrderTiming {
  orderId: string;
  itemCount: number;
  baseWaitTime: number;
  actualWaitTime: number;
  startTime: Date;
  estimatedCompletionTime: Date;
  status:
    | 'pending'
    | 'preparing'
    | 'ready'
    | 'completed'
    | 'cancelled'
    | 'delivered'
    | 'confirmed';
  queuePosition: number;
}

class TimingService {
  private orderQueue: OrderTiming[] = [];
  private completedOrders: OrderTiming[] = [];
  private STORAGE_KEY = 'ORDER_QUEUE';
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  async init(): Promise<void> {
    if (!this.initialized) {
      try {
        await this.loadQueueFromStorage();
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize timing service:', error);
        this.orderQueue = [];
        this.completedOrders = [];
        this.initialized = true;
      }
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized && this.initPromise) {
      await this.initPromise;
    }
  }

  private calculateBaseWaitTime(itemCount: number): number {
    if (itemCount < 5) return Math.floor(Math.random() * 3) + 3; // 3-5 minutes
    if (itemCount < 10) return 10; // 10 minutes
    if (itemCount < 20) return 15; // 15 minutes
    return 20; // 20+ minutes
  }

  async addOrderToQueue(
    orderId: string,
    itemCount: number,
    orderDate?: Date
  ): Promise<OrderTiming> {
    await this.ensureInitialized();

    const baseWaitTime = this.calculateBaseWaitTime(itemCount);
    const startTime = orderDate || new Date();

    const orderTiming: OrderTiming = {
      orderId,
      itemCount,
      baseWaitTime,
      actualWaitTime: baseWaitTime, // Will be recalculated
      startTime,
      estimatedCompletionTime: new Date(), // Will be recalculated
      status: 'pending',
      queuePosition: 1, // Will be recalculated
    };

    this.orderQueue.push(orderTiming);

    // Recalculate all queue positions and times
    await this.recalculateQueueTimings();
    await this.saveQueueToStorage();

    return orderTiming;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderTiming['status']
  ): Promise<void> {
    await this.ensureInitialized();

    const index = this.orderQueue.findIndex((o) => o.orderId === orderId);
    if (index !== -1) {
      const order = this.orderQueue[index];
      order.status = status;

      if (
        status === 'completed' ||
        status === 'cancelled' ||
        status === 'delivered'
      ) {
        this.completedOrders.push(order);
        this.orderQueue.splice(index, 1);
        await this.recalculateQueueTimings();
      }

      await this.saveQueueToStorage();
    }
  }

  private async recalculateQueueTimings(): Promise<void> {
    const currentTime = new Date();

    // Get all active orders sorted by creation time (newest first = LIFO)
    const activeOrders = this.orderQueue
      .filter(
        (order) =>
          order.status === 'pending' ||
          order.status === 'preparing' ||
          order.status === 'confirmed'
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Newest first

    // Recalculate wait times in LIFO order (newest gets shortest time)
    let cumulativeTime = 0;

    activeOrders.forEach((order, index) => {
      order.queuePosition = activeOrders.length - index; // Reverse position

      if (index === 0) {
        // First order (newest) gets just its base time
        order.actualWaitTime = order.baseWaitTime;
        cumulativeTime = order.baseWaitTime;
      } else {
        // Older orders get cumulative time + their base time
        order.actualWaitTime = cumulativeTime + order.baseWaitTime;
        cumulativeTime = order.actualWaitTime;
      }

      order.estimatedCompletionTime = new Date(
        currentTime.getTime() + order.actualWaitTime * 60000
      );
    });

    await this.saveQueueToStorage();
  }

  getRemainingTime(orderId: string): number {
    if (!this.initialized || !this.orderQueue) return 0;

    const order = this.orderQueue.find((o) => o.orderId === orderId);
    if (!order) return 0;

    const now = new Date();
    const remainingMs = order.estimatedCompletionTime.getTime() - now.getTime();
    return Math.max(0, Math.ceil(remainingMs / 60000));
  }

  getActiveOrdersWithTimings(): OrderTiming[] {
    if (!this.initialized || !this.orderQueue) return [];
    return this.orderQueue
      .filter(
        (o) =>
          o.status !== 'completed' &&
          o.status !== 'cancelled' &&
          o.status !== 'delivered'
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  getOrderTiming(orderId: string): OrderTiming | null {
    if (!this.initialized || !this.orderQueue) return null;
    return this.orderQueue.find((o) => o.orderId === orderId) || null;
  }

  formatTimeDisplay(minutes: number): string {
    if (minutes <= 0) return 'Ready!';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  getQueuePosition(orderId: string): number {
    if (!this.initialized || !this.orderQueue) return 0;
    const order = this.orderQueue.find((o) => o.orderId === orderId);
    return order?.queuePosition || 0;
  }

  getQueueLength(): number {
    if (!this.initialized || !this.orderQueue) return 0;
    return this.orderQueue.filter(
      (order) =>
        order.status === 'pending' ||
        order.status === 'preparing' ||
        order.status === 'confirmed'
    ).length;
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      const data = JSON.stringify(this.orderQueue || []);
      await AsyncStorage.setItem(this.STORAGE_KEY, data);
    } catch (error) {
      console.error('❌ Failed to save orderQueue:', error);
    }
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.orderQueue = Array.isArray(parsed)
          ? parsed.map((order: any) => ({
              ...order,
              startTime: new Date(order.startTime),
              estimatedCompletionTime: new Date(order.estimatedCompletionTime),
            }))
          : [];
      } else {
        this.orderQueue = [];
      }
    } catch (error) {
      this.orderQueue = [];
      console.error('❌ Failed to load orderQueue:', error);
    }
  }

  getOrderQueue(): OrderTiming[] {
    return this.orderQueue || [];
  }

  async refreshQueue(): Promise<void> {
    await this.ensureInitialized();
    await this.recalculateQueueTimings();
  }

  async clearQueue(): Promise<void> {
    await this.ensureInitialized();
    this.orderQueue = [];
    this.completedOrders = [];
    await this.saveQueueToStorage();
  }
}

export const timingService = new TimingService();
