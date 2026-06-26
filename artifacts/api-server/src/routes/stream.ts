import { Router, type IRouter } from "express";
import { db } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const STREAM_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
const STREAM_TYPE = "mp4";

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

export default router;
