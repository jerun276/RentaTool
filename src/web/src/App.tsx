import React from "react"
import { BrowserRouter } from "react-router-dom"
import { Navbar } from "@/shared/components/Navbar"
import { AppRoutes } from "@/routes/AppRoutes"

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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
              <span className="text-emerald-400">Student 2: Jerun</span>
              <span>•</span>
              <span>Component 2: Catalog & Inspection</span>
              <span>•</span>
              <span>SLIIT SE3090 (2026)</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
