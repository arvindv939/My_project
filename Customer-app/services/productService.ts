import API from "@/utils/api"

export interface Product {
  _id: string
  name: string
  description?: string
  price: number
  category: string
  imageUrl?: string
  stock: number
  unit: string
  isOrganic?: boolean
  ecoFriendly?: boolean
  inStock: boolean
  isActive?: boolean
  rating?: number
  reviews?: number
  createdAt?: string
  updatedAt?: string
}

interface ProductFilters {
  category?: string
  search?: string
  limit?: number
  page?: number
}

interface ProductResponse {
  success: boolean
  products: any[]
  totalPages: number
  currentPage: number
  total: number
}

class ProductService {
  private transformProduct(backendProduct: any): Product {
    // More lenient stock checking
    const stockValue = Number(backendProduct.stock) || 0
    const isActiveValue = backendProduct.isActive !== false // Default to true if not explicitly false
    const inStockValue = stockValue > 0 && isActiveValue

    const product: Product = {
      _id: backendProduct._id || backendProduct.id,
      name: backendProduct.name || "",
      description: backendProduct.description || "",
      price: Number(backendProduct.price) || 0,
      category: backendProduct.category || "General",
      imageUrl: backendProduct.imageUrl || backendProduct.image,
      stock: stockValue,
      unit: backendProduct.unit || "kg",
      isOrganic: Boolean(backendProduct.isOrganic),
      ecoFriendly: Boolean(backendProduct.ecoFriendly),
      inStock: inStockValue,
      isActive: isActiveValue,
      rating: Number(backendProduct.rating) || 4.5,
      reviews: Number(backendProduct.reviews) || 0,
      createdAt: backendProduct.createdAt,
      updatedAt: backendProduct.updatedAt,
    }

    console.log("ProductService: Transformed product:", {
      name: product.name,
      stock: product.stock,
      isActive: product.isActive,
      inStock: product.inStock,
      rawStock: backendProduct.stock,
      rawIsActive: backendProduct.isActive,
    })

    return product
  }

  async getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
    try {
      console.log("ProductService: Fetching products with filters:", filters)

      const params = new URLSearchParams()
      if (filters.category) params.append("category", filters.category)
      if (filters.search) params.append("search", filters.search)
      if (filters.limit) params.append("limit", filters.limit.toString())
      if (filters.page) params.append("page", filters.page.toString())

      const endpoint = `/products${params.toString() ? `?${params.toString()}` : ""}`
      console.log("ProductService: Making request to:", endpoint)

      const response = await API.get(endpoint)
      console.log("ProductService: Raw response:", response.data)

      const data: ProductResponse = response.data

      if (data.success && Array.isArray(data.products)) {
        const transformedProducts = data.products.map((product) => this.transformProduct(product))

        console.log("ProductService: Returning", transformedProducts.length, "products")
        console.log("ProductService: Sample product data:", transformedProducts[0])
        return transformedProducts
      } else {
        console.warn("ProductService: Unexpected response format:", data)
        return []
      }
    } catch (error: any) {
      console.error("ProductService: Error fetching products:", error)

      if (error.response) {
        console.error("ProductService: Error response:", error.response.data)
        console.error("ProductService: Error status:", error.response.status)
      }

      if (error.response?.status === 404) {
        return []
      }

      throw error
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      console.log("ProductService: Fetching product by ID:", id)
      const response = await API.get(`/products/${id}`)
      console.log("ProductService: Product response:", response.data)

      const data = response.data

      if (data.success && data.product) {
        return this.transformProduct(data.product)
      } else if (data && !data.success) {
        return this.transformProduct(data)
      }

      return null
    } catch (error: any) {
      console.error("ProductService: Error fetching product by ID:", error)

      if (error.response?.status === 404) {
        return null
      }

      throw error
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getAllProducts({ category })
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.getAllProducts({ search: query })
  }
}

export const productService = new ProductService()
