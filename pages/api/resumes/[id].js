import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const { id } = req.query;
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: "DATABASE_URL not configured" });
  const sql = neon(dbUrl);

  if (req.method === "GET") {
    try {
      const rows = await sql`SELECT * FROM saved_resumes WHERE id = ${id}`;
      if (rows.length === 0) return res.status(404).json({ error: "Resume not found" });
      return res.json(rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM saved_resumes WHERE id = ${id}`;
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
