import { expect, test, type Page, type TestInfo } from "@playwright/test"

const adminResponse = {
  userId: "portal-e2e-admin",
  name: "Portal Test Admin",
  role: "Admin",
  accessToken: "portal-test-token",
}

async function installPortalApiMocks(page: Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname
    let body: unknown = []

    if (path.endsWith("/auth/login")) body = adminResponse
    else if (path.endsWith("/trust-score")) body = { score: 91 }
    else if (path.endsWith("/equipment")) {
      body = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }
    } else if (path.endsWith("/categories")) {
      body = [{ id: "test-tools", name: "Power Tools", description: "Test tools", toolCount: 0 }]
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  })
}

async function signInAsAdmin(page: Page) {
  await page.goto("/login")
  await page.locator('input[autocomplete="email"]').fill("admin@example.com")
  await page.locator('input[autocomplete="current-password"]').fill("Password@123")
  await page.getByRole("button", { name: "Sign In to Portal" }).click()
  await expect(page).toHaveURL(/\/operations$/)
}

test.beforeEach(async ({ page }) => installPortalApiMocks(page))

test.afterEach(async ({ page }, testInfo) => {
  const screenshotPath = testInfo.outputPath("screenshot.png")
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach("screenshot", { path: screenshotPath, contentType: "image/png" })
})

async function captureDashboard(page: Page, testInfo: TestInfo, name: string) {
  const screenshotPath = testInfo.outputPath(`${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(`dashboard-${name}`, { path: screenshotPath, contentType: "image/png" })
}

test("all admin desks reject unauthenticated direct navigation", async ({ page }) => {
  for (const route of ["/operations", "/identity", "/catalog", "/bookings/tracker", "/claims"]) {
    await page.goto(route)
    await expect(page).toHaveURL(/\/login$/)
  }
  await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()
})

test("admin navigation opens each web application desk", async ({ page }) => {
  await signInAsAdmin(page)
  await expect(page.getByRole("heading", { name: /Operations Command Center/ })).toBeVisible()
  await captureDashboard(page, test.info(), "operations")

  await page.getByRole("button", { name: /User Governance & KYC/ }).click()
  await expect(page.getByRole("heading", { name: "KYC & Trust Compliance Desk" })).toBeVisible()
  await captureDashboard(page, test.info(), "identity-kyc")

  await page.getByRole("button", { name: /Fleet & Wear Hub/ }).click()
  await expect(page.getByRole("heading", { name: "Fleet Health & 60-Day Wear Compliance Hub" })).toBeVisible()
  await captureDashboard(page, test.info(), "fleet-health")

  await page.getByRole("button", { name: /Equipment Catalog/ }).click()
  await expect(page.getByRole("heading", { name: "Equipment Inventory & Condition Logs" })).toBeVisible()
  await captureDashboard(page, test.info(), "equipment-catalog")

  await page.getByRole("button", { name: /AI Arbitration/ }).click()
  await expect(page.getByRole("heading", { name: "AI Dispute Arbitration Desk & Escrow Settlement" })).toBeVisible()
  await captureDashboard(page, test.info(), "ai-arbitration")
})

test("admin can sign out and loses access to protected pages", async ({ page }) => {
  await signInAsAdmin(page)
  await expect(page.getByRole("heading", { name: /Operations Command Center/ })).toBeVisible()
  await page.locator("aside button[title='Sign Out']").click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()
  await page.goto("/claims")
  await expect(page).toHaveURL(/\/login$/)
})

test("catalog empty state and equipment listing dialog are usable", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/catalog")
  await expect(page.getByText("No machinery found")).toBeVisible()

  await page.getByRole("button", { name: "List Equipment" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "List New Machinery & Equipment" })).toBeVisible()
})

test("equipment listing dialog closes with Escape", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/catalog")
  await page.getByRole("button", { name: "List Equipment" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("catalog blocks publishing when the required equipment title is empty", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/catalog")
  await page.getByRole("button", { name: "List Equipment" }).click()
  const title = page.getByPlaceholder("e.g. Caterpillar 301.5 Mini Excavator / Makita DHR242")
  await expect(title).toBeVisible()
  await page.getByRole("button", { name: "Publish Tool Listing" }).click()
  await expect(title).toHaveJSProperty("validity.valueMissing", true)
})

test("booking tracker exposes conflict calendar and handles empty booking data", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/bookings/tracker")
  await expect(page.getByRole("heading", { name: "Rental Tracking & Schedule Conflict Portal" })).toBeVisible()
  await captureDashboard(page, test.info(), "booking-tracker")
  await expect(page.getByText("No rentals matching criteria")).toBeVisible()

  await page.getByRole("tab", { name: /Schedule Calendar Conflict Manager/ }).click()
  await expect(page.getByRole("heading", { name: /Schedule Calendar Conflict Manager & Surge Pricing Matrix/ })).toBeVisible()
  await captureDashboard(page, test.info(), "booking-calendar")
})

test("booking form rejects an end date earlier than its start date", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/bookings/tracker")
  await page.getByRole("button", { name: "Book Equipment" }).click()
  const dates = page.locator('input[type="date"]')
  await dates.nth(0).fill("2027-02-10")
  await dates.nth(1).fill("2027-02-09")
  await page.getByRole("button", { name: "Confirm Reservation" }).click()
  await expect(page.getByText("End date cannot be earlier than start date.")).toBeVisible()
})

test("identity KYC registry filters applicants and opens document details", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/identity")
  await expect(page.getByRole("heading", { name: "KYC review registry" })).toBeVisible()
  await captureDashboard(page, test.info(), "identity-registry")

  const search = page.getByPlaceholder("Search name, email or NIC")
  await search.fill("Nimali")
  await expect(page.getByText("nimali@example.lk")).toBeVisible()
  await expect(page.getByText("kasun@example.lk")).toHaveCount(0)
  await page.getByRole("button", { name: "Document", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "NIC document inspection" })).toBeVisible()
})

test("identity KYC form validates NIC and document type before submission", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/identity")
  await page.getByPlaceholder("123456789V or 200012345678").fill("not-a-nic")
  await expect(page.getByText("Please enter a valid Sri Lankan NIC number (9 digits + V/X or 12 digits).", { exact: true })).toBeVisible()

  await page.locator('input[type="file"]').setInputFiles({
    name: "document.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  })
  await expect(page.getByText("Only JPG, JPEG, or PNG files are allowed.", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Submit KYC" })).toBeDisabled()
})

test("claims desk filters statuses and opens claim adjudication", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/claims")
  await expect(page.getByRole("heading", { name: "Escrow Arbitration Desk" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Dispute Claims Inbox" })).toBeVisible()
  await captureDashboard(page, test.info(), "claims-desk")

  await page.getByRole("button", { name: "Pending", exact: true }).click()
  await expect(page.getByText("Requires Human Adjudication Decision")).toBeVisible()
  await page.getByRole("button", { name: "Adjudicate Claim" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Staff Adjudication Action" })).toBeVisible()
  await expect(page.getByText(/Adjudicate damage claim/)).toBeVisible()
})

test("claim adjudication requires staff notes before submitting a decision", async ({ page }) => {
  await signInAsAdmin(page)
  await page.goto("/claims")
  await page.getByRole("button", { name: "Pending", exact: true }).click()
  await page.getByRole("button", { name: "Adjudicate Claim" }).click()
  await page.getByRole("button", { name: "Confirm Approve" }).click()
  await expect(page.getByText("Please provide staff reasoning notes for this adjudication decision.")).toBeVisible()
})
