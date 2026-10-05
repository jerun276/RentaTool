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
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setRole: (role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      setRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, role } : null,
        })),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: "rentatool-auth-session",
    }
  )
)

