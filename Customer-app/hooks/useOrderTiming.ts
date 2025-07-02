'use client';

import { useState, useEffect } from 'react';
import { timingService, type OrderTiming } from '@/services/timingService';

export const useOrderTiming = (orderId?: string) => {
  const [orderTiming, setOrderTiming] = useState<OrderTiming | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [allActiveOrders, setAllActiveOrders] = useState<OrderTiming[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAndUpdate = async () => {
      try {
        setIsLoading(true);

        // Ensure timing service is initialized
        await timingService.init();

        if (orderId) {
          const timing = timingService.getOrderTiming(orderId);
          setOrderTiming(timing);

          if (timing) {
            const remaining = timingService.getRemainingTime(orderId);
            setRemainingTime(remaining);
          }
        }

        // Update active orders
        const activeOrders = timingService.getActiveOrdersWithTimings();
        setAllActiveOrders(activeOrders);

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing order timing:', error);
        setIsLoading(false);
      }
    };

    initializeAndUpdate();

    // Set up interval to update remaining times
    const interval = setInterval(async () => {
      try {
        if (orderId) {
          const remaining = timingService.getRemainingTime(orderId);
          setRemainingTime(remaining);
        }

        // Update all active orders
        const activeOrders = timingService.getActiveOrdersWithTimings();
        setAllActiveOrders(activeOrders);
      } catch (error) {
        console.error('Error updating order timing:', error);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [orderId]);

  const addOrderToQueue = async (orderId: string, itemCount: number) => {
    try {
      const timing = await timingService.addOrderToQueue(orderId, itemCount);
      setOrderTiming(timing);
      return timing;
    } catch (error) {
      console.error('Error adding order to queue:', error);
      return null;
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    status:
      | 'pending'
      | 'preparing'
      | 'ready'
      | 'completed'
      | 'cancelled'
      | 'delivered'
      | 'confirmed'
  ) => {
    try {
      await timingService.updateOrderStatus(orderId, status);
      const activeOrders = timingService.getActiveOrdersWithTimings();
      setAllActiveOrders(activeOrders);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const formatTime = (minutes: number): string => {
    return timingService.formatTimeDisplay(minutes);
  };

  const getRemainingTime = (orderId: string): number => {
    return timingService.getRemainingTime(orderId);
  };

  return {
    orderTiming,
    remainingTime,
    allActiveOrders,
    isLoading,
    addOrderToQueue,
    updateOrderStatus,
    formatTime,
    getRemainingTime,
  };
};
