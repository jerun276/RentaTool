import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

test("login page has no automatically detectable axe WCAG A/AA violations", async ({ page }, testInfo) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.goto("/login")
  await expect(page.getByRole("heading", { name: "Admin Operations Sign In" })).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  const evidenceDir = resolve(process.cwd(), "../../nfr-testing/evidence")
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(resolve(evidenceDir, `axe-login-${testInfo.project.name}.json`), JSON.stringify({
    url: page.url(),
    browser: testInfo.project.name,
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString(),
  }, null, 2))

  const screenshot = resolve(evidenceDir, `axe-login-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach("axe-results", {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: "application/json",
  })
  await testInfo.attach("axe-login-screenshot", { path: screenshot, contentType: "image/png" })
  expect(results.violations, "axe found automatically detectable WCAG A/AA violations").toEqual([])
})

test("login session-expired error state is announced and has no axe WCAG A/AA violations", async ({ page }, testInfo) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort())
  await page.goto("/login?session_expired=true")
  await expect(page.getByRole("alert")).toContainText("Your session has expired. Please sign in again to continue.")

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  const evidenceDir = resolve(process.cwd(), "../../nfr-testing/evidence")
  mkdirSync(evidenceDir, { recursive: true })
  writeFileSync(resolve(evidenceDir, `axe-login-session-expired-${testInfo.project.name}.json`), JSON.stringify({
    url: page.url(),
    browser: testInfo.project.name,
    state: "session-expired alert",
    violations: results.violations,
    passes: results.passes.length,
    incomplete: results.incomplete,
    timestamp: new Date().toISOString(),
  }, null, 2))

  const screenshot = resolve(evidenceDir, `axe-login-session-expired-${testInfo.project.name}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })
  await testInfo.attach("axe-session-expired-results", {
    body: Buffer.from(JSON.stringify(results, null, 2)),
    contentType: "application/json",
  })
  await testInfo.attach("axe-session-expired-screenshot", { path: screenshot, contentType: "image/png" })
  expect(results.violations, "axe found violations in the session-expired login state").toEqual([])
})
