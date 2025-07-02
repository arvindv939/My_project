'use client';

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, CheckCircle } from 'lucide-react-native';

interface LiveTimerProps {
  orderId: string;
  estimatedTime: number; // in minutes
  status: string;
  itemCount: number;
}

export default function LiveTimer({
  orderId,
  estimatedTime,
  status,
  itemCount,
}: LiveTimerProps) {
  const [remainingTime, setRemainingTime] = useState(estimatedTime);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'delivered' || status === 'ready') {
      setIsReady(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          setIsReady(true);
        }
        return newTime;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (minutes: number): string => {
    if (minutes <= 0) return 'Ready!';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTimerColor = () => {
    if (isReady || status === 'ready' || status === 'delivered') {
      return '#27AE60'; // Green
    }
    if (remainingTime <= 2) {
      return '#F39C12'; // Orange
    }
    return '#3498DB'; // Blue
  };

  const getStatusText = () => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup!';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Processing';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerHeader}>
        <View style={styles.statusContainer}>
          {isReady || status === 'ready' ? (
            <CheckCircle size={16} color="#27AE60" />
          ) : (
            <Clock size={16} color={getTimerColor()} />
          )}
          <Text style={[styles.statusText, { color: getTimerColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        <Text style={styles.itemCount}>{itemCount} items</Text>
      </View>

      <View style={styles.timerDisplay}>
        <Text style={[styles.timeText, { color: getTimerColor() }]}>
          {isReady || status === 'ready' ? 'Ready!' : formatTime(remainingTime)}
        </Text>
        {!isReady && status !== 'ready' && (
          <Text style={styles.estimatedText}>Estimated wait time</Text>
        )}
      </View>

      {status === 'preparing' && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(
                  10,
                  100 - (remainingTime / estimatedTime) * 100
                )}%`,
                backgroundColor: getTimerColor(),
              },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  estimatedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
