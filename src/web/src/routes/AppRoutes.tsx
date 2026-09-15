import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"
import { BookingDashboardPage } from "@/modules/booking/pages/BookingDashboardPage"
import { IdentityVerificationPage } from "@/modules/identity/pages/IdentityVerificationPage"
import { ClaimArbitrationDeskPage } from "@/modules/escrow/pages/ClaimArbitrationDeskPage"

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default route redirects to Component 3 Bookings */}
      <Route path="/" element={<Navigate to="/bookings" replace />} />

      {/* Component 2: Equipment Catalog & Condition Inspection */}
      <Route path="/catalog" element={<CatalogDashboardPage />} />
      <Route path="/catalog/inspections" element={<CatalogDashboardPage />} />
      <Route path="/catalog/availability" element={<CatalogDashboardPage />} />

      {/* Component 3: Booking Engine & Handover Verification */}
      <Route path="/bookings" element={<BookingDashboardPage />} />
      <Route path="/bookings/calendar" element={<BookingDashboardPage />} />
      <Route path="/bookings/conflicts" element={<BookingDashboardPage />} />

      {/* Component 1: Identity, KYC & verification */}
      <Route path="/identity" element={<IdentityVerificationPage />} />
      <Route path="/identity/register" element={<IdentityVerificationPage />} />
      <Route path="/identity/login" element={<IdentityVerificationPage />} />
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
