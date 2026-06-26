import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET ?? "theater-demo-secret-key-do-not-use-in-prod";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } as JwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}
