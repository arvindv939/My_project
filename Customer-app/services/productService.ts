import API from "@/utils/api"

export interface Product {
  _id: string
  name: string
  category: string
  unit: string
  price: number
  discount?: number
  stock: number
  imageUrl?: string
  description?: string
  createdBy: string
  isActive: boolean
  inStock: boolean
  rating?: number
  reviews?: number
  isOrganic?: boolean
  ecoFriendly?: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductsResponse {
  success: boolean
  products: Product[]
  totalPages: number
  currentPage: number
  total: number
}

export interface ProductResponse {
  success: boolean
  product: Product
}

export interface ProductFilters {
  page?: number
  limit?: number
  category?: string
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

class ProductService {
  private transformProduct(backendProduct: any): Product {
    const stockValue = Number(backendProduct.stock) || 0
    const isActiveValue = backendProduct.isActive !== false
    const inStockValue = stockValue > 0 && isActiveValue

    const product: Product = {
      _id: backendProduct._id || backendProduct.id,
      name: backendProduct.name || "",
      category: backendProduct.category || "General",
      unit: backendProduct.unit || "kg",
      price: Number(backendProduct.price) || 0,
      discount: Number(backendProduct.discount) || 0,
      stock: stockValue,
      imageUrl: backendProduct.imageUrl || backendProduct.image,
      description: backendProduct.description || "",
      createdBy: backendProduct.createdBy || "",
      isActive: isActiveValue,
      inStock: inStockValue,
      rating: Number(backendProduct.rating?.average || backendProduct.rating) || 4.5,
      reviews: Number(backendProduct.rating?.count || backendProduct.reviews) || 0,
      createdAt: backendProduct.createdAt || "",
      updatedAt: backendProduct.updatedAt || "",
    }

    return product
  }

  async getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
    try {
      const params = new URLSearchParams()

      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.category) params.append("category", filters.category)
      if (filters.search) params.append("search", filters.search)
      if (filters.sortBy) params.append("sortBy", filters.sortBy)
      if (filters.sortOrder) params.append("sortOrder", filters.sortOrder)

      const response = await API.get<ProductsResponse>(`/products?${params.toString()}`)

      if (response.data.success) {
        return response.data.products.map((p) => this.transformProduct(p))
      }

      throw new Error("Failed to fetch products")
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const response = await API.get<ProductResponse>(`/products/${id}`)

      if (response.data.success && response.data.product) {
        return this.transformProduct(response.data.product)
      }

      return null
    } catch (error) {
      console.error("Error fetching product by ID:", error)
      throw error
    }
  }

  async getProductsByCategory(category: string, filters: ProductFilters = {}): Promise<Product[]> {
    try {
      const params = new URLSearchParams()

      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())

      const response = await API.get<ProductsResponse>(`/products/category/${category}?${params.toString()}`)

      if (response.data.success) {
        return response.data.products.map((p) => this.transformProduct(p))
      }

      throw new Error("Failed to fetch products by category")
    } catch (error) {
      console.error("Error fetching products by category:", error)
      throw error
    }
  }

  async searchProducts(query: string, filters: ProductFilters = {}): Promise<Product[]> {
    try {
      const params = new URLSearchParams()
      params.append("q", query)

      if (filters.page) params.append("page", filters.page.toString())
      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.category) params.append("category", filters.category)

      const response = await API.get<ProductsResponse>(`/products/search?${params.toString()}`)

      if (response.data.success) {
        return response.data.products.map((p) => this.transformProduct(p))
      }

      throw new Error("Failed to search products")
    } catch (error) {
      console.error("Error searching products:", error)
      throw error
    }
  }
}

export const productService = new ProductService()
