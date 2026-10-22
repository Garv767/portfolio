import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT id, title, target_company, target_role, template_name, is_published, updated_at
      FROM public.resumes
      ORDER BY is_published DESC, updated_at DESC
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return res.json({ hasPublished: false, resume: null });
    }

    return res.json({
      hasPublished: true,
      resume: rows[0],
      pdfUrl: "/api/resumes/published-pdf",
    });
  } catch (err) {
    console.error("Get published resume error:", err);
    return res.status(500).json({ error: err.message });
  }
}
