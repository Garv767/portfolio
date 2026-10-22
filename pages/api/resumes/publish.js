import { neon } from "@neondatabase/serverless";
import { requireNeonAuth } from "../../../src/utils/neonAuth";

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeId } = req.body;
  if (!resumeId) {
    return res.status(400).json({ error: "resumeId is required" });
  }

  try {
    const sql = neon(dbUrl);
    // Set selected resume to is_published = true, and all others to false
    await sql`
      UPDATE public.resumes
      SET is_published = (id = ${resumeId});
    `;

    // Fetch the updated published resume
    const rows = await sql`
      SELECT id, title, target_company, target_role, template_name, s3_key, is_published, updated_at
      FROM public.resumes
      WHERE id = ${resumeId}
      LIMIT 1;
    `;

    return res.json({
      success: true,
      publishedResume: rows[0] || null,
    });
  } catch (err) {
    console.error("Publish resume error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export default requireNeonAuth(handler);
