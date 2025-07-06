import { API_BASE_URL } from '@/utils/api';

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  views?: number;
  isActive?: boolean;
  createdBy: string;
  shop?: string;
  inStock: boolean;
  isOrganic?: boolean;
  ecoFriendly?: boolean;
  discountPercentage?: number; // From announcements
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  page?: number;
}

export interface Discount {
  _id: string;
  title: string;
  discountPercentage: number;
  minOrderValue: number;
  expiresAt?: string;
  type: string;
  targetAudience: string;
}

class ProductService {
  private baseUrl = `${API_BASE_URL}/products`;
  private announcementsUrl = `${API_BASE_URL}/announcements`;

  async getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
    try {
      const queryParams = new URLSearchParams();

      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.minPrice)
        queryParams.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice)
        queryParams.append('maxPrice', filters.maxPrice.toString());
      if (filters.inStock !== undefined)
        queryParams.append('inStock', filters.inStock.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());

      const response = await fetch(`${this.baseUrl}/public?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Get active discounts and apply them
      const discounts = await this.getActiveDiscounts();
      const productsWithDiscounts = this.applyDiscounts(data, discounts);

      return Array.isArray(productsWithDiscounts) ? productsWithDiscounts : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    try {
      const response = await fetch(`${this.announcementsUrl}/discounts/active`);

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.discounts || [];
    } catch (error) {
      console.error('Error fetching discounts:', error);
      return [];
    }
  }

  private applyDiscounts(
    products: Product[],
    discounts: Discount[]
  ): Product[] {
    return products.map((product) => {
      // Find applicable discount
      const applicableDiscount = discounts.find((discount) => {
        const now = new Date();
        const expiresAt = discount.expiresAt
          ? new Date(discount.expiresAt)
          : null;

        // Check if discount is still valid
        if (expiresAt && now > expiresAt) {
          return false;
        }

        // For now, apply to all products. You can add more specific logic here
        return (
          discount.targetAudience === 'all' ||
          discount.targetAudience === 'customers'
        );
      });

      if (applicableDiscount && applicableDiscount.discountPercentage > 0) {
        const discountedPrice =
          product.price * (1 - applicableDiscount.discountPercentage / 100);
        return {
          ...product,
          originalPrice: product.price,
          price: discountedPrice,
          discountPercentage: applicableDiscount.discountPercentage,
        };
      }

      return product;
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.getAllProducts({ search: query });
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getAllProducts({ category });
  }

  async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const product = await response.json();

      // Apply discounts to single product
      const discounts = await this.getActiveDiscounts();
      const [productWithDiscount] = this.applyDiscounts([product], discounts);

      return productWithDiscount;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }
}

export const productService = new ProductService();
