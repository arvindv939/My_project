'use client';

import { useState } from 'react';
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
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Leaf,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { register, isLoading } = useAuth();

  // Animation values
  const logoScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // React.useEffect(() => {
  //   logoScale.value = withRepeat(
  //     withTiming(1.05, { duration: 3000 }),
  //     -1,
  //     true
  //   );
  // }, []);

  // const logoAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: logoScale.value }],
  // }));

  // const buttonAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: buttonScale.value }],
  // }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid Indian mobile number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    // buttonScale.value = withSpring(0.95, {}, () => {
    //   buttonScale.value = withSpring(1);
    // });

    try {
      const success = await register(formData);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message ||
          'An error occurred during registration. Please try again.'
      );
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
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
            {/* <View style={styles.backgroundElements}>
              <Animated.View
                entering={BounceIn.delay(200)}
                style={[styles.floatingElement, styles.element1]}
              >
                <Heart size={28} color="rgba(255,255,255,0.1)" />
              </Animated.View>
              <Animated.View
                entering={BounceIn.delay(400)}
                style={[styles.floatingElement, styles.element2]}
              >
                <Star size={24} color="rgba(255,255,255,0.1)" />
              </Animated.View>
              <Animated.View
                entering={BounceIn.delay(600)}
                style={[styles.floatingElement, styles.element3]}
              >
                <Leaf size={36} color="rgba(255,255,255,0.1)" />
              </Animated.View>
            </View> */}

            {/* Header */}
            <Animated.View entering={FadeInUp} style={styles.header}>
              <Animated.View style={[styles.logoContainer]}>
                <View style={styles.logoBackground}>
                  <Leaf size={40} color="#10B981" />
                </View>
                <Text style={styles.logoText}>Green Mart</Text>
              </Animated.View>
              <Text style={styles.subtitle}>Join the Green Revolution!</Text>
              <Text style={styles.description}>
                Create your account and start shopping sustainably
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown} style={styles.formContainer}>
              <View style={styles.form}>
                {/* Name Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.name && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <User size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={formData.name}
                      onChangeText={(value) => updateFormData('name', value)}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.name}
                    </Animated.Text>
                  )}
                </Animated.View>

                {/* Email Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
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
                      placeholder="Email Address"
                      placeholderTextColor="#9CA3AF"
                      value={formData.email}
                      onChangeText={(value) => updateFormData('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
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
                </Animated.View>

                {/* Phone Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.phone && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Phone size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Mobile Number"
                      placeholderTextColor="#9CA3AF"
                      value={formData.phone}
                      onChangeText={(value) => updateFormData('phone', value)}
                      keyboardType="phone-pad"
                    />
                  </View>
                  {errors.phone && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.phone}
                    </Animated.Text>
                  )}
                </Animated.View>

                {/* Address Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.address && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <MapPin size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Address"
                      placeholderTextColor="#9CA3AF"
                      value={formData.address}
                      onChangeText={(value) => updateFormData('address', value)}
                      multiline
                    />
                  </View>
                  {errors.address && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.address}
                    </Animated.Text>
                  )}
                </Animated.View>

                {/* Password Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
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
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      value={formData.password}
                      onChangeText={(value) =>
                        updateFormData('password', value)
                      }
                      secureTextEntry={!showPassword}
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
                </Animated.View>

                {/* Confirm Password Input */}
                <Animated.View
                  entering={SlideInRight}
                  style={styles.inputContainer}
                >
                  <View
                    style={[
                      styles.inputWrapper,
                      errors.confirmPassword && styles.inputError,
                    ]}
                  >
                    <View style={styles.inputIconContainer}>
                      <Lock size={20} color="#10B981" />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#9CA3AF"
                      value={formData.confirmPassword}
                      onChangeText={(value) =>
                        updateFormData('confirmPassword', value)
                      }
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeIcon}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <Animated.Text
                      entering={FadeInDown}
                      style={styles.errorText}
                    >
                      {errors.confirmPassword}
                    </Animated.Text>
                  )}
                </Animated.View>

                <Animated.View entering={FadeInUp}>
                  <TouchableOpacity
                    style={[
                      styles.registerButton,
                      isLoading && styles.registerButtonDisabled,
                    ]}
                    onPress={handleRegister}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706', '#B45309']}
                      style={styles.buttonGradient}
                    >
                      <Text style={styles.registerButtonText}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>
                    Already have an account?{' '}
                  </Text>
                  <Link href="/(auth)/login" style={styles.loginLink}>
                    <Text style={styles.loginLinkText}>Sign In</Text>
                  </Link>
                </View>
              </View>
            </Animated.View>

            {/* Footer */}
            <Animated.View entering={FadeInUp} style={styles.footer}>
              <Text style={styles.footerText}>
                🌱 Join 10,000+ eco-conscious shoppers
              </Text>
              <Text style={styles.footerSubtext}>
                By creating an account, you agree to our Terms of Service and
                Privacy Policy
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
    paddingVertical: 20,
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
    top: height * 0.08,
    right: width * 0.08,
  },
  element2: {
    top: height * 0.25,
    left: width * 0.05,
  },
  element3: {
    bottom: height * 0.15,
    right: width * 0.12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
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
    marginBottom: 16,
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
  registerButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    marginLeft: 4,
  },
  loginLinkText: {
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
