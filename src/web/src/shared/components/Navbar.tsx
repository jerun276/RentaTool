import React from "react"
import { Link, useLocation } from "react-router-dom"
import { Wrench, ShieldCheck, Box, Activity, User, Layers } from "lucide-react"
import { useAuthStore, UserRole } from "@/shared/store/useAuthStore"
import { Badge } from "@/shared/components/ui/badge"

export const Navbar: React.FC = () => {
  const location = useLocation()
  const { user, setRole } = useAuthStore()

  const navItems = [
    { label: "Equipment Catalog", path: "/catalog", icon: Box },
    { label: "Inspection Timeline", path: "/catalog/inspections", icon: ShieldCheck },
    { label: "Maintenance Simulator", path: "/catalog/availability", icon: Activity },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/catalog" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-300 group-hover:scale-105">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                RentaTool <span className="text-emerald-400">LK</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                P2P Machinery & Inspection
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-emerald-400 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right side: Student Banner & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Active Student Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-300">
            <Layers className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Component 2: Catalog & Inspection</span>
            <Badge variant="available" className="text-[10px] py-0 px-1.5">
              Jerun (S2)
            </Badge>
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground ml-1 mr-0.5" />
            {(["Owner", "Renter", "Admin"] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  user?.role === r
                    ? "bg-background text-emerald-400 shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
