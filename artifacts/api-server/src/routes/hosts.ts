import { Router, type IRouter } from "express";
import { db, toPublicUser, toVenuePublic, HOST_LICENSE_FEE, logRevenue } from "../lib/db";
import { requireAuth, requireHost } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/hosts/license", requireAuth, (req, res): void => {
  const user = db.users.findById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  if (user.isHost) {
    res.status(400).json({ error: "You are already a licensed host" });
    return;
  }

  db.users.grantHostLicense(user.id);

  logRevenue({
    timestamp: new Date().toISOString(),
    type: "license",
    hostId: user.id,
    amount: HOST_LICENSE_FEE,
    description: `Host license purchased by ${user.email} — Midnight Reverie receives $${HOST_LICENSE_FEE.toFixed(2)} flat fee`,
  });

  req.log.info({ userId: user.id }, "Host license granted");

  res.json({
    success: true,
    message: `Welcome, ${user.name}! Your $${HOST_LICENSE_FEE.toFixed(2)} licensing fee has been processed. You can now create venue listings.`,
    user: toPublicUser(db.users.findById(user.id)!),
  });
});

router.get("/hosts/dashboard", requireHost, (req, res): void => {
  const user = db.users.findById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const hostVenues = db.venues.listByHost(user.id);
  const { guestRevenue, platformRevenue } = db.revenue.totalForHost(user.id);

  const revenueSummaries = hostVenues.map((v) => {
    const { guestRevenue: vRev, platformCut } = db.revenue.summaryByVenue(v.id);
    return {
      venueId: v.id,
      venueName: v.venueName,
      ticketsSold: db.watchPartyTickets.countByVenue(v.id),
      guestRevenue: vRev,
      platformCut,
    };
  });

  res.json({
    user: toPublicUser(user),
    venues: hostVenues.map(toVenuePublic),
    totalRevenue: guestRevenue,
    platformRevenue,
    revenueSummaries,
  });
});

export default router;
