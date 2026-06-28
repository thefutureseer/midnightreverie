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

router.post("/venues/:venueId/tickets", (req, res): void => {
  const raw = Array.isArray(req.params.venueId)
    ? req.params.venueId[0]
    : req.params.venueId;

  const venue = db.venues.findById(raw);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const { guestName, guestEmail } = req.body ?? {};
  if (!guestName || !guestEmail) {
    res.status(400).json({ error: "guestName and guestEmail are required" });
    return;
  }

  // Check for duplicate
  const existing = db.watchPartyTickets.findByVenueAndEmail(venue.id, guestEmail);
  if (existing) {
    res.status(409).json({ error: "A ticket for this email already exists for this venue" });
    return;
  }

  const ticketsSold = db.watchPartyTickets.countByVenue(venue.id);

  // Check capacity
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

  // Return updated tier after purchase
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
