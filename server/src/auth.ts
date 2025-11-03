import express, { Router } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();


const router = Router();
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
});

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    const googleId = payload.sub!;              // unique Google user id
    const email = payload.email || null;
    const name = payload.name || null;

    const authId = `google:${googleId}`;
    // default role boleh 'client' (atau ikut body kalau nak)
    const role = "client";

    // upsert user
    const { rows } = await pool.query(
      `INSERT INTO users (auth_id, email, name, role)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (auth_id) DO UPDATE SET email=EXCLUDED.email, name=EXCLUDED.name
       RETURNING id, auth_id, email, name, role`,
      [authId, email, name, role]
    );

    const user = rows[0];
    const token = jwt.sign(
      { uid: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });
  } catch (e: any) {
    console.error("Google auth error:", e?.message || e);
    res.status(401).json({ error: "Google sign-in failed" });
  }
});

export default router;
