'use client';

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Smartphone,
  Store,
  QrCode,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  ShoppingCart,
  Wifi,
  WifiOff,
  CheckCircle,
} from 'lucide-react-native';

export default function ShoppingModesScreen() {
  const [selectedMode, setSelectedMode] = useState<'online' | 'offline' | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(true);

  const onlineModeFeatures = [
    {
      icon: <Smartphone size={24} color="#3B82F6" />,
      title: 'Browse Catalog',
      description:
        'View all products with detailed information, reviews, and availability',
    },
    {
      icon: <ShoppingCart size={24} color="#3B82F6" />,
      title: 'Add to Cart',
      description: 'Build your shopping list and save for later',
    },
    {
      icon: <CreditCard size={24} color="#3B82F6" />,
      title: 'Digital Payment',
      description: 'Pay securely with UPI, cards, or digital wallets',
    },
    {
      icon: <Truck size={24} color="#3B82F6" />,
      title: 'Home Delivery',
      description: 'Get products delivered to your doorstep',
    },
    {
      icon: <Clock size={24} color="#3B82F6" />,
      title: 'Schedule Orders',
      description: 'Plan your shopping for convenient delivery times',
    },
  ];

  const offlineModeFeatures = [
    {
      icon: <Store size={24} color="#27AE60" />,
      title: 'In-Store Shopping',
      description: 'Visit our physical store and browse products in person',
    },
    {
      icon: <QrCode size={24} color="#27AE60" />,
      title: 'QR Code Scanning',
      description: 'Scan product QR codes for instant information and reviews',
    },
    {
      icon: <MapPin size={24} color="#27AE60" />,
      title: 'Store Pickup',
      description: 'Order online and collect from store at your convenience',
    },
    {
      icon: <CheckCircle size={24} color="#27AE60" />,
      title: 'Instant Checkout',
      description: 'Quick checkout with mobile app or at store counter',
    },
    {
      icon: <CreditCard size={24} color="#27AE60" />,
      title: 'Flexible Payment',
      description: 'Pay with cash, cards, or digital methods',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Modes</Text>
        <Text style={styles.headerSubtitle}>
          Choose how you want to shop with GreenMart
        </Text>

        <View style={styles.connectionStatus}>
          {isConnected ? (
            <View style={styles.onlineStatus}>
              <Wifi size={16} color="#10B981" />
              <Text style={styles.statusText}>Online</Text>
            </View>
          ) : (
            <View style={styles.offlineStatus}>
              <WifiOff size={16} color="#EF4444" />
              <Text style={styles.statusText}>Offline</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Selection */}
        <View style={styles.modeSelection}>
          <TouchableOpacity
            style={[
              styles.modeCard,
              selectedMode === 'online' && styles.modeCardSelected,
            ]}
            onPress={() => setSelectedMode('online')}
          >
            <LinearGradient
              colors={
                selectedMode === 'online'
                  ? ['#3B82F6', '#1D4ED8']
                  : ['#F8FAFC', '#F1F5F9']
              }
              style={styles.modeGradient}
            >
              <Smartphone
                size={32}
                color={selectedMode === 'online' ? '#ffffff' : '#3B82F6'}
              />
              <Text
                style={[
                  styles.modeTitle,
                  selectedMode === 'online' && styles.modeTitleSelected,
                ]}
              >
                Online Shopping
              </Text>
              <Text
                style={[
                  styles.modeSubtitle,
                  selectedMode === 'online' && styles.modeSubtitleSelected,
                ]}
              >
                Shop from anywhere, anytime
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeCard,
              selectedMode === 'offline' && styles.modeCardSelected,
            ]}
            onPress={() => setSelectedMode('offline')}
          >
            <LinearGradient
              colors={
                selectedMode === 'offline'
                  ? ['#27AE60', '#16A085']
                  : ['#F8FAFC', '#F1F5F9']
              }
              style={styles.modeGradient}
            >
              <Store
                size={32}
                color={selectedMode === 'offline' ? '#ffffff' : '#27AE60'}
              />
              <Text
                style={[
                  styles.modeTitle,
                  selectedMode === 'offline' && styles.modeTitleSelected,
                ]}
              >
                In-Store Shopping
              </Text>
              <Text
                style={[
                  styles.modeSubtitle,
                  selectedMode === 'offline' && styles.modeSubtitleSelected,
                ]}
              >
                Visit our physical store
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Online Mode Features */}
        {selectedMode === 'online' && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>
              🌐 Online Shopping Features
            </Text>
            {onlineModeFeatures.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>{feature.icon}</View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>
                How Online Shopping Works:
              </Text>
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Browse products in the app
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>Add items to your cart</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Choose delivery or pickup</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>Pay securely online</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>5</Text>
                  </View>
                  <Text style={styles.stepText}>Receive your order</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Offline Mode Features */}
        {selectedMode === 'offline' && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>
              🏪 In-Store Shopping Features
            </Text>
            {offlineModeFeatures.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>{feature.icon}</View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.howItWorks}>
              <Text style={styles.howItWorksTitle}>
                How In-Store Shopping Works:
              </Text>
              <View style={styles.stepContainer}>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Visit our physical store</Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Browse products or scan QR codes
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Add items to physical cart or app
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={styles.stepText}>
                    Checkout at counter or via app
                  </Text>
                </View>
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>5</Text>
                  </View>
                  <Text style={styles.stepText}>Take your items home</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Hybrid Shopping Benefits */}
        <View style={styles.hybridSection}>
          <Text style={styles.hybridTitle}>🔄 Best of Both Worlds</Text>
          <Text style={styles.hybridSubtitle}>
            Combine online and offline shopping for the ultimate experience
          </Text>

          <View style={styles.hybridFeatures}>
            <View style={styles.hybridFeature}>
              <Text style={styles.hybridFeatureIcon}>📱</Text>
              <Text style={styles.hybridFeatureText}>
                Order online, pickup in-store
              </Text>
            </View>
            <View style={styles.hybridFeature}>
              <Text style={styles.hybridFeatureIcon}>🛒</Text>
              <Text style={styles.hybridFeatureText}>
                Scan products in-store, order for delivery
              </Text>
            </View>
            <View style={styles.hybridFeature}>
              <Text style={styles.hybridFeatureIcon}>💳</Text>
              <Text style={styles.hybridFeatureText}>
                Unified payment across all channels
              </Text>
            </View>
            <View style={styles.hybridFeature}>
              <Text style={styles.hybridFeatureIcon}>🎯</Text>
              <Text style={styles.hybridFeatureText}>
                Personalized recommendations everywhere
              </Text>
            </View>
          </View>
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
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  connectionStatus: {
    alignSelf: 'flex-start',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  offlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  modeSelection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  modeCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modeCardSelected: {
    elevation: 8,
    shadowOpacity: 0.2,
  },
  modeGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    textAlign: 'center',
  },
  modeTitleSelected: {
    color: '#ffffff',
  },
  modeSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  modeSubtitleSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  featuresContainer: {
    padding: 20,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  howItWorks: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  howItWorksTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepContainer: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  hybridSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  hybridTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  hybridSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  hybridFeatures: {
    gap: 16,
  },
  hybridFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  hybridFeatureIcon: {
    fontSize: 24,
  },
  hybridFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});
