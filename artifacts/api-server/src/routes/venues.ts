import { Router, type IRouter } from "express";
import {
  db,
  toVenuePublic,
  calculateTier,
  logRevenue,
  PLATFORM_TICKET_CUT,
} from "../lib/db";
import { requireHost } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/venues", (req, res): void => {
  const all = db.venues.listAll().map((v) => toVenuePublic(v));
  res.json(all);
});

router.post("/venues", requireHost, (req, res): void => {
  const {
    venueName,
    capacitySeats,
    description,
    images,
    ticketPriceChargedByHost,
    performerName,
    showDate,
    showTime,
    location,
    totalPhysicalSeats,
  } = req.body ?? {};

  if (!venueName || !capacitySeats || !ticketPriceChargedByHost) {
    res.status(400).json({ error: "venueName, capacitySeats, and ticketPriceChargedByHost are required" });
    return;
  }

  const venue = db.venues.create({
    hostId: req.userId!,
    venueName,
    capacitySeats: Number(capacitySeats),
    description: description ?? null,
    images: Array.isArray(images) ? images : [],
    ticketPriceChargedByHost: Number(ticketPriceChargedByHost),
    performerName: performerName ?? null,
    showDate: showDate ?? null,
    showTime: showTime ?? null,
    location: location ?? null,
    totalPhysicalSeats: totalPhysicalSeats ? Number(totalPhysicalSeats) : 0,
  });

  req.log.info({ venueId: venue.id, hostId: req.userId }, "Venue created");
  res.status(201).json(toVenuePublic(venue));
});

router.get("/venues/:venueId", (req, res): void => {
  const raw = Array.isArray(req.params.venueId)
    ? req.params.venueId[0]
    : req.params.venueId;

  const venue = db.venues.findById(raw);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  res.json(toVenuePublic(venue));
});

// ── Sell-Out Trigger: physical ticket sale ───────────────────────────────────
// Requires the caller to be the venue's host (JWT-authenticated).

router.post("/venues/:venueId/physical-tickets", requireHost, (req, res): void => {
  const raw = Array.isArray(req.params.venueId)
    ? req.params.venueId[0]
    : req.params.venueId;

  const venue = db.venues.findById(raw);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  // Only the venue's own host may record physical sales
  if (venue.hostId !== req.userId) {
    res.status(403).json({ error: "You do not own this venue" });
    return;
  }

  if (venue.totalPhysicalSeats === 0) {
    res.status(400).json({ error: "This venue has no physical seats configured" });
    return;
  }

  if (venue.physicalSeatsSold >= venue.totalPhysicalSeats) {
    res.status(400).json({ error: "Physical venue is already sold out" });
    return;
  }

  const updated = db.venues.sellPhysicalTicket(venue.id)!;
  const soldOut = updated.physicalSeatsSold >= updated.totalPhysicalSeats;

  req.log.info(
    { venueId: venue.id, physicalSeatsSold: updated.physicalSeatsSold, virtualSalesStatus: updated.virtualSalesStatus },
    soldOut ? "Physical venue sold out — virtual sales now Open" : "Physical ticket sold"
  );

  res.json({
    venue: toVenuePublic(updated),
    message: soldOut
      ? "Physical venue is sold out — virtual ticket sales are now OPEN!"
      : `Physical seat sold. ${updated.totalPhysicalSeats - updated.physicalSeatsSold} remaining until virtual sales open.`,
    soldOut,
  });
});

// ── Sell-Out Trigger: join virtual waitlist ──────────────────────────────────

router.post("/venues/:venueId/waitlist", (req, res): void => {
  const raw = Array.isArray(req.params.venueId)
    ? req.params.venueId[0]
    : req.params.venueId;

  const venue = db.venues.findById(raw);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  if (!["Locked", "WaitlistOnly"].includes(venue.virtualSalesStatus)) {
    res.status(400).json({ error: "Waitlist is not available — virtual tickets are already open or closed" });
    return;
  }

  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const result = db.venues.joinWaitlist(venue.id, email)!;

  req.log.info({ venueId: venue.id, email, alreadyJoined: result.alreadyJoined }, "Waitlist join");

  res.json({
    success: true,
    alreadyJoined: result.alreadyJoined,
    waitlistCount: venue.virtualWaitlist.length,
    message: result.alreadyJoined
      ? "You are already on the waitlist. We'll notify you when virtual tickets open."
      : "You've been added to the waitlist! We'll notify you when virtual tickets open.",
  });
});

// ── Buy a virtual (watch party) ticket ──────────────────────────────────────

router.post("/venues/:venueId/tickets", (req, res): void => {
  const raw = Array.isArray(req.params.venueId)
    ? req.params.venueId[0]
    : req.params.venueId;

  const venue = db.venues.findById(raw);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  // Sell-Out Trigger gate
  if (venue.virtualSalesStatus !== "Open") {
    const statusMessages: Record<string, string> = {
      Locked: "Virtual ticket sales are locked until the physical venue sells out.",
      WaitlistOnly: "Virtual ticket sales are not yet open. Join the waitlist to be notified.",
      Closed: "Virtual ticket sales for this venue are closed.",
    };
    res.status(403).json({ error: statusMessages[venue.virtualSalesStatus] ?? "Virtual ticket sales are not available." });
    return;
  }

  const { guestName, guestEmail } = req.body ?? {};
  if (!guestName || !guestEmail) {
    res.status(400).json({ error: "guestName and guestEmail are required" });
    return;
  }

  const existing = db.watchPartyTickets.findByVenueAndEmail(venue.id, guestEmail);
  if (existing) {
    res.status(409).json({ error: "A ticket for this email already exists for this venue" });
    return;
  }

  const ticketsSold = db.watchPartyTickets.countByVenue(venue.id);

  if (ticketsSold >= venue.capacitySeats) {
    res.status(400).json({ error: "This venue is sold out" });
    return;
  }

  const tierInfo = calculateTier(venue.ticketPriceChargedByHost, ticketsSold);

  const ticket = db.watchPartyTickets.create({
    venueId: venue.id,
    guestName,
    guestEmail,
    purchasedAtPrice: tierInfo.currentPrice,
  });

  const platformCut = parseFloat((ticket.purchasedAtPrice * PLATFORM_TICKET_CUT).toFixed(2));
  const logMsg = `Ticket sold to ${guestEmail} for ${venue.venueName} at $${ticket.purchasedAtPrice} — Midnight Reverie receives 3% ($${platformCut})`;

  logRevenue({
    timestamp: new Date().toISOString(),
    type: "guest_ticket",
    hostId: venue.hostId,
    venueId: venue.id,
    amount: ticket.purchasedAtPrice,
    description: logMsg,
  });

  req.log.info({ venueId: venue.id, guestEmail, price: ticket.purchasedAtPrice, platformCut }, "Watch party ticket sold");

  const updatedTier = calculateTier(
    venue.ticketPriceChargedByHost,
    db.watchPartyTickets.countByVenue(venue.id)
  );

  res.status(201).json({
    success: true,
    ticket: {
      id: ticket.id,
      venueId: ticket.venueId,
      guestName: ticket.guestName,
      guestEmail: ticket.guestEmail,
      purchasedAtPrice: ticket.purchasedAtPrice,
      hasAccess: ticket.hasAccess,
    },
    tierInfo: updatedTier,
    platformLog: logMsg,
  });
});

export default router;
