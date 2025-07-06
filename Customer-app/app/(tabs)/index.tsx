'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, ShoppingCart, MapPin, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { productService, type Product } from '@/services/productService';
import { formatIndianCurrency } from '@/utils/currency';

export default function HomeScreen() {
  const { user } = useAuth();
  const { items, addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDiscounts, setActiveDiscounts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchActiveDiscounts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const products = await productService.getAllProducts({ limit: 6 });
      console.log('Fetched products:', products);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDiscounts = async () => {
    try {
      const discounts = await productService.getActiveDiscounts();
      setActiveDiscounts(discounts);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      if (!product.inStock || product.stock <= 0) {
        Alert.alert('Sorry', 'This product is currently out of stock.');
        return;
      }

      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image:
          product.imageUrl ||
          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
        category: product.category,
        description: product.description || '',
        isOrganic: product.isOrganic || false,
        ecoFriendly: product.ecoFriendly || false,
        inStock: product.inStock,
        rating: {
          average: product.rating || 4.5,
          count: product.reviews || 0,
        },
        unit: product.unit,
        quantity: 0,
      });

      Alert.alert(
        '✅ Added to Cart!',
        `${product.name} has been added to your cart successfully.`,
        [
          {
            text: 'Continue Shopping',
            style: 'default',
          },
          {
            text: 'View Cart',
            style: 'default',
            onPress: () => {
              console.log('Navigate to cart');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  const cartItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.appName}>GreenMart</Text>
            <Text style={styles.customerName}>Customer V</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <View style={styles.cartContainer}>
                <ShoppingCart size={24} color="#ffffff" />
                {cartItemsCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemsCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your daily groceries..."
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Discounts Banner */}
        {activeDiscounts.length > 0 && (
          <View style={styles.discountBanner}>
            <Text style={styles.discountTitle}>🎉 Special Offers!</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {activeDiscounts.map((discount, index) => (
                <View key={index} style={styles.discountCard}>
                  <Text style={styles.discountPercentage}>
                    {discount.discountPercentage}% OFF
                  </Text>
                  <Text style={styles.discountText}>{discount.title}</Text>
                  {discount.minOrderValue > 0 && (
                    <Text style={styles.discountCondition}>
                      Min Order: ₹{discount.minOrderValue}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#FF6B35' }]}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E74C3C' }]}>
            <Text style={styles.statNumber}>₹250</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#8E44AD' }]}>
            <Text style={styles.statNumber}>500</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#27AE60' }]}>
            <Text style={styles.statNumber}>15.6kg</Text>
            <Text style={styles.statLabel}>CO₂ Saved</Text>
          </View>
        </View>

        {/* Quick Access */}
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity style={styles.quickAccessCard}>
            <Clock size={24} color="#27AE60" />
            <Text style={styles.quickAccessTitle}>Store Hours</Text>
            <Text style={styles.quickAccessSubtitle}>9 AM - 9 PM</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessCard}>
            <View style={styles.quickAccessIcon}>
              <Text style={styles.quickAccessEmoji}>📋</Text>
            </View>
            <Text style={styles.quickAccessTitle}>My Orders</Text>
            <Text style={styles.quickAccessSubtitle}>Track orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessCard}>
            <ShoppingCart size={24} color="#3498DB" />
            <Text style={styles.quickAccessTitle}>Cart</Text>
            <Text style={styles.quickAccessSubtitle}>View items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAccessCard}>
            <MapPin size={24} color="#E74C3C" />
            <Text style={styles.quickAccessTitle}>Locations</Text>
            <Text style={styles.quickAccessSubtitle}>Find stores</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Products */}
        <View style={styles.featuredHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#27AE60" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : featuredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchFeaturedProducts}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsContainer}>
            {featuredProducts.slice(0, 3).map((product) => (
              <View key={product._id} style={styles.productCard}>
                <Image
                  source={{
                    uri:
                      product.imageUrl ||
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop',
                  }}
                  style={styles.productImage}
                />
                {product.discountPercentage &&
                  product.discountPercentage > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        {product.discountPercentage}% OFF
                      </Text>
                    </View>
                  )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>
                      {formatIndianCurrency(product.price)}
                    </Text>
                    {product.originalPrice &&
                      product.originalPrice > product.price && (
                        <Text style={styles.originalPrice}>
                          {formatIndianCurrency(product.originalPrice)}
                        </Text>
                      )}
                    <Text style={styles.productUnit}>/{product.unit}</Text>
                  </View>
                  <Text style={styles.stockInfo}>Stock: {product.stock}</Text>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      !product.inStock && styles.addButtonDisabled,
                    ]}
                    onPress={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                  >
                    <Text style={styles.addButtonText}>
                      {product.inStock ? 'Add' : 'Out of Stock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Impact Section */}
        <View style={styles.impactSection}>
          <Text style={styles.impactTitle}>🌱 Your Eco Impact This Month</Text>
          <View style={styles.impactStats}>
            <View style={styles.impactStat}>
              <Text style={styles.impactNumber}>15</Text>
              <Text style={styles.impactLabel}>Plastic bags saved</Text>
            </View>
            <View style={styles.impactStat}>
              <Text style={styles.impactNumber}>2.3kg</Text>
              <Text style={styles.impactLabel}>Carbon footprint</Text>
            </View>
            <View style={styles.impactStat}>
              <Text style={styles.impactNumber}>8</Text>
              <Text style={styles.impactLabel}>Trees planted</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  customerName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  cartContainer: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  discountBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  discountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 12,
  },
  discountCard: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  discountPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  discountText: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 4,
  },
  discountCondition: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  quickAccessCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  quickAccessIcon: {
    marginBottom: 8,
  },
  quickAccessEmoji: {
    fontSize: 24,
  },
  quickAccessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  quickAccessSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  productsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#F5F5F5',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 4,
  },
  productUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#27AE60',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  impactSection: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  impactStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  impactStat: {
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  learnMoreButton: {
    alignSelf: 'center',
  },
  learnMoreText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
});
