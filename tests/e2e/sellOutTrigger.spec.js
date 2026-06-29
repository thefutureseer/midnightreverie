// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Sell-Out Trigger — E2E UI Test
 *
 * Verifies the complete browser-visible flow:
 *   Locked  → waitlist form shown, buy button hidden
 *   Sold-out physical seats → virtual sales flip to Open
 *   Open    → buy form shown, waitlist button hidden
 *
 * Strategy
 * ─────────
 * 1. Use Playwright's `request` fixture to call the API directly:
 *    - Log in as the seeded host (host@test.com / password123) to get a JWT
 *    - Create a fresh test venue with totalPhysicalSeats = 1 (one click = sold out)
 * 2. Drive the browser through the venue page UI for all assertions
 * 3. Sell the final physical seat via API (no need to click 1,200 times)
 * 4. Reload and assert the UI has flipped to the buy form
 */

test.describe("Sell-Out Trigger — virtual ticket unlock flow", () => {
  let hostToken;
  let venueId;

  test.beforeAll(async ({ request }) => {
    // ── Authenticate as the seeded host ──────────────────────────────────────
    const loginRes = await request.post("/api/auth/login", {
      data: { email: "host@test.com", password: "password123" },
    });
    expect(loginRes.ok(), "Host login should succeed").toBeTruthy();
    const loginBody = await loginRes.json();
    hostToken = loginBody.token;

    // ── Create a test venue with a 1-seat physical cap ────────────────────────
    const venueRes = await request.post("/api/venues", {
      headers: { Authorization: `Bearer ${hostToken}` },
      data: {
        venueName: "E2E Sell-Out Test Venue",
        capacitySeats: 50,
        ticketPriceChargedByHost: 10,
        performerName: "E2E Performer",
        showDate: "Saturday, July 19, 2026",
        showTime: "8:00 PM EST",
        location: "Test Arena, Replit City",
        totalPhysicalSeats: 1,
      },
    });
    expect(venueRes.ok(), "Venue creation should succeed").toBeTruthy();
    const venue = await venueRes.json();
    venueId = venue.id;
  });

  test("shows waitlist form and hides buy button when virtual sales are Locked", async ({
    page,
  }) => {
    await page.goto(`/venue/${venueId}`);

    // Status banner must say "Locked"
    await expect(page.getByText("Locked")).toBeVisible();

    // Waitlist form panel heading (CardTitle renders as <div>, not <h*>)
    // exact:true avoids false match on the description paragraph which contains
    // "join the waitlist" as a substring (case-insensitive default behaviour)
    await expect(
      page.getByText("Join the Waitlist", { exact: true })
    ).toBeVisible();

    // Waitlist submit button must exist and be enabled
    const waitlistBtn = page.getByTestId("button-join-waitlist");
    await expect(waitlistBtn).toBeVisible();
    await expect(waitlistBtn).toBeEnabled();

    // Buy-ticket button must NOT be on the page
    await expect(page.getByTestId("button-buy-ticket")).not.toBeVisible();
  });

  test("a visitor can join the waitlist while sales are Locked", async ({
    page,
  }) => {
    await page.goto(`/venue/${venueId}`);

    const emailInput = page.getByTestId("input-waitlist-email");
    await emailInput.fill("e2e-fan@playwright.test");

    await page.getByTestId("button-join-waitlist").click();

    // Success message should appear
    await expect(
      page.getByText(/added to the waitlist/i)
    ).toBeVisible();

    // The same email joining again shows "already on the waitlist"
    // (page resets form — navigate back and try again)
    await page.goto(`/venue/${venueId}`);
    await page.getByTestId("input-waitlist-email").fill("e2e-fan@playwright.test");
    await page.getByTestId("button-join-waitlist").click();
    await expect(
      page.getByText(/already on the waitlist/i)
    ).toBeVisible();
  });

  test("UI flips to buy form after physical venue sells out", async ({
    page,
    request,
  }) => {
    // Verify still locked before we trigger the sell-out
    await page.goto(`/venue/${venueId}`);
    await expect(page.getByTestId("button-join-waitlist")).toBeVisible();
    await expect(page.getByTestId("button-buy-ticket")).not.toBeVisible();

    // ── Sell the one physical seat via API (triggers status → Open) ──────────
    const saleRes = await request.post(`/api/venues/${venueId}/physical-tickets`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    });
    expect(saleRes.ok(), "Physical ticket sale should succeed").toBeTruthy();
    const saleBody = await saleRes.json();
    expect(saleBody.soldOut).toBe(true);
    expect(saleBody.venue.virtualSalesStatus).toBe("Open");

    // ── Reload the browser and assert the UI has updated ─────────────────────
    await page.reload();

    // Status banner must now say "On Sale Now"
    await expect(page.getByText("On Sale Now")).toBeVisible();

    // Buy-ticket button must now be visible and enabled
    const buyBtn = page.getByTestId("button-buy-ticket");
    await expect(buyBtn).toBeVisible();
    await expect(buyBtn).toBeEnabled();

    // Waitlist button must be gone
    await expect(page.getByTestId("button-join-waitlist")).not.toBeVisible();
  });

  test("a visitor can purchase a virtual ticket once sales are Open", async ({
    page,
  }) => {
    // Status is already Open from the previous test (shared in-memory state)
    await page.goto(`/venue/${venueId}`);

    await expect(page.getByTestId("button-buy-ticket")).toBeVisible();

    await page.getByTestId("input-guest-name").fill("E2E Tester");
    await page.getByTestId("input-guest-email").fill("e2e-buyer@playwright.test");

    await page.getByTestId("button-buy-ticket").click();

    // Confirmation message
    await expect(page.getByText(/you're in/i)).toBeVisible();
    await expect(page.getByText("e2e-buyer@playwright.test")).toBeVisible();
  });
});
