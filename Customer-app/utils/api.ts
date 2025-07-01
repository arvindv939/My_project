import axios, { type AxiosInstance, type AxiosResponse } from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Create axios instance
const API: AxiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data,
      })
      return config
    } catch (error) {
      console.error("Error getting auth token:", error)
      return config
    }
  },
  (error) => {
    console.error("Request interceptor error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
API.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  },
  async (error) => {
    console.error("API Response Error:", error.response?.data || error.message)

    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("authToken")
      await AsyncStorage.removeItem("user")
      // You might want to redirect to login screen here
    }

    return Promise.reject(error)
  },
)

export default API
