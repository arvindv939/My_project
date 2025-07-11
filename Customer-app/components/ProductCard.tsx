import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Heart, Plus, Star, Leaf, Minus } from 'lucide-react-native';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/types';
import { formatIndianCurrency } from '@/utils/currency';
import { useWishlist } from '@/contexts/WishlistContext';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export const ProductCard = ({ product, onPress }: ProductCardProps) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    try {
      // Double check stock before adding
      if (!product.inStock) {
        Alert.alert('Sorry', 'This product is currently out of stock.');
        return;
      }

      if (quantity === 0) {
        addToCart(product);
      } else {
        updateQuantity(product.id, quantity + 1);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    } else {
      removeFromCart(product.id);
    }
  };

  // Determine if product is in stock based on available properties
  const isInStock = product.inStock === true;

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        unit: product.unit,
        quantity: 1,
        // These are the missing fields—add them from `product`
        category: product.category,
        description: product.description || '',
        isOrganic: product.isOrganic || false,
        ecoFriendly: product.ecoFriendly || false,
        rating: product.rating,
        inStock: product.inStock,
        originalPrice: product.originalPrice,
      });
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              product.image ||
              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
          }}
          style={styles.image}
          resizeMode="cover"
          defaultSource={{
            uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
          }}
        />

        {/* Stock indicator */}
        {!isInStock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {/* Badges */}
        <View style={styles.badges}>
          {product.isOrganic && (
            <View style={styles.organicBadge}>
              <Leaf size={12} color="#ffffff" />
              <Text style={styles.badgeText}>Organic</Text>
            </View>
          )}
          {product.ecoFriendly && (
            <View style={styles.ecoBadge}>
              <Text style={styles.badgeText}>Eco</Text>
            </View>
          )}
        </View>

        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleWishlistToggle}
        >
          <Heart
            size={16}
            color={isInWishlist(product.id) ? '#EF4444' : '#6B7280'}
            fill={isInWishlist(product.id) ? '#EF4444' : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleWishlistToggle}
        >
          <Heart
            size={16}
            color={isInWishlist(product.id) ? '#EF4444' : '#6B7280'}
            fill={isInWishlist(product.id) ? '#EF4444' : 'none'}
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )}
              % OFF
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Stock info */}
        {product.inStock !== undefined && (
          <Text style={styles.stockText}>
            Stock: {product.inStock} {product.unit}
          </Text>
        )}

        {/* Rating */}
        {product.rating && (
          <View style={styles.ratingContainer}>
            <Star size={14} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>
              {product.rating.average &&
              typeof product.rating.average === 'number'
                ? product.rating.average.toFixed(1)
                : '4.5'}{' '}
              ({product.rating.count || 0})
            </Text>
          </View>
        )}

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatIndianCurrency(product.price)}
              {product.unit && <Text style={styles.unit}>/{product.unit}</Text>}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatIndianCurrency(product.originalPrice)}
              </Text>
            )}
          </View>
        </View>

        {/* Add to Cart Button */}
        {isInStock ? (
          quantity > 0 ? (
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={handleDecrement}
                style={styles.quantityButton}
              >
                <Minus size={16} color="#16A34A" />
              </TouchableOpacity>

              <Text style={styles.quantity}>{quantity}</Text>

              <TouchableOpacity
                onPress={handleAddToCart}
                style={styles.quantityButton}
              >
                <Plus size={16} color="#16A34A" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddToCart}
            >
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.outOfStockButton}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#F3F4F6',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badges: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  organicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  ecoBadge: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
  },
  discountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  content: {
    padding: 12,
  },
  category: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#27AE60',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 2,
    lineHeight: 20,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#27AE60',
  },
  unit: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  originalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  outOfStockButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
