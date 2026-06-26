import { Router, type IRouter } from "express";
import { db, toPublicUser } from "../lib/db";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/tickets/mock-success", requireAuth, (req, res): void => {
  const user = db.users.grantTicket(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    success: true,
    message: "Payment processed! Your ticket has been confirmed.",
    user: toPublicUser(user),
  });
});

export default router;
