import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import authRoutes from "./auth";
import { requireAuth } from "./myAuth";

dotenv.config(); // ← load .env first

const app = express();

// ── Middleware
app.use(cors()); // optionally: cors({ origin: ["http://localhost:19006"] })
app.use(express.json());

// ── Postgres Pool (exported so other modules can use it, e.g. auth.ts)
export const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
});

// ── Health (no DB)
app.get("/health", (_req, res) => res.send("ok"));

// ── Demo DB route (adjust table name if needed)
// If your table is `app_user` (as in our schema), change to: SELECT * FROM app_user
app.get("/", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (e: any) {
    console.error("DB error:", e?.message || e);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// ── Auth routes
app.use("/auth", authRoutes);

// ── Vendors routes
app.get("/vendors", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, owner_id, business_name, category, is_approved, created_at FROM vendors WHERE is_approved = true ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (e: any) {
    console.error("Vendors error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

app.get("/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, owner_id, business_name, category, is_approved, created_at FROM vendors WHERE id = $1 AND is_approved = true",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found" });
    }
    res.json(result.rows[0]);
  } catch (e: any) {
    console.error("Vendor detail error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

// ── My Weddings route (requires auth)
app.get("/weddings/my", requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth;
    const userId = (auth as any)?.sub || (auth as any)?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    const result = await pool.query(
      "SELECT id, title, date, venue, status FROM weddings WHERE owner_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    console.error("Weddings error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch weddings" });
  }
});

// ── My Bookings route (requires auth)
app.get("/bookings/my", requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth;
    // Get user ID from token - JWT uses 'sub' field (see auth.ts line 35, 65)
    const userId = (auth as any)?.sub || (auth as any)?.uid;
    
    if (!userId) {
      return res.status(401).json({ error: "User ID not found in token" });
    }

    // Get user's weddings first
    const weddingsResult = await pool.query(
      "SELECT id, title, date, venue, status FROM weddings WHERE owner_id = $1",
      [userId]
    );
    const weddingIds = weddingsResult.rows.map((w: any) => w.id);
    
    if (weddingIds.length === 0) {
      return res.json([]);
    }

    // Get bookings for user's weddings, join with vendors
    const bookingsResult = await pool.query(
      `SELECT 
        b.id,
        b.wedding_id,
        b.vendor_id,
        b.status,
        b.price,
        b.created_at,
        json_build_object(
          'id', w.id,
          'title', w.title,
          'date', w.date,
          'venue', w.venue,
          'status', w.status
        ) as wedding,
        CASE 
          WHEN b.vendor_id IS NOT NULL THEN
            json_build_object(
              'id', v.id,
              'business_name', v.business_name,
              'category', v.category
            )
          ELSE NULL
        END as vendor
      FROM bookings b
      LEFT JOIN weddings w ON b.wedding_id = w.id
      LEFT JOIN vendors v ON b.vendor_id = v.id
      WHERE b.wedding_id = ANY($1::int[])
      ORDER BY b.created_at DESC`,
      [weddingIds]
    );

    // json_build_object already returns JSON, no need to parse
    res.json(bookingsResult.rows);
  } catch (e: any) {
    console.error("Bookings error:", e?.message || e);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ── Create Booking route (requires auth)
app.post("/bookings", requireAuth, async (req, res) => {
  try {
    const auth = (req as any).auth;
    const userId = (auth as any)?.sub || (auth as any)?.uid;
    const { wedding_id, vendor_id, status, price } = req.body;

    if (!wedding_id || !vendor_id) {
      return res.status(400).json({ error: "wedding_id and vendor_id are required" });
    }

    // Verify wedding belongs to user
    const weddingCheck = await pool.query(
      "SELECT id FROM weddings WHERE id = $1 AND owner_id = $2",
      [wedding_id, userId]
    );
    if (weddingCheck.rows.length === 0) {
      return res.status(403).json({ error: "Wedding not found or access denied" });
    }

    // Verify vendor exists and is approved
    const vendorCheck = await pool.query(
      "SELECT id FROM vendors WHERE id = $1 AND is_approved = true",
      [vendor_id]
    );
    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({ error: "Vendor not found or not approved" });
    }

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (wedding_id, vendor_id, status, price, created_at)
       VALUES ($1, $2, $3, $4, now())
       RETURNING id, wedding_id, vendor_id, status, price, created_at`,
      [wedding_id, vendor_id, status || "pending", price || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (e: any) {
    console.error("Create booking error:", e?.message || e);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// ── Basic error handler (keeps responses consistent)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// ── Start server
const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";
const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

// ── Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down...");
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
});
