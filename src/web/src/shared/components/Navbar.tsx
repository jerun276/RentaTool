import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Wrench, Box, User, Layers, Calendar, Scale, LayoutDashboard, Users, Menu, X } from "lucide-react"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { Badge } from "@/shared/components/ui/badge"

export const Navbar: React.FC = () => {
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { label: "Operations Hub", path: "/operations", icon: LayoutDashboard },
    { label: "Identity & KYC", path: "/identity", icon: Users },
    { label: "Equipment Catalog", path: "/catalog", icon: Box },
    { label: "Booking Tracker", path: "/bookings/tracker", icon: Calendar },
    { label: "Arbitration Desk", path: "/claims", icon: Scale },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-300 group-hover:scale-105">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-1.5">
                RentaTool <span className="text-emerald-400">LK</span>
              </span>
              <span className="block text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                P2P Machinery & Rental Booking
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (item.path === "/operations" && location.pathname === "/")
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-emerald-400 shadow-sm font-semibold"
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
            <span>RentaTool LK</span>
            <Badge variant="available" className="text-[10px] py-0 px-1.5">
              Admin Portal
            </Badge>
          </div>

          {/* Authenticated Admin Operator Status & Sign Out */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-muted/50 py-1 px-2.5 rounded-lg border border-border/50 text-xs">
                <User className="h-3.5 w-3.5 text-emerald-400" />
                <span className="font-medium text-foreground max-w-[120px] truncate">{user.name}</span>
                <Badge variant="available" className="text-[10px] py-0 px-1.5 uppercase font-mono">
                  {user.role}
                </Badge>
              </div>
              <button
                onClick={() => logout()}
                className="px-2.5 py-1 text-xs rounded border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 text-xs rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors font-medium"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === "/operations" && location.pathname === "/")
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-emerald-400 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
