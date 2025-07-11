import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Button,
} from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import { formatIndianCurrency } from '@/utils/currency';
import AutoReorderModal from './AutoReorderModal';

interface CartItemProps {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    quantity: number;
    unit?: string;
  };
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();
  const [showAutoModal, setShowAutoModal] = useState(false);

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    } else {
      handleRemove();
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Item', `Remove ${item.name} from cart?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFromCart(item.id),
      },
    ]);
  };

  const totalPrice = item.price * item.quantity;

  return (
    <View style={styles.container}>
      <Image
        source={{
          uri:
            item.image ||
            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
        }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={handleRemove} style={styles.removeButton}>
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.unitPrice}>
            {formatIndianCurrency(item.price)}
            {item.unit && <Text style={styles.unit}>/{item.unit}</Text>}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={[styles.quantityButton, styles.decrementButton]}
            >
              <Minus size={16} color="#16A34A" />
            </TouchableOpacity>

            <Text style={styles.quantity}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={handleIncrement}
              style={[styles.quantityButton, styles.incrementButton]}
            >
              <Plus size={16} color="#16A34A" />
            </TouchableOpacity>
          </View>

          <Text style={styles.totalPrice}>
            {formatIndianCurrency(totalPrice)}
          </Text>
        </View>

        {/* Auto reorder button/modal here */}
        <View style={{ marginTop: 10 }}>
          <Button
            title="Set Auto Reorder"
            color="#16A34A"
            onPress={() => setShowAutoModal(true)}
          />
        </View>
        <AutoReorderModal
          visible={showAutoModal}
          onClose={() => setShowAutoModal(false)}
          orderTemplate={{
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            unit: item.unit,
            image: item.image,
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textTransform: 'capitalize',
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  priceContainer: {
    marginBottom: 8,
  },
  unitPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  unit: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
  },
  decrementButton: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  incrementButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16A34A',
  },
});
