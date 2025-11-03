import type { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Bentuk payload yang kita jangka
export interface AuthPayload extends JwtPayload {
  uid: number;
  role: string; // 'client' | 'vendor' | 'admin' pun boleh kalau nak ketatkan
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret"
    ) as AuthPayload;

    // simpan payload pada request
    (req as any).auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
