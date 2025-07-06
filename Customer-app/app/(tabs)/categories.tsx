'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Leaf } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProductCard } from '@/components/ProductCard';
import {
  productService,
  type Product,
  type ProductFilters,
} from '@/services/productService';

const categories = [
  { id: 'Fruits', name: 'Fresh Fruits', icon: '🍎', color: '#EF4444' },
  { id: 'Vegetables', name: 'Vegetables', icon: '🥬', color: '#10B981' },
  { id: 'Dairy', name: 'Dairy & Eggs', icon: '🥛', color: '#27AE60' },
  { id: 'Bakery', name: 'Bakery', icon: '🍞', color: '#F59E0B' },
  { id: 'Snacks', name: 'Snacks', icon: '🍿', color: '#16A34A' },
  { id: 'Beverages', name: 'Beverages', icon: '🧃', color: '#2ECC71' },
  { id: 'Staples', name: 'Staples', icon: '🌾', color: '#F59E0B' },
  { id: 'Household', name: 'Household', icon: '🧽', color: '#6B7280' },
  { id: 'Personal Care', name: 'Personal Care', icon: '🧴', color: '#EC4899' },
  { id: 'Others', name: 'Others', icon: '📦', color: '#64748B' },
];

export default function CategoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productFilters: ProductFilters = {
        ...filters,
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      };

      console.log(
        'Categories: Fetching products with filters:',
        productFilters
      );

      const fetchedProducts = await productService.getAllProducts(
        productFilters
      );
      console.log('Categories: Fetched products:', fetchedProducts.length);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Categories: Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        const searchResults = await productService.searchProducts(searchQuery);
        setProducts(searchResults);
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        setLoading(false);
      }
    } else {
      fetchProducts();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Browse Products</Text>
          <Text style={styles.headerSubtitle}>
            Discover fresh, organic, and eco-friendly products
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleSearch}
                style={styles.searchButton}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryCard,
              !selectedCategory && styles.categoryCardActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={styles.categoryIcon}>🛒</Text>
            <Text
              style={[
                styles.categoryName,
                !selectedCategory && styles.categoryNameActive,
              ]}
            >
              All Products
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardActive,
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category.id ? null : category.id
                )
              }
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      <ScrollView
        style={styles.productsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#27AE60" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search or browse different categories
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {products.map((product) => (
              <View key={product._id} style={styles.productItem}>
                <ProductCard
                  product={{
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice,
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
                  }}
                />
              </View>
            ))}
          </View>
        )}

        {/* Eco Tip */}
        <View style={styles.ecoTip}>
          <Leaf size={20} color="#16A34A" />
          <Text style={styles.ecoTipText}>
            🌱 Choose organic and locally sourced products to reduce your carbon
            footprint
          </Text>
        </View>
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
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  searchContainer: {
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
  },
  searchButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  categoriesSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#27AE60',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textAlign: 'center',
  },
  categoryNameActive: {
    color: '#27AE60',
  },
  productsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  productItem: {
    width: '47%',
  },
  ecoTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  ecoTipText: {
    flex: 1,
    fontSize: 14,
    color: '#15803D',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
