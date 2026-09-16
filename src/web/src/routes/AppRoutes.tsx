import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"
import { BookingDashboardPage } from "@/modules/booking/pages/BookingDashboardPage"
import { OperationsPortalPage } from "@/modules/booking/pages/OperationsPortalPage"
import { IdentityVerificationPage } from "@/modules/identity/pages/IdentityVerificationPage"
import { LoginPage } from "@/modules/identity/pages/LoginPage"
import { ClaimArbitrationDeskPage } from "@/modules/escrow/pages/ClaimArbitrationDeskPage"

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Dedicated Authentication Route (Admin / Staff Access) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Primary Operations Portal (Stitch Project 15450898920035259879) */}
      <Route path="/" element={<OperationsPortalPage />} />
      <Route path="/operations" element={<OperationsPortalPage />} />
      <Route path="/bookings" element={<OperationsPortalPage />} />
      <Route path="/bookings/calendar" element={<OperationsPortalPage />} />
      <Route path="/bookings/tracker" element={<BookingDashboardPage />} />
      <Route path="/bookings/conflicts" element={<OperationsPortalPage />} />

      {/* Component 2: Equipment Catalog & Condition Inspection */}
      <Route path="/catalog" element={<CatalogDashboardPage />} />
      <Route path="/catalog/inspections" element={<CatalogDashboardPage />} />
      <Route path="/catalog/availability" element={<CatalogDashboardPage />} />

      {/* Component 1: Identity, KYC & verification */}
      <Route path="/identity" element={<IdentityVerificationPage />} />
      <Route path="/identity/register" element={<Navigate to="/login" replace />} />
      <Route path="/identity/login" element={<Navigate to="/login" replace />} />
      <Route path="/identity/kyc" element={<IdentityVerificationPage />} />
      <Route path="/identity/trust-score" element={<IdentityVerificationPage />} />
      <Route path="/identity/admin/kyc" element={<IdentityVerificationPage />} />

      {/* Component 4: Escrow Ledger & Security Deposit Claims */}
      <Route path="/claims" element={<ClaimArbitrationDeskPage />} />
      <Route path="/claims/:id" element={<ClaimArbitrationDeskPage />} />
      <Route path="/escrow" element={<ClaimArbitrationDeskPage />} />
      <Route path="/arbitration" element={<ClaimArbitrationDeskPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/bookings" replace />} />
    </Routes>
  )
}
