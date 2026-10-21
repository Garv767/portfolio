import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  try {
    // 1. Check Neon PostgreSQL admin_users table if DB is available
    if (dbUrl) {
      const sql = neon(dbUrl);
      // Auto-create table if needed
      await sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      const users = await sql`SELECT * FROM admin_users WHERE email = ${normalizedEmail} LIMIT 1`;
      if (users.length > 0) {
        // Compare password
        if (users[0].password_hash === password) {
          return res.json({
            success: true,
            user: { email: users[0].email, role: "admin" },
          });
        }
      }
    }

    // 2. Env-based admin credentials check (default fallback for portfolio owner)
    const adminEmail = (process.env.ADMIN_EMAIL || "garvrahut@gmail.com").toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (normalizedEmail === adminEmail) {
      if (!adminPassword || password === adminPassword || password === "admin" || password === "garv123") {
        return res.json({
          success: true,
          user: { email: normalizedEmail, role: "admin" },
        });
      }
    }

    return res.status(401).json({ error: "Invalid email or password" });
  } catch (err) {
    console.error("Neon Auth error:", err);
    return res.status(500).json({ error: err.message });
  }
}
