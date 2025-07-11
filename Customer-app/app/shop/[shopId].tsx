import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ShopProducts() {
  const { shopId } = useLocalSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://your-api.com/api/products/by-shop/${shopId}`
        );
        if (response.ok) {
          const products = await response.json();
          setProducts(products);

          // Cache for offline
          await AsyncStorage.setItem(
            `products-${shopId}`,
            JSON.stringify({ products })
          );
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback to cache
        const cached = await AsyncStorage.getItem(`products-${shopId}`);
        if (cached) {
          setProducts(JSON.parse(cached).products);
        } else {
          alert('No cached products available.');
        }
      }
      setLoading(false);
    };
    fetchProducts();
  }, [shopId]);

  if (loading)
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  if (!products.length)
    return <Text style={{ padding: 16 }}>No products found.</Text>;

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <View
          style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}
        >
          <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
          <Text>Price: ₹{item.primaryUnit?.price}</Text>
        </View>
      )}
    />
  );
}
