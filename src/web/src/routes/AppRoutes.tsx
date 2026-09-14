import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"
import { BookingDashboardPage } from "@/modules/booking/pages/BookingDashboardPage"

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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/bookings" replace />} />
    </Routes>
  )
}
