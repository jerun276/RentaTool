import axios from "axios"
import { useAuthStore } from "@/shared/store/useAuthStore"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1"

export const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
})

// Attach Bearer JWT token from useAuthStore
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Centralized error handling
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized request. Logging out...")
      const isLoginRoute = window.location.pathname === "/login"
      useAuthStore.getState().logout()
      if (!isLoginRoute) {
        window.location.href = "/login?session_expired=true"
      }
    }
    return Promise.reject(error)
  }
)
