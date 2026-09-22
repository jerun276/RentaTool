import React, { useEffect } from "react"
import { BrowserRouter, useLocation } from "react-router-dom"
import { Navbar } from "@/shared/components/Navbar"
import { AppRoutes } from "@/routes/AppRoutes"
import { useAuthStore, type UserRole } from "@/shared/store/useAuthStore"
import { identityApi } from "@/modules/identity/api/identityApi"

const AppContent: React.FC = () => {
  const location = useLocation()
  const isAuthPage = location.pathname === "/login"

  // Ensure an authenticated session exists for Admin/Operations desks
  useEffect(() => {
    const initAuth = async () => {
      const state = useAuthStore.getState()
      if (!state.token || !state.user) {
        try {
          const res = await identityApi.login({ email: "admin@rentatool.lk", password: "Admin@123" })
          if (res.data?.accessToken) {
            useAuthStore.getState().setAuth(res.data.accessToken, {
              id: res.data.userId,
              name: res.data.name,
              email: "admin@rentatool.lk",
              role: res.data.role as UserRole,
            })
          }
        } catch {
          // Dev auth fallback
        }
      }
    }
    initAuth()
  }, [])

  const isOperationsPortal =
    location.pathname === "/" ||
    location.pathname === "/operations" ||
    location.pathname === "/bookings" ||
    location.pathname === "/bookings/calendar" ||
    location.pathname === "/bookings/conflicts"

  if (isAuthPage || isOperationsPortal) {
    return (
      <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee]">
        <AppRoutes />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-emerald-500/20 selection:text-emerald-400">
      <Navbar />
      <main className="flex-1">
        <AppRoutes />
      </main>
      <footer className="border-t border-border/60 py-6 text-xs text-muted-foreground bg-card/20 backdrop-blur-sm">
        <div className="container px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">RentaTool LK</span>
            <span>—</span>
            <span>Peer-to-Peer Machinery & Equipment Rental System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-emerald-400">Student 3: Niroshan</span>
            <span>•</span>
            <span>Component 3: Booking & Handover</span>
            <span>•</span>
            <span>SLIIT SE3090 (2026)</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
