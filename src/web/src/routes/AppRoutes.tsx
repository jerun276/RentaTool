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
      <Route
        path="/catalog"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <CatalogDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog/inspections"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <CatalogDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/catalog/availability"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <CatalogDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Component 1: Identity, KYC & Verification */}
      <Route
        path="/identity"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <IdentityVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route path="/identity/register" element={<Navigate to="/login" replace />} />
      <Route path="/identity/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/identity/kyc"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <IdentityVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/identity/trust-score"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <IdentityVerificationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/identity/admin/kyc"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <IdentityVerificationPage />
          </ProtectedRoute>
        }
      />

      {/* Component 4: Escrow Ledger & Security Deposit Claims */}
      <Route
        path="/claims"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ClaimArbitrationDeskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims/:id"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ClaimArbitrationDeskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ClaimArbitrationDeskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/arbitration"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <ClaimArbitrationDeskPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/operations" replace />} />
    </Routes>
  )
}
