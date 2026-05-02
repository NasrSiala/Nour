import { type Request, type Response, type NextFunction } from "express";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "schoolbox_salt").digest("hex");
}

export function generateToken(userId: number, role: string): string {
  const payload = JSON.stringify({ userId, role, exp: Date.now() + 8 * 60 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "schoolbox-secret")
    .update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const expected = crypto.createHmac("sha256", process.env.SESSION_SECRET || "schoolbox-secret")
      .update(encoded).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as Request & { user: { userId: number; role: string } }).user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: { userId: number; role: string } }).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
