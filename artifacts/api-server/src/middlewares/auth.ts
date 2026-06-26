import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import { db } from "../lib/db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    const user = db.users.findById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
