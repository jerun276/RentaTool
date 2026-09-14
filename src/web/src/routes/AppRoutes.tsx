import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { CatalogDashboardPage } from "@/modules/catalog/pages/CatalogDashboardPage"

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default route redirects to Component 2 Catalog */}
      <Route path="/" element={<Navigate to="/catalog" replace />} />

      {/* Component 2: Equipment Catalog & Condition Inspection */}
      <Route path="/catalog" element={<CatalogDashboardPage />} />
      <Route path="/catalog/inspections" element={<CatalogDashboardPage />} />
      <Route path="/catalog/availability" element={<CatalogDashboardPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  )
}
