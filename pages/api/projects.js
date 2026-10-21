import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: "DATABASE_URL not configured" });

  try {
    const sql = neon(dbUrl);
    const projects = await sql`SELECT * FROM portfolio_projects ORDER BY priority ASC`;
    return res.json(projects);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
