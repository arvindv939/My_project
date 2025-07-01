import API from "@/utils/api"

export interface OrderItem {
  product: string
  quantity: number
  price: number
}

export interface CreateOrderData {
  products: OrderItem[]
  scheduledDate?: string
  scheduledTime?: string
  orderType: "delivery" | "pickup"
  paymentMethod: "cash" | "card" | "upi"
  address?: string
  notes?: string
}

export interface Order {
  _id: string
  customer: string
  products: OrderItem[]
  total: number
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
  orderDate: string
  scheduledDate?: string
  scheduledTime?: string
  orderType: "delivery" | "pickup"
  paymentMethod: string
  address?: string
  notes?: string
  qrCode?: string
  pickupToken?: string
  estimatedTime?: number
  createdAt: string
  updatedAt: string
  totalAmount: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  deliveryAddress?: string
}

class OrderService {
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    try {
      console.log("OrderService: Creating order with data:", orderData)

      // Calculate total amount
      const totalAmount = orderData.products.reduce((total, item) => {
        return total + item.price * item.quantity
      }, 0)

      // Transform data to match backend expectations
      const backendOrderData = {
        products: orderData.products,
        total: totalAmount,
        orderType: orderData.orderType,
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        address: orderData.address,
        scheduledDate: orderData.scheduledDate,
        scheduledTime: orderData.scheduledTime,
      }

      console.log("OrderService: Sending to backend:", backendOrderData)

      const response = await API.post("/orders", backendOrderData)

      console.log("OrderService: Backend response:", response.data)

      if (response.data && response.data.order) {
        return response.data.order
      } else if (response.data) {
        return response.data
      } else {
        throw new Error("Invalid response format from server")
      }
    } catch (error: any) {
      console.error("OrderService: Error creating order:", error)

      if (error.response) {
        console.error("OrderService: Error response:", error.response.data)
        console.error("OrderService: Error status:", error.response.status)

        const errorMessage =
          error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
        throw new Error(errorMessage)
      } else if (error.request) {
        console.error("OrderService: No response received:", error.request)
        throw new Error("Network error: Unable to connect to server")
      } else {
        console.error("OrderService: Request setup error:", error.message)
        throw new Error(error.message || "Failed to create order")
      }
    }
  }

  async getMyOrders(): Promise<Order[]> {
    try {
      console.log("OrderService: Fetching user orders")
      const response = await API.get("/orders/my-orders")
      console.log("OrderService: Orders response:", response.data)
      return response.data.orders || response.data || []
    } catch (error: any) {
      console.error("OrderService: Error fetching orders:", error)

      if (error.response?.status === 404) {
        return [] // No orders found
      }

      throw error
    }
  }

  async getUserOrders(): Promise<Order[]> {
    return this.getMyOrders()
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await API.get(`/orders/${orderId}`)
      return response.data.order || response.data
    } catch (error) {
      console.error("OrderService: Error fetching order:", error)
      throw error
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    try {
      const response = await API.put(`/orders/${orderId}/status`, { status })
      return response.data.order || response.data
    } catch (error) {
      console.error("OrderService: Error updating order status:", error)
      throw error
    }
  }

  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await API.put(`/orders/${orderId}/cancel`)
      return response.data.order || response.data
    } catch (error) {
      console.error("OrderService: Error cancelling order:", error)
      throw error
    }
  }

  async trackOrder(orderId: string): Promise<Order> {
    try {
      const response = await API.get(`/orders/${orderId}/track`)
      return response.data.order || response.data
    } catch (error) {
      console.error("OrderService: Error tracking order:", error)
      throw error
    }
  }
}

export const orderService = new OrderService()
