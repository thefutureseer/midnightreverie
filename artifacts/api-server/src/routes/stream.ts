import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { db } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public video URL for the main Midnight Reverie show
const STREAM_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const STREAM_TYPE = "mp4";

// ── Main show: authenticated ticket holders ──────────────────────────────────

router.get("/stream/verify", requireAuth, (req, res): void => {
  const user = db.users.findById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (!user.hasTicket) {
    res.status(403).json({ error: "You don't have a ticket for this show" });
    return;
  }
  res.json({ url: STREAM_URL, type: STREAM_TYPE });
});

// ── Watch party: guest access by email ───────────────────────────────────────

router.post("/stream/verify-guest", (req, res): void => {
  const { email, venueId } = req.body ?? {};

  if (!email || !venueId) {
    res.status(400).json({ error: "email and venueId are required" });
    return;
  }

  const venue = db.venues.findById(venueId);
  if (!venue) {
    res.status(404).json({ error: "Venue not found" });
    return;
  }

  const ticket = db.watchPartyTickets.findByVenueAndEmail(venueId, email);
  if (!ticket || !ticket.hasAccess) {
    res.status(403).json({ error: "No valid ticket found for this email at this venue" });
    return;
  }

  // Issue a short-lived session token (mocked — just a UUID with the ticket id encoded)
  const sessionToken = `gst_${randomUUID().replace(/-/g, "")}_${ticket.id.slice(0, 8)}`;

  req.log.info({ venueId, guestEmail: email }, "Guest stream access granted");

  res.json({
    sessionToken,
    streamUrl: STREAM_URL,
    streamType: STREAM_TYPE,
    venueName: venue.venueName,
  });
});

export default router;
