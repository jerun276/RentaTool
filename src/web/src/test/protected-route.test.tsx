import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { ProtectedRoute } from "@/shared/components/ProtectedRoute"
import { useAuthStore } from "@/shared/store/useAuthStore"

function Location() {
  const location = useLocation()
  return <p>Current path: {location.pathname}</p>
}

function renderProtected(path = "/catalog") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Location />
      <Routes>
        <Route path="/login" element={<h1>Login screen</h1>} />
        <Route path="/catalog" element={<ProtectedRoute allowedRoles={["Admin"]}><h1>Catalog desk</h1></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("ProtectedRoute access control", () => {
  it("redirects unauthenticated visitors to login", () => {
    renderProtected()
    expect(screen.getByRole("heading", { name: "Login screen" })).toBeVisible()
    expect(screen.getByText("Current path: /login")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Catalog desk" })).not.toBeInTheDocument()
  })

  it("allows an authenticated Admin to access the protected page", () => {
    useAuthStore.setState({ token: "valid", isAuthenticated: true, user: { id: "1", name: "Admin", email: "a@example.com", role: "Admin" } })
    renderProtected()
    expect(screen.getByRole("heading", { name: "Catalog desk" })).toBeVisible()
  })

  it.each(["Renter", "Owner"] as const)("denies authenticated %s users and exposes sign out", (role) => {
    useAuthStore.setState({ token: "valid", isAuthenticated: true, user: { id: "2", name: role, email: "user@example.com", role } })
    renderProtected()
    expect(screen.getByRole("heading", { name: "Admin Access Restricted" })).toBeVisible()
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent?.includes(`registered as a ${role}`) === true)).toBeVisible()
    expect(screen.queryByRole("heading", { name: "Catalog desk" })).not.toBeInTheDocument()
  })
})
