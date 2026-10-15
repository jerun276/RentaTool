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

interface RetryQueueItem {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: RetryQueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Centralized error & refresh token handling
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean })

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // Do not attempt refresh on auth endpoints or if already retried
    const url = originalRequest.url || ""
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/register")

    if (originalRequest._retry || isAuthEndpoint) {
      console.warn("Session expired or unauthorized request. Logging out...")
      const isLoginRoute = window.location.pathname === "/login"
      useAuthStore.getState().logout()
      if (!isLoginRoute) {
        window.location.href = "/login?session_expired=true"
      }
      return Promise.reject(error)
    }

    const currentRefreshToken = useAuthStore.getState().refreshToken
    if (!currentRefreshToken) {
      console.warn("No refresh token available. Logging out...")
      const isLoginRoute = window.location.pathname === "/login"
      useAuthStore.getState().logout()
      if (!isLoginRoute) {
        window.location.href = "/login?session_expired=true"
      }
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axiosClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Use raw axios call to bypass interceptor recursion
      const refreshResponse = await axios.post<{
        userId: string
        name: string
        role: string
        accessToken: string
        refreshToken: string
        accessTokenExpiresAtUtc: string
      }>(`${BASE_URL}/auth/refresh`, {
        refreshToken: currentRefreshToken,
      })

      const newAccessToken = refreshResponse.data.accessToken
      const newRefreshToken = refreshResponse.data.refreshToken

      useAuthStore.getState().setTokens(newAccessToken, newRefreshToken)
      processQueue(null, newAccessToken)

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      }
      return axiosClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      useAuthStore.getState().logout()
      const isLoginRoute = window.location.pathname === "/login"
      if (!isLoginRoute) {
        window.location.href = "/login?session_expired=true"
      }
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
