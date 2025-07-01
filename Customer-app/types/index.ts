export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ecoPreferences: {
    reusablePackaging: boolean;
    carbonNeutralDelivery: boolean;
    organicPreference: boolean;
  };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  isOrganic: boolean;
  ecoFriendly: boolean;
  inStock: boolean;
  rating: {
    average: number;
    count: number;
  };
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
  pickupToken?: string;
  qrCode?: string;
  paymentMethod: string;
  address: string;
  ecoPackaging: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
  productCount: number;
}