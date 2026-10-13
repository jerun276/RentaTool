import { http, HttpResponse } from "msw"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { LoginPage } from "@/modules/identity/pages/LoginPage"
import { server } from "./server"
import { useAuthStore } from "@/shared/store/useAuthStore"

const api = "http://localhost:3000/api/v1"
const loginUrl = `${api}/auth/login`
const success = {
  userId: "test-admin-1", name: "Test Admin", role: "Admin",
  accessToken: "test-access-token",
}

function renderLogin(path = "/login") {
  window.history.replaceState({}, "", path)
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/operations" element={<h1>Operations destination</h1>} />
        <Route path="/catalog" element={<h1>Catalog destination</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("LoginPage form and user interactions", () => {
  it("renders labelled inputs and toggles password visibility", async () => {
    const user = userEvent.setup()
    renderLogin()
    expect(screen.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()
    expect(screen.getByLabelText(/Operator Email/)).toBeVisible()
    const password = screen.getByLabelText(/^Password/)
    expect(password).toHaveAttribute("type", "password")
    await user.click(screen.getByRole("button", { name: "Show password" }))
    expect(password).toHaveAttribute("type", "text")
    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(password).toHaveAttribute("type", "password")
  })

  it("quick fills the real staff credentials", async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole("button", { name: /System Admin/ }))
    expect(screen.getByLabelText(/Operator Email/)).toHaveValue("admin@rentatool.lk")
    expect(screen.getByLabelText(/^Password/)).toHaveValue("Admin@123")
  })

  it("uses native required and email validation without making an API request", () => {
    let requests = 0
    server.use(http.post(loginUrl, () => { requests += 1; return HttpResponse.json(success) }))
    renderLogin()
    const form = screen.getByRole("button", { name: /Sign In to Portal/ }).closest("form")!
    const email = screen.getByLabelText(/Operator Email/) as HTMLInputElement
    const password = screen.getByLabelText(/^Password/) as HTMLInputElement
    expect(email.required).toBe(true)
    expect(password.required).toBe(true)
    expect(email.checkValidity()).toBe(false)
    fireEvent.change(email, { target: { value: "not-an-email" } })
    fireEvent.change(password, { target: { value: "secret" } })
    expect(email.checkValidity()).toBe(false)
    expect(form).toBeInTheDocument()
    expect(requests).toBe(0)
  })

  it("shows inline validation for a direct empty form submission", async () => {
    renderLogin()
    fireEvent.submit(screen.getByRole("button", { name: /Sign In to Portal/ }).closest("form")!)
    expect(await screen.findByRole("alert")).toHaveTextContent("Please enter both email address and password.")
  })

  it("submits trimmed credentials, loads trust score, persists admin auth, and shows success", async () => {
    const user = userEvent.setup()
    let submitted: unknown
    server.use(
      http.post(loginUrl, async ({ request }) => {
        submitted = await request.json()
        return HttpResponse.json(success)
      }),
      http.get(`${api}/users/test-admin-1/trust-score`, () => HttpResponse.json({ score: 88 })),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), " admin@example.com ")
    await user.type(screen.getByLabelText(/^Password/), "Password@123")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    expect(await screen.findByRole("status")).toHaveTextContent("Authenticated as Test Admin (Admin). Access granted.")
    expect(submitted).toEqual({ email: "admin@example.com", password: "Password@123" })
    expect(useAuthStore.getState()).toMatchObject({ token: "test-access-token", user: { id: "test-admin-1", trustScore: 88 }, isAuthenticated: true })
  })

  it("shows a disabled loading state while authentication is pending", async () => {
    const user = userEvent.setup()
    let completeRequest!: () => void
    server.use(
      http.post(loginUrl, async () => {
        await new Promise<void>((resolve) => { completeRequest = resolve })
        return HttpResponse.json(success)
      }),
      http.get(`${api}/users/test-admin-1/trust-score`, () => HttpResponse.json({ score: 90 })),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), "admin@example.com")
    await user.type(screen.getByLabelText(/^Password/), "Password@123")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    const pendingButton = await screen.findByRole("button", { name: /Verifying Credentials/ })
    expect(pendingButton).toBeDisabled()
    completeRequest()
    await screen.findByRole("status")
  })

  it("gracefully uses fallback trust score when ledger lookup fails", async () => {
    const user = userEvent.setup()
    server.use(
      http.post(loginUrl, () => HttpResponse.json(success)),
      http.get(`${api}/users/test-admin-1/trust-score`, () => HttpResponse.json({ message: "unavailable" }, { status: 500 })),
    )
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), "admin@example.com")
    await user.type(screen.getByLabelText(/^Password/), "Password@123")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    await screen.findByRole("status")
    expect(useAuthStore.getState().user?.trustScore).toBe(95)
  })

  it.each([
    [400, "Invalid request data."], [401, "Credentials rejected."], [403, "Account forbidden."],
    [404, "Login endpoint not found."], [500, "Server unavailable."],
  ])("shows a useful message for HTTP %s", async (status, message) => {
    const user = userEvent.setup()
    server.use(http.post(loginUrl, () => HttpResponse.json({ message }, { status })))
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), "admin@example.com")
    await user.type(screen.getByLabelText(/^Password/), "wrong-password")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent(message)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("shows a network error and preserves the login screen", async () => {
    const user = userEvent.setup()
    server.use(http.post(loginUrl, () => HttpResponse.error()))
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), "admin@example.com")
    await user.type(screen.getByLabelText(/^Password/), "Password@123")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/Network Error/i)
  })

  it("denies unexpected/empty API data without crashing or authenticating", async () => {
    const user = userEvent.setup()
    server.use(http.post(loginUrl, () => HttpResponse.json({})))
    renderLogin()
    await user.type(screen.getByLabelText(/Operator Email/), "admin@example.com")
    await user.type(screen.getByLabelText(/^Password/), "Password@123")
    await user.click(screen.getByRole("button", { name: /Sign In to Portal/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/not authorized/i)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it("shows the expired-session message from the actual login query state", async () => {
    renderLogin("/login?session_expired=true")
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Your session has expired"))
  })
})
