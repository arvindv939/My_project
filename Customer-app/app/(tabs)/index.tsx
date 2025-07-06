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
import {
  Bell,
  Search,
  ShoppingCart,
  MapPin,
  Clock,
  QrCode,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { productService, type Product } from '@/services/productService';
import { formatIndianCurrency } from '@/utils/currency';
import { QRScanner } from '@/components/QRScanner';

export default function HomeScreen() {
  const { user } = useAuth();
  const { items, addToCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
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

  const handleQRScan = async (data: string) => {
    try {
      console.log('QR Code scanned:', data);
      setShowQRScanner(false);

      // Parse QR code data - expecting product ID or product URL
      let productId = '';

      if (data.includes('/product/')) {
        // Extract product ID from URL
        const urlParts = data.split('/product/');
        productId = urlParts[1]?.split('?')[0] || '';
      } else if (data.match(/^[a-fA-F0-9]{24}$/)) {
        // Direct product ID (MongoDB ObjectId format)
        productId = data;
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not recognized as a product code.'
        );
        return;
      }

      if (!productId) {
        Alert.alert(
          'Invalid QR Code',
          'Could not extract product information from QR code.'
        );
        return;
      }

      // Fetch product details
      const product = await productService.getProductById(productId);

      if (product) {
        // Show product details and option to add to cart
        Alert.alert(
          '🛍️ Product Found!',
          `${product.name}\nPrice: ${formatIndianCurrency(product.price)}/${
            product.unit
          }\nStock: ${product.stock} available`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Add to Cart',
              style: 'default',
              onPress: () => handleAddToCart(product),
            },
          ]
        );
      } else {
        Alert.alert(
          'Product Not Found',
          'The scanned product could not be found.'
        );
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      Alert.alert('Error', 'Failed to process QR code. Please try again.');
    }
  };

  const handleAddToCart = (product: Product) => {
    try {
      // Check stock before adding to cart
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

      // Enhanced success notification
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
              // Navigate to cart - you can implement navigation here
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

        {/* QR Scanner Banner - Updated with green theme */}
        <View style={styles.qrScannerBanner}>
          <View style={styles.qrBannerContent}>
            <View style={styles.qrBannerLeft}>
              <View style={styles.qrIconContainer}>
                <QrCode size={32} color="#27AE60" />
              </View>
              <View style={styles.qrBannerText}>
                <Text style={styles.qrBannerTitle}>QR Scanner</Text>
                <Text style={styles.qrBannerSubtitle}>
                  Scan products in-store to add to cart instantly!
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.qrScanButton}
              onPress={() => setShowQRScanner(true)}
            >
              <QrCode size={20} color="#ffffff" />
              <Text style={styles.qrScanButtonText}>Scan</Text>
            </TouchableOpacity>
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
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>
                      {formatIndianCurrency(product.price)}
                    </Text>
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
          <Text style={styles.impactTitle}>🌱Aravind (Pes Univeristy)</Text>
          <View style={styles.impactStats}>
          </View>
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        isVisible={showQRScanner}
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
      />
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
  // QR Scanner Banner Styles - Updated with green theme
  qrScannerBanner: {
    backgroundColor: '#F0F9F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#27AE60',
    shadowColor: '#27AE60',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  qrIconContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 12,
    marginRight: 16,
  },
  qrBannerText: {
    flex: 1,
  },
  qrBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  qrBannerSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  qrScanButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#27AE60',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  qrScanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  productImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#F5F5F5',
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
