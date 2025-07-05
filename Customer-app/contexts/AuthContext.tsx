'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '@/utils/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null; // <-- Add this!
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // <-- Add this!
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      if (storedToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(storedToken); // <-- Set token here!
        setIsAuthenticated(true);
        console.log('User already authenticated:', parsedUser.email);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('Attempting login for:', email);

    try {
      const response = await API.post('/auth/login', {
        email: email.toLowerCase().trim(),
        password,
      });

      console.log('Login response:', response.data);

      if (response.data.token && response.data.user) {
        const { token: receivedToken, user: userData } = response.data;

        // Store token and user data
        await AsyncStorage.setItem('authToken', receivedToken);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        // Transform backend user data to match our User interface
        const transformedUser: User = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone || '',
          address: userData.address || '',
          ecoPreferences: {
            reusablePackaging: true,
            carbonNeutralDelivery: false,
            organicPreference: false,
          },
        };

        setUser(transformedUser);
        setToken(receivedToken); // <-- Set token after login!
        setIsAuthenticated(true);
        console.log('Login successful for:', transformedUser.email);
        return true;
      } else {
        console.error('Invalid response format:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);

      // Show specific error message
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 400) {
        throw new Error('Invalid email or password');
      } else if (
        error.code === 'NETWORK_ERROR' ||
        error.message.includes('Network Error')
      ) {
        throw new Error(
          'Network error. Please check your internet connection and backend server.'
        );
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    console.log('Attempting registration for:', userData.email);

    try {
      const registerPayload = {
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        phone: userData.phone.trim(),
        address: userData.address.trim(),
        role: 'Customer',
      };

      console.log('Registration payload:', registerPayload);

      const response = await API.post('/auth/register', registerPayload);
      console.log('Registration response:', response.data);

      if (response.data.message === 'User registered successfully') {
        console.log('Registration successful, attempting auto-login...');
        // Auto-login after successful registration
        return await login(userData.email, userData.password);
      } else {
        console.error('Unexpected registration response:', response.data);
        return false;
      }
    } catch (error: any) {
      console.error(
        'Registration error:',
        error.response?.data || error.message
      );

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.response?.status === 400) {
        throw new Error(
          'User with this email already exists or invalid data provided'
        );
      } else if (
        error.code === 'NETWORK_ERROR' ||
        error.message.includes('Network Error')
      ) {
        throw new Error(
          'Network error. Please check your internet connection and backend server.'
        );
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setToken(null); // <-- Remove token on logout!
      setIsAuthenticated(false);
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
        token, // <-- Provide token in context!
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
