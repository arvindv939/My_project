'use client';

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Filter, Grid3x3, List, Leaf } from 'lucide-react-native';
import { ProductCard } from './ProductCard';
import { CategoryCard } from './CategoryCard';
import { mockProducts, mockCategories } from '@/data/mockData';
import type { Product } from '@/types';

const { width } = Dimensions.get('window');

interface AnimatedCatalogProps {
  searchQuery?: string;
  selectedCategory?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
}

export const AnimatedCatalog = ({
  searchQuery = '',
  selectedCategory = null,
  onCategorySelect,
}: AnimatedCatalogProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating'>('name');
  const [filteredProducts, setFilteredProducts] =
    useState<Product[]>(mockProducts);

  useEffect(() => {
    // Filter products based on search and category
    let filtered = mockProducts;

    if (searchQuery) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'rating':
          return (b.rating?.average ?? 0) - (a.rating?.average ?? 0);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, sortBy]);

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const switchViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const renderGridView = () => (
    <View style={styles.gridContainer}>
      {filteredProducts.map((product) => (
        <View key={product.id} style={styles.gridItem}>
          <ProductCard product={product} />
        </View>
      ))}
    </View>
  );

  const renderListView = () => (
    <View style={styles.listContainer}>
      {filteredProducts.map((product) => (
        <View key={product.id} style={styles.listItem}>
          <ProductCard product={product} />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.resultCount}>
            {filteredProducts.length} products
          </Text>
          {selectedCategory && (
            <TouchableOpacity
              style={styles.clearFilter}
              onPress={() => onCategorySelect?.(null)}
            >
              <Text style={styles.clearFilterText}>Clear filter</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'grid' && styles.viewButtonActive,
            ]}
            onPress={() => switchViewMode('grid')}
          >
            <Grid3x3
              size={16}
              color={viewMode === 'grid' ? '#ffffff' : '#6B7280'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewButton,
              viewMode === 'list' && styles.viewButtonActive,
            ]}
            onPress={() => switchViewMode('list')}
          >
            <List
              size={16}
              color={viewMode === 'list' ? '#ffffff' : '#6B7280'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
            <Filter size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterContent}>
            <Text style={styles.filterTitle}>Sort by:</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'name', label: 'Name' },
                { key: 'price', label: 'Price' },
                { key: 'rating', label: 'Rating' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.key && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Categories Horizontal Scroll */}
      {!selectedCategory && (
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {mockCategories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <TouchableOpacity
                  onPress={() => onCategorySelect?.(category.id)}
                >
                  <CategoryCard category={category} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products */}
      <ScrollView
        style={styles.productsContainer}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'grid' ? renderGridView() : renderListView()}

        {/* Eco-friendly tip */}
        <View style={styles.ecoTip}>
          <Leaf size={20} color="#16A34A" />
          <Text style={styles.ecoTipText}>
            🌱 Choose organic products to support sustainable farming
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  resultCount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  clearFilter: {
    marginTop: 4,
  },
  clearFilterText: {
    fontSize: 12,
    color: '#16A34A',
    fontFamily: 'Inter-Regular',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewButtonActive: {
    backgroundColor: '#16A34A',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  filterPanel: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    height: 120,
  },
  filterContent: {
    padding: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  sortOptionActive: {
    backgroundColor: '#16A34A',
  },
  sortOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  sortOptionTextActive: {
    color: '#ffffff',
  },
  categoriesSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    marginRight: 12,
  },
  productsContainer: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  gridItem: {
    width: (width - 56) / 2, // Account for padding and gap
  },
  listContainer: {
    padding: 20,
    gap: 12,
  },
  listItem: {
    width: '100%',
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
  },
});
