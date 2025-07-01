'use client';

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Leaf,
  ShoppingBag,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, isLoading } = useAuth();

  // Animation values
  const logoScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    // Breathing animation for logo
    logoScale.value = withRepeat(withTiming(1.1, { duration: 2000 }), -1, true);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Please check your credentials and try again.'
      );
    }
  };

  return (
    <LinearGradient
      colors={['#10B981', '#059669', '#047857']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Animated Background Elements */}
            <View style={styles.backgroundElements}>
              <Animated.View
                entering={BounceIn.delay(200)}
                style={[styles.floatingElement, styles.element1]}
              >
                <ShoppingBag size={24} color="rgba(255,255,255,0.1)" />
              </Animated.View>
              <Animated.View
                entering={BounceIn.delay(400)}
                style={[styles.floatingElement, styles.element2]}
              >
                <Leaf size={32} color="rgba(255,255,255,0.1)" />
              </Animated.View>
              <Animated.View
                entering={BounceIn.delay(600)}
                style={[styles.floatingElement, styles.element3]}
              >
                <ShoppingBag size={20} color="rgba(255,255,255,0.1)" />
              </Animated.View>
            </View>

            {/* Header */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.header}>
              <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
                <View style={styles.logoBackground}>
                  <Leaf size={40} color="#10B981" />
                </View>
                <Text style={styles.logoText}>Green Mart</Text>
              </Animated.View>
              <Text style={styles.subtitle}>
                Welcome back to sustainable shopping!
              </Text>
              <Text style={styles.description}>
                Sign in to continue your eco-friendly journey
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
              entering={FadeInDown.delay(500)}
              style={styles.formContainer}
            >
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.email && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Mail size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.email}
                    </Animated.Text>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.password && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.password && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.password}
                    </Animated.Text>
                  )}
                </View>

                <Animated.View style={buttonAnimatedStyle}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isLoading && styles.loginButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706', '#B45309']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.loginButtonText}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <Link href="/(auth)/register" style={styles.signupLink}>
                    <Text style={styles.signupLinkText}>Sign Up</Text>
                  </Link>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInUp.delay(700)} style={styles.footer}>
              <Text style={styles.footerText}>
                🌱 Join thousands of eco-conscious shoppers
              </Text>
              <Text style={styles.footerSubtext}>
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    minHeight: height,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
  },
  element1: {
    top: height * 0.1,
    right: width * 0.1,
  },
  element2: {
    top: height * 0.3,
    left: width * 0.05,
  },
  element3: {
    bottom: height * 0.2,
    right: width * 0.15,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 32,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 56,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIconContainer: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'Inter-Regular',
    paddingVertical: 16,
    paddingRight: 16,
  },
  eyeIcon: {
    width: 48,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    marginHorizontal: 16,
    fontFamily: 'Inter-Regular',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  signupLink: {
    marginLeft: 4,
  },
  signupLinkText: {
    color: '#10B981',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  footerSubtext: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
});
