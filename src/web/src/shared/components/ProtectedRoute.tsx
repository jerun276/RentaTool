import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore, type UserRole } from "@/shared/store/useAuthStore"
import { ShieldAlert, LogOut } from "lucide-react"
import { Button } from "./ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ["Admin"],
}) => {
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()

  // 1. Unauthenticated -> Redirect to /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Authenticated but unauthorized role (e.g. Renter or Owner)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#181c24] border border-[#93000a]/40 rounded-xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#93000a]/20 border border-[#93000a]/50 text-[#ffb4ab] flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-[#ffb4ab]" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-[#dfe2ee]">
              Admin Access Restricted
            </h2>
            <p className="text-sm text-[#86948a]">
              Your account is registered as a{" "}
              <span className="font-semibold text-[#ffb4ab]">{user.role}</span>.
              The Operations Web Portal is restricted to authorized administrative staff.
            </p>
            <p className="text-xs text-[#6b7280]">
              Equipment owners and renters should use the official RentaTool Mobile App.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => logout()}
              className="w-full border-[#1f2937] hover:bg-[#262a33] text-[#bbcabf] flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out & Return to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 3. Authorized Admin
  return <>{children}</>
}
