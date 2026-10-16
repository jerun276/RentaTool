import { expect, test } from "@playwright/test"

const routes = [
  { path: "/login", expectedPath: "/login", name: "public login" },
  { path: "/register", expectedPath: "/login", name: "public registration redirect" },
  { path: "/operations", expectedPath: "/login", name: "protected operations redirect" },
  { path: "/catalog", expectedPath: "/login", name: "protected catalog redirect" },
  { path: "/bookings/tracker", expectedPath: "/login", name: "protected booking tracker redirect" },
  { path: "/identity/kyc", expectedPath: "/login", name: "protected identity route redirect" },
  { path: "/claims", expectedPath: "/login", name: "protected claims route redirect" },
]

for (const route of routes) {
  test(`${route.name} preserves expected behavior`, async ({ page }, testInfo) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (request) => request.abort())
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(route.path)
    await expect(page).toHaveURL((url) => url.pathname === route.expectedPath, { timeout: 5_000 })
    await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()

    const screenshotPath = testInfo.outputPath(`${testInfo.project.name}-${route.path.replace(/\//g, "_")}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    await testInfo.attach(`route-${route.path}`, { path: screenshotPath, contentType: "image/png" })
  })
}
