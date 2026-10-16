import { create } from "zustand"
import { persist } from "zustand/middleware"

export type UserRole = "Renter" | "Owner" | "Admin"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  trustScore?: number
  phoneNumber?: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser, refreshToken?: string | null) => void
  setTokens: (token: string, refreshToken?: string | null) => void
  setRole: (role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user, refreshToken = null) =>
        set({ token, refreshToken, user, isAuthenticated: true }),
      setTokens: (token, refreshToken = null) =>
        set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      setRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),
      logout: () =>
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "rentatool-auth-session",
    }
  )
)

