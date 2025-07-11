'use client';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { formatIndianCurrency } from '@/utils/currency';

export default function WishlistScreen() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (item: any) => {
    try {
      if (!item.inStock) {
        Alert.alert('Sorry', 'This product is currently out of stock.');
        return;
      }

      addToCart(item);
      Alert.alert(
        '✅ Added to Cart!',
        `${item.name} has been added to your cart successfully.`,
        [
          {
            text: 'Continue',
            style: 'default',
          },
          {
            text: 'Remove from Wishlist',
            style: 'destructive',
            onPress: () => removeFromWishlist(item.id),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleRemoveFromWishlist = (item: any) => {
    Alert.alert(
      'Remove from Wishlist',
      `Are you sure you want to remove ${item.name} from your wishlist?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromWishlist(item.id),
        },
      ]
    );
  };

  const handleClearWishlist = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all items from your wishlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearWishlist,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Wishlist</Text>
            <Text style={styles.headerSubtitle}>
              {items.length} {items.length === 1 ? 'item' : 'items'} saved for
              later
            </Text>
          </View>
          {items.length > 0 && (
            <TouchableOpacity
              onPress={handleClearWishlist}
              style={styles.clearButton}
            >
              <Trash2 size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
            <Text style={styles.emptySubtitle}>
              Add products you love to your wishlist and shop them later!
            </Text>
          </View>
        ) : (
          <View style={styles.itemsContainer}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>
                      {formatIndianCurrency(item.price)}
                    </Text>
                    <Text style={styles.itemUnit}>/{item.unit}</Text>
                  </View>

                  {item.isOrganic && (
                    <View style={styles.organicBadge}>
                      <Text style={styles.organicText}>🌱 Organic</Text>
                    </View>
                  )}

                  <View style={styles.stockInfo}>
                    <Text
                      style={[
                        styles.stockText,
                        !item.inStock && styles.outOfStock,
                      ]}
                    >
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.addToCartButton,
                      !item.inStock && styles.disabledButton,
                    ]}
                    onPress={() => handleAddToCart(item)}
                    disabled={!item.inStock}
                  >
                    <ShoppingCart size={16} color="#ffffff" />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFromWishlist(item)}
                  >
                    <Heart size={16} color="#E74C3C" fill="#E74C3C" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Eco Tip */}
        {items.length > 0 && (
          <View style={styles.ecoTip}>
            <Text style={styles.ecoTipText}>
              💡 Tip: Add items to your wishlist to track price changes and
              availability!
            </Text>
          </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  itemsContainer: {
    padding: 20,
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  itemUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  organicBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  organicText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600',
  },
  stockInfo: {
    marginBottom: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
  },
  outOfStock: {
    color: '#E74C3C',
  },
  actionButtons: {
    alignItems: 'center',
    gap: 8,
  },
  addToCartButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disabledButton: {
    backgroundColor: '#BDC3C7',
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 8,
  },
  ecoTip: {
    backgroundColor: '#F0FDF4',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ecoTipText: {
    fontSize: 14,
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 20,
  },
});
