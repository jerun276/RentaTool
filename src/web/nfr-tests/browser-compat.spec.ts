import { expect, test } from "@playwright/test"

test("login route renders and its controls remain usable in this browser engine", async ({ page }, testInfo) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()
  await expect(page.getByLabel(/Operator Email/i)).toBeVisible()
  await expect(page.getByLabel(/^Password/i)).toBeVisible()
  const screenshot = testInfo.outputPath(`${testInfo.project.name}-login.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach("browser-login", { path: screenshot, contentType: "image/png" })
})
