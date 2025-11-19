import { Router } from "express";
import { pool } from "./index";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// 🔹 REGISTER (no default role → null unless provided)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const role: string | null = req.body.role ?? null;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Missing fields" });

    // duplicate email
    const dup = await pool.query("SELECT id FROM users WHERE email=$1", [
      email.toLowerCase(),
    ]);
    if (dup.rowCount)
      return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `INSERT INTO users (auth_id, role, name, email, created_at)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id, name, email, role`,
      [hash, role, name, email.toLowerCase()]
    );

    const user = insert.rows[0];
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (e: any) {
    if (e?.code === "23514") {
      // CHECK constraint violation
      return res.status(400).json({ error: "Invalid role. Provide a valid role or omit it." });
    }
    console.error("[REGISTER ERROR]", e);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const q = await pool.query(
      "SELECT id, auth_id, name, email, role FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    const row = q.rows[0];
    if (!row) return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, row.auth_id);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ sub: row.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
      token,
    });
  } catch (e) {
    console.error("[LOGIN ERROR]", e);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
