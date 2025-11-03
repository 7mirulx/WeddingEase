import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import authRoutes from "./auth";

dotenv.config(); // ← load .env first

const app = express();
app.use(cors());
app.use(express.json());

// Use field-by-field env (avoids URL-encoding headaches)
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
});

// health (no DB) – always works
app.get("/health", (_req, res) => res.send("ok"));

// demo DB route
app.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (e: any) {
    console.error("DB error:", e?.message || e);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// mount auth AFTER app exists
app.use("/auth", authRoutes);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
