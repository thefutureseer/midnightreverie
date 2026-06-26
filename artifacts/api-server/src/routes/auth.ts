import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, toPublicUser } from "../lib/db";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/signup", async (req, res): Promise<void> => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    res.status(400).json({ error: "name, email, and password are required" });
    return;
  }
  if (typeof password !== "string" || password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existing = db.users.findByEmail(email);
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = db.users.create({ name, email, passwordHash });
  const token = signToken(user.id);

  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = db.users.findByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: toPublicUser(user) });
});

router.get("/auth/me", requireAuth, (req, res): void => {
  const user = db.users.findById(req.userId!);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

export default router;
