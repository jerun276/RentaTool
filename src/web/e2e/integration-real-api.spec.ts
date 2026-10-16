import { expect, test } from "@playwright/test"

const apiBase = process.env.E2E_API_BASE_URL || "http://127.0.0.1:5000/api/v1"
const adminEmail = process.env.E2E_ADMIN_EMAIL || "admin@rentatool.lk"
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "Admin@123"

test.describe("SE3090 integration and end-to-end: live system", () => {
  test("API-01 authenticates, authorizes trust-score access, and rejects missing credentials", async ({ request }) => {
    const login = await request.post(`${apiBase}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    })
    expect(login.status()).toBe(200)
    const session = await login.json()
    expect(session).toMatchObject({ role: "Admin", name: "Local Admin" })
    expect(session.accessToken).toBeTruthy()

    const score = await request.get(`${apiBase}/users/${session.userId}/trust-score`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    expect(score.status()).toBe(200)
    expect((await score.json()).score).toBeGreaterThan(0)

    const denied = await request.get(`${apiBase}/users/${session.userId}/trust-score`)
    expect(denied.status()).toBe(401)
    const invalidLogin = await request.post(`${apiBase}/auth/login`, {
      data: { email: adminEmail, password: "incorrect-password" },
    })
    expect(invalidLogin.status()).toBe(401)
  })

  test("API-02 catalog data flows through API to equipment details, history, and availability", async ({ request }) => {
    const listResponse = await request.get(`${apiBase}/equipment?page=1&pageSize=20`)
    expect(listResponse.status()).toBe(200)
    const result = await listResponse.json()
    expect(result.items.length).toBeGreaterThan(0)
    const item = result.items.find((entry: { title: string }) => entry.title === "Mikasa Plate Compactor 90kg")
    expect(item, "Development database seed equipment is present").toBeTruthy()

    const details = await request.get(`${apiBase}/equipment/${item.id}`)
    expect(details.status()).toBe(200)
    expect((await details.json()).title).toBe(item.title)

    const history = await request.get(`${apiBase}/equipment/${item.id}/history`)
    expect(history.status()).toBe(200)
    expect((await history.json()).equipmentId).toBe(item.id)

    const availability = await request.post(`${apiBase}/equipment/batch-availability`, {
      data: {
        equipmentIds: [item.id],
        desiredStartDate: "2026-11-01T00:00:00Z",
        desiredEndDate: "2026-11-03T00:00:00Z",
      },
    })
    expect(availability.status()).toBe(200)
    const availabilityResult = await availability.json()
    expect(availabilityResult.totalRequested).toBe(1)
    expect(availabilityResult.totalLockedOut).toBe(1)
    expect(availabilityResult.lockedOutItems[0].equipmentId).toBe(item.id)
  })

  test("COMP-02 booking API and database changes appear in the React Web portal", async ({ request, page }) => {
    const login = await request.post(`${apiBase}/auth/login`, {
      data: { email: "renter@rentatool.lk", password: "Renter@123" },
    })
    expect(login.status()).toBe(200)
    const renter = await login.json()

    const listingResponse = await request.get(`${apiBase}/equipment?page=1&pageSize=20`)
    expect(listingResponse.status()).toBe(200)
    const listing = (await listingResponse.json()).items.find(
      (entry: { status: string; ownerId: string }) => entry.status === "Available" && entry.ownerId !== renter.userId,
    )
    expect(listing, "An available listing from another owner is present").toBeTruthy()

    const startDate = new Date()
    startDate.setUTCDate(startDate.getUTCDate() + 120 + Math.floor(Math.random() * 90))
    startDate.setUTCHours(12, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setUTCDate(endDate.getUTCDate() + 2)
    const renterHeaders = { Authorization: `Bearer ${renter.accessToken}` }
    const createdResponse = await request.post(`${apiBase}/bookings`, {
      headers: renterHeaders,
      data: {
        equipmentId: listing.id,
        ownerId: listing.ownerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dailyRate: listing.dailyRate,
      },
    })
    expect(createdResponse.status()).toBe(201)
    const booking = await createdResponse.json()
    expect(booking).toMatchObject({
      equipmentId: listing.id,
      renterId: renter.userId,
      ownerId: listing.ownerId,
      status: "Confirmed",
      totalRentalFee: listing.dailyRate * 3,
    })

    const pickupTokenResponse = await request.post(`${apiBase}/bookings/${booking.id}/generate-handover-token`, {
      headers: renterHeaders,
      data: { eventType: 1 },
    })
    expect(pickupTokenResponse.status()).toBe(200)
    const pickupToken = await pickupTokenResponse.json()
    expect(pickupToken.token).toBeTruthy()
    expect(pickupToken.eventType).toBe("Pickup")

    const pickupVerification = await request.post(`${apiBase}/bookings/${booking.id}/verify-handover`, {
      headers: { "X-User-Id": listing.ownerId },
      data: { token: pickupToken.token, eventType: 1, latitude: 6.9271, longitude: 79.8612, city: "Colombo" },
    })
    expect(pickupVerification.status()).toBe(200)
    expect((await pickupVerification.json()).newBookingStatus).toBe("Active")

    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill(adminEmail)
    await page.locator('input[autocomplete="current-password"]').fill(adminPassword)
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page).toHaveURL(/\/operations$/)
    const activeBookingsResponse = page.waitForResponse(
      (response) => response.url().includes("/bookings/active") && response.status() === 200,
    )
    await page.goto("/bookings/tracker")
    await expect(page.getByText("Rental Tracking & Schedule Conflict Portal")).toBeVisible()
    await activeBookingsResponse
    await expect(page.getByText(`ID: ${booking.id.slice(0, 10)}`, { exact: true })).toBeVisible()
    await page.screenshot({ path: "test-results/live-web-booking.png", fullPage: true })

    const returnTokenResponse = await request.post(`${apiBase}/bookings/${booking.id}/generate-handover-token`, {
      headers: { "X-User-Id": listing.ownerId },
      data: { eventType: 2 },
    })
    expect(returnTokenResponse.status()).toBe(200)
    const returnToken = await returnTokenResponse.json()
    const returnVerification = await request.post(`${apiBase}/bookings/${booking.id}/verify-handover`, {
      headers: renterHeaders,
      data: { token: returnToken.token, eventType: 2, latitude: 6.9271, longitude: 79.8612, city: "Colombo" },
    })
    expect(returnVerification.status()).toBe(200)
    expect((await returnVerification.json()).newBookingStatus).toBe("Completed")

    const persisted = await request.get(`${apiBase}/bookings/${booking.id}`)
    expect(persisted.status()).toBe(200)
    expect((await persisted.json()).status).toBe("Completed")
  })

  test("API-04 claims list is available from the escrow API", async ({ request }) => {
    const response = await request.get(`${apiBase}/claims`)
    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual(expect.any(Array))
  })

  test("API-05 escrow booking lookup returns a hold or a not-found response", async ({ request }) => {
    const response = await request.get(`${apiBase}/escrow/booking/00000000-0000-0000-0000-000000000001`)
    expect([200, 404]).toContain(response.status())
  })

  test("WEB-API-01 real web login then catalog reads the same API equipment record", async ({ page }) => {
    const apiResponses: Array<{ url: string; status: number }> = []
    page.on("response", (response) => {
      if (response.url().includes("/api/v1/")) {
        apiResponses.push({ url: response.url(), status: response.status() })
      }
    })

    await page.goto("/login")
    await page.locator('input[autocomplete="email"]').fill(adminEmail)
    await page.locator('input[autocomplete="current-password"]').fill(adminPassword)
    await page.getByRole("button", { name: "Sign In to Portal" }).click()
    await expect(page).toHaveURL(/\/operations$/)
    await page.goto("/catalog")
    await expect(page.getByText("Equipment Inventory & Condition Logs")).toBeVisible()
    await expect(page.getByText("Mikasa Plate Compactor 90kg", { exact: true })).toBeVisible()

    expect(apiResponses.some((response) => response.url.includes("/auth/login") && response.status === 200)).toBe(true)
    expect(apiResponses.some((response) => response.url.includes("/equipment") && response.status === 200)).toBe(true)
    await page.screenshot({ path: "test-results/live-web-catalog.png", fullPage: true })
  })
})
