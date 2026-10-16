import { expect, test, type Page } from "@playwright/test"

const adminResponse = {
  userId: "e2e-admin-001",
  name: "E2E Admin",
  email: "admin@example.com",
  role: "Admin",
  accessToken: "playwright-test-token",
}

async function mockApi(page: Page, loginStatus = 200, loginResponse = adminResponse) {
  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: loginStatus,
      contentType: "application/json",
      body: JSON.stringify(loginResponse),
    })
  })
  await page.route("**/api/v1/users/e2e-admin-001/trust-score", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ score: 88 }),
    })
  })
}

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  // Keep unrelated operations dashboard calls deterministic when a test reaches a protected page.
  await page.route("**/api/v1/**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "[]",
  }))
})

test.afterEach(async ({ page }, testInfo) => {
  const screenshotPath = testInfo.outputPath("screenshot.png")
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach("screenshot", {
    path: screenshotPath,
    contentType: "image/png",
  })
})

test.describe("RentaTool web login and protected portal", () => {
  test("renders login component and toggles password visibility", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Secure Access Terminal")).toBeVisible()
    const password = page.locator('input[autocomplete="current-password"]')
    await expect(password).toHaveAttribute("type", "password")
    await page.getByRole("button", { name: "Show password" }).click()
    await expect(password).toHaveAttribute("type", "text")
  })

  test("validates required credentials in the browser before calling the API", async ({ page }) => {
    let apiCalled = false
    await page.route("**/api/v1/auth/login", async (route) => {
      apiCalled = true
      await route.fulfill({ status: 401, body: "{}" })
    })
    await page.goto("/login")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page.locator('input[autocomplete="email"]')).toBeFocused()
    expect(apiCalled).toBe(false)
  })

  test("rejects malformed email through native form validation", async ({ page }) => {
    let apiCalled = false
    await page.route("**/api/v1/auth/login", async (route) => {
      apiCalled = true
      await route.fulfill({ status: 401, body: "{}" })
    })
    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill("invalid-email")
    await page.locator('input[autocomplete="current-password"]').fill("some-password")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page.locator('input[autocomplete="email"]')).toBeFocused()
    expect(apiCalled).toBe(false)
  })

  test("redirects unauthenticated visitors from a protected route and returns after login", async ({ page }) => {
    await mockApi(page)
    await page.goto("/catalog")
    await expect(page).toHaveURL(/\/login$/)
    await page.locator('input[autocomplete="email"]').fill("admin@example.com")
    await page.locator('input[autocomplete="current-password"]').fill("Password@123")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
  await expect(page).toHaveURL(/\/catalog$/)
  })

  test("sends login request, attaches trust score, and enters the protected operations portal", async ({ page }) => {
    let loginRequest: { email: string; password: string } | undefined
    const apiAuthorizations: Array<string | undefined> = []
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/")) {
        apiAuthorizations.push(request.headers().authorization)
      }
    })
    await page.route("**/api/v1/auth/login", async (route) => {
      loginRequest = route.request().postDataJSON()
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(adminResponse) })
    })
    await page.route("**/api/v1/users/e2e-admin-001/trust-score", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ score: 88 }) })
    })
    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill("admin@example.com")
    await page.locator('input[autocomplete="current-password"]').fill("Password@123")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page).toHaveURL(/\/operations$/)
    expect(loginRequest).toEqual({ email: "admin@example.com", password: "Password@123" })
    expect(apiAuthorizations).toContain("Bearer playwright-test-token")
    await expect(page.getByText("Operations & Modules")).toBeVisible()
  })

  test("shows API authentication error and remains on login", async ({ page }) => {
    await mockApi(page, 401, { message: "Invalid email address or password." })
    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill("admin@example.com")
    await page.locator('input[autocomplete="current-password"]').fill("wrong-password")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page.getByRole("alert")).toContainText("Invalid email address or password.")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("denies a non-admin role returned by the API", async ({ page }) => {
    await mockApi(page, 200, { ...adminResponse, role: "Renter" })
    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill("renter@example.com")
    await page.locator('input[autocomplete="current-password"]').fill("Password@123")
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page.getByRole("alert")).toContainText("not authorized for the Admin Web Portal")
    await expect(page).toHaveURL(/\/login$/)
  })

  test("displays the expired-session error state", async ({ page }) => {
    await page.goto("/login?session_expired=true")
    await expect(page.getByRole("alert")).toContainText("Your session has expired")
  })

})
