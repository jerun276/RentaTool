import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"
import { BookingDashboardPage } from "@/modules/booking/pages/BookingDashboardPage"
import { OperationsPortalPage } from "@/modules/booking/pages/OperationsPortalPage"
import { IdentityVerificationPage } from "@/modules/identity/pages/IdentityVerificationPage"
import { LoginPage } from "@/modules/identity/pages/LoginPage"
import { ClaimArbitrationDeskPage } from "@/modules/escrow/pages/ClaimArbitrationDeskPage"

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Route */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Protected Admin Desks (Desk 01 - 04) */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/calendar"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/tracker"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <BookingDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings/conflicts"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <OperationsPortalPage />
          </ProtectedRoute>
        }
      />

      {/* Component 2: Equipment Catalog & Condition Inspection */}
      <Route path="/catalog" element={<Navigate to="/operations?desk=catalog" replace />} />
      <Route path="/catalog/inspections" element={<Navigate to="/operations?desk=catalog" replace />} />
      <Route path="/catalog/availability" element={<Navigate to="/operations?desk=catalog" replace />} />

      {/* Component 1: Identity, KYC & Verification */}
      <Route path="/identity" element={<Navigate to="/operations?desk=desk02" replace />} />
      <Route path="/identity/register" element={<Navigate to="/login" replace />} />
      <Route path="/identity/login" element={<Navigate to="/login" replace />} />
      <Route path="/identity/kyc" element={<Navigate to="/operations?desk=desk02" replace />} />
      <Route path="/identity/trust-score" element={<Navigate to="/operations?desk=desk02" replace />} />
      <Route path="/identity/admin/kyc" element={<Navigate to="/operations?desk=desk02" replace />} />

      {/* Component 4: Escrow Ledger & Security Deposit Claims */}
      <Route path="/claims" element={<Navigate to="/operations?desk=desk04" replace />} />
      <Route path="/claims/:id" element={<Navigate to="/operations?desk=desk04" replace />} />
      <Route path="/escrow" element={<Navigate to="/operations?desk=desk04" replace />} />
      <Route path="/arbitration" element={<Navigate to="/operations?desk=desk04" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/operations" replace />} />
    </Routes>
  )
}
