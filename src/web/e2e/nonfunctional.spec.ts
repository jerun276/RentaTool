import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
})

test.afterEach(async ({ page }, testInfo) => {
  const screenshotPath = testInfo.outputPath("screenshot.png")
  await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach("screenshot", {
    path: screenshotPath,
    contentType: "image/png",
  })
})

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
]

for (const viewport of viewports) {
  test(`responsive layout fits the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible()
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()

    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      formRight: document.querySelector("form")?.getBoundingClientRect().right ?? Infinity,
    }))
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth)
    expect(layout.formRight).toBeLessThanOrEqual(layout.viewportWidth + 1)
  })
}

test("login controls have accessible names and support keyboard focus", async ({ page }) => {
  await page.goto("/login")

  const email = page.getByLabel(/Operator Email/i)
  const password = page.getByLabel(/^Password/i)
  await expect(email).toBeVisible()
  await expect(password).toHaveAttribute("type", "password")
  await expect(page.getByRole("button", { name: "Show password" })).toBeVisible()

  await email.focus()
  await expect(email).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(password).toBeFocused()
})

test("login page becomes interactive within the local performance budget", async ({ page }) => {
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()

  const timing = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    return navigation.domContentLoadedEventEnd - navigation.startTime
  })
  console.log(`NFR-PERF-001 DOMContentLoaded: ${timing.toFixed(2)} ms`)
  await test.info().attach("navigation-timing.json", {
    body: JSON.stringify({
      metric: "DOMContentLoaded",
      milliseconds: Number(timing.toFixed(2)),
      budgetMilliseconds: 5_000,
      url: page.url(),
    }, null, 2),
    contentType: "application/json",
  })
  expect(timing).toBeGreaterThan(0)
  expect(timing).toBeLessThan(5_000)
})

test("login page has no axe WCAG 2.1 A/AA violations", async ({ page }) => {
  await page.goto("/login")
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  await test.info().attach("axe-accessibility-results", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  })
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
})
