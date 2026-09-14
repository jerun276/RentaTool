import { create } from "zustand"

export type UserRole = "Renter" | "Owner" | "Admin"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  trustScore: number
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AuthUser) => void
  setRole: (role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: "mock-jwt-token-jerun-student2",
  user: {
    id: "99999999-9999-9999-9999-999999999999",
    name: "Jerun (Student 2)",
    email: "jerun.catalog@rentatool.lk",
    role: "Owner",
    trustScore: 98,
  },
  isAuthenticated: true,
  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
  setRole: (role) =>
    set((state) => ({
      user: state.user ? { ...state.user, role } : null,
    })),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}))
