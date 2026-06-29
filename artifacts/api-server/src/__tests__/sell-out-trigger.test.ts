/**
 * Sell-Out Trigger — Integration & Unit Tests
 *
 * Tests the complete flow where virtual ticket sales are locked until
 * the physical venue sells out, including waitlist deduplication.
 *
 * Strategy: create test-specific data directly via `db` + `signToken`
 * so tests are isolated from the seed data and run without HTTP login.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { db } from "../lib/db.js";
import { signToken } from "../lib/jwt.js";

// ── Test fixtures ─────────────────────────────────────────────────────────────

const HOST_EMAIL = "testhost-sellout@integration.test";
const FAN_EMAIL = "testfan-sellout@integration.test";
const BUYER_EMAIL = "testbuyer-sellout@integration.test";
const TOTAL_PHYSICAL_SEATS = 3; // small so tests run quickly

let hostToken: string;
let venueId: string;

beforeAll(() => {
  // Create a host user directly (bypasses bcrypt — no password needed for JWT tests)
  const host = db.users.create({
    name: "Test Host",
    email: HOST_EMAIL,
    passwordHash: "not-used-in-tests",
    isHost: true,
  });

  hostToken = signToken(host.id);

  // Create a venue with a small physical-seat cap so the sell-out is quick
  const venue = db.venues.create({
    hostId: host.id,
    venueName: "Sell-Out Test Venue",
    capacitySeats: 50,
    ticketPriceChargedByHost: 10,
    totalPhysicalSeats: TOTAL_PHYSICAL_SEATS,
  });

  venueId = venue.id;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const joinWaitlist = (email: string) =>
  request(app)
    .post(`/api/venues/${venueId}/waitlist`)
    .send({ email })
    .set("Content-Type", "application/json");

const sellPhysicalTicket = () =>
  request(app)
    .post(`/api/venues/${venueId}/physical-tickets`)
    .set("Authorization", `Bearer ${hostToken}`);

const buyVirtualTicket = (guestName: string, guestEmail: string) =>
  request(app)
    .post(`/api/venues/${venueId}/tickets`)
    .send({ guestName, guestEmail })
    .set("Content-Type", "application/json");

const getVenue = () =>
  request(app).get(`/api/venues/${venueId}`);

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Sell-Out Trigger", () => {
  describe("Initial state", () => {
    it("venue starts with virtualSalesStatus = Locked", async () => {
      const res = await getVenue();
      expect(res.status).toBe(200);
      expect(res.body.virtualSalesStatus).toBe("Locked");
      expect(res.body.physicalSeatsSold).toBe(0);
      expect(res.body.totalPhysicalSeats).toBe(TOTAL_PHYSICAL_SEATS);
    });

    it("blocks virtual ticket purchase while Locked", async () => {
      const res = await buyVirtualTicket("Eager Fan", FAN_EMAIL);
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/locked/i);
    });
  });

  describe("Test Case 1 — join waitlist when Locked", () => {
    it("allows a new email to join the waitlist", async () => {
      const res = await joinWaitlist(FAN_EMAIL);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alreadyJoined).toBe(false);
      expect(res.body.waitlistCount).toBe(1);
      expect(res.body.message).toMatch(/added to the waitlist/i);
    });

    it("reflects waitlist count on the venue", async () => {
      const res = await getVenue();
      expect(res.body.virtualWaitlistCount).toBe(1);
    });
  });

  describe("Test Case 2 — no duplicate waitlist entries", () => {
    it("returns alreadyJoined=true when the same email re-submits", async () => {
      const res = await joinWaitlist(FAN_EMAIL);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.alreadyJoined).toBe(true);
    });

    it("waitlist count does not grow on a duplicate join", async () => {
      const res = await getVenue();
      // Count stays at 1 — no phantom ObjectIds added
      expect(res.body.virtualWaitlistCount).toBe(1);
    });

    it("email casing is normalised — uppercase re-join is still a duplicate", async () => {
      const res = await joinWaitlist(FAN_EMAIL.toUpperCase());
      expect(res.body.alreadyJoined).toBe(true);
      const venueRes = await getVenue();
      expect(venueRes.body.virtualWaitlistCount).toBe(1);
    });
  });

  describe("Test Case 3 — physical sell-out unlocks virtual sales", () => {
    it("rejects physical-ticket sales from unauthenticated callers", async () => {
      const res = await request(app).post(`/api/venues/${venueId}/physical-tickets`);
      expect(res.status).toBe(401);
    });

    it("sells physical tickets one by one and status stays Locked until sold out", async () => {
      // Sell seats 1 and 2 — still NOT sold out
      for (let i = 1; i < TOTAL_PHYSICAL_SEATS; i++) {
        const res = await sellPhysicalTicket();
        expect(res.status).toBe(200);
        expect(res.body.venue.physicalSeatsSold).toBe(i);
        expect(res.body.soldOut).toBe(false);
        expect(res.body.venue.virtualSalesStatus).toBe("Locked");
      }
    });

    it("selling the final physical seat flips virtualSalesStatus to Open", async () => {
      const res = await sellPhysicalTicket(); // seat 3 of 3
      expect(res.status).toBe(200);
      expect(res.body.soldOut).toBe(true);
      expect(res.body.venue.virtualSalesStatus).toBe("Open");
      expect(res.body.venue.physicalSeatsSold).toBe(TOTAL_PHYSICAL_SEATS);
      expect(res.body.message).toMatch(/virtual ticket sales are now OPEN/i);
    });

    it("venue endpoint confirms status is now Open", async () => {
      const res = await getVenue();
      expect(res.body.virtualSalesStatus).toBe("Open");
    });

    it("allows virtual ticket purchase once Open", async () => {
      const res = await buyVirtualTicket("Happy Buyer", BUYER_EMAIL);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.guestEmail).toBe(BUYER_EMAIL);
      expect(res.body.ticket.purchasedAtPrice).toBeGreaterThan(0);
    });

    it("rejects a second purchase from the same email (no duplicates)", async () => {
      const res = await buyVirtualTicket("Happy Buyer Again", BUYER_EMAIL);
      expect(res.status).toBe(409);
    });

    it("prevents more physical sales once already sold out", async () => {
      const res = await sellPhysicalTicket();
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already sold out/i);
    });

    it("joining the waitlist returns 400 once status is Open", async () => {
      const res = await joinWaitlist("latecomer@example.com");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not available/i);
    });
  });
});
