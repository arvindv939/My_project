"use client"

import { useState, useEffect } from "react"
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
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Search, Plus, Minus } from "lucide-react-native"
import { useCart } from "@/contexts/CartContext"
import { productService, type Product } from "@/services/productService"
import { formatIndianCurrency } from "@/utils/currency"

const categories = [
  { id: "all", name: "All Products", emoji: "🛒" },
  { id: "Vegetables", name: "Vegetables", emoji: "🥬" },
  { id: "Fruits", name: "Fresh Fruits", emoji: "🍎" },
  { id: "Dairy", name: "Dairy & Eggs", emoji: "🥛" },
  { id: "Bakery", name: "Grains & Cereals", emoji: "🌾" },
  { id: "Snacks", name: "Organic", emoji: "🌱" },
  { id: "Beverages", name: "Beverages", emoji: "🥤" },
]

export default function CategoriesScreen() {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart()
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const filters = selectedCategory === "all" ? {} : { category: selectedCategory }
      const fetchedProducts = await productService.getAllProducts(filters)
      console.log("Categories: Fetched products:", fetchedProducts)
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Error fetching products:", error)
      Alert.alert("Error", "Failed to load products. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getCartQuantity = (productId: string) => {
    const cartItem = items.find((item) => item.id === productId)
    return cartItem?.quantity || 0
  }

  const handleAddToCart = (product: Product) => {
    const quantity = getCartQuantity(product._id)

    if (!product.inStock || product.stock <= 0) {
      Alert.alert("Sorry", "This product is currently out of stock.")
      return
    }

    if (quantity === 0) {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
        unit: product.unit ?? "",
        category: product.category ?? "",
        description: product.description ?? "",
        isOrganic: product.isOrganic ?? false,
        ecoFriendly: product.ecoFriendly ?? false,
        inStock: product.inStock ?? false,
        rating: typeof product.rating === "object"
          ? product.rating
          : { average: Number(product.rating) || 0, count: 0 },
      })
    } else {
      updateQuantity(product._id, quantity + 1)
    }
  }

  const handleDecrement = (productId: string) => {
    const quantity = getCartQuantity(productId)
    if (quantity > 1) {
      updateQuantity(productId, quantity - 1)
    } else {
      removeFromCart(productId)
    }
  }

  const ProductCard = ({ product }: { product: Product }) => {
    const quantity = getCartQuantity(product._id)
    const canAddToCart = product.inStock && product.stock > 0

    return (
      <View style={styles.productCard}>
        <Image
          source={{
            uri: product.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop",
          }}
          style={styles.productImage}
          resizeMode="cover"
        />

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <Text style={styles.productCategory}>{product.category}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatIndianCurrency(product.price)}</Text>
            <Text style={styles.productUnit}>/{product.unit}</Text>
          </View>

          <Text style={[styles.stockText, !canAddToCart && styles.outOfStockText]}>
            {canAddToCart ? `${product.stock} in stock` : "Out of stock"}
          </Text>

          {canAddToCart ? (
            quantity > 0 ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => handleDecrement(product._id)} style={styles.quantityButton}>
                  <Minus size={16} color="#16A34A" />
                </TouchableOpacity>

                <Text style={styles.quantity}>{quantity}</Text>

                <TouchableOpacity onPress={() => handleAddToCart(product)} style={styles.quantityButton}>
                  <Plus size={16} color="#16A34A" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => handleAddToCart(product)} style={styles.addButton}>
                <Plus size={16} color="#ffffff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )
          ) : (
            <View style={styles.unavailableButton}>
              <Text style={styles.unavailableText}>Unavailable</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse Products</Text>
        <Text style={styles.subtitle}>Discover fresh, organic, and eco-friendly products</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, selectedCategory === category.id && styles.selectedCategory]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text style={[styles.categoryName, selectedCategory === category.id && styles.selectedCategoryName]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products */}
      <ScrollView style={styles.productsContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </View>
        )}

        {/* Eco-friendly message */}
        <View style={styles.ecoMessage}>
          <Text style={styles.ecoText}>
            🌱 Choose organic and locally sourced products to reduce your carbon footprint
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    backgroundColor: "#8B5CF6",
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  selectedCategoryName: {
    color: "#ffffff",
  },
  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#F5F5F5",
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  productCategory: {
    fontSize: 12,
    color: "#8B5CF6",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A34A",
  },
  productUnit: {
    fontSize: 12,
    color: "#666",
    marginLeft: 2,
  },
  stockText: {
    fontSize: 12,
    color: "#16A34A",
    marginBottom: 8,
  },
  outOfStockText: {
    color: "#EF4444",
  },
  addButton: {
    backgroundColor: "#16A34A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  quantityButton: {
    padding: 8,
    borderRadius: 6,
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16A34A",
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: "center",
  },
  unavailableButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  unavailableText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },
  ecoMessage: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  ecoText: {
    fontSize: 14,
    color: "#16A34A",
    textAlign: "center",
    lineHeight: 20,
  },
})
