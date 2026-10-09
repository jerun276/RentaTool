import React from "react"
import { BrowserRouter, useLocation } from "react-router-dom"
import { Navbar } from "@/shared/components/Navbar"
import { AppRoutes } from "@/routes/AppRoutes"

const AppContent: React.FC = () => {
  const location = useLocation()
  const isAuthPage = location.pathname === "/login"

  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee]">
        <AppRoutes />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] selection:bg-emerald-500/20 selection:text-emerald-400">
      <AppRoutes />
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
