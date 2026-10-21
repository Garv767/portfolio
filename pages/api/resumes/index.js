import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: "DATABASE_URL not configured" });
  const sql = neon(dbUrl);

  if (req.method === "GET") {
    try {
      const resumes = await sql`
        SELECT id, title, target_company, target_role, template_name, updated_at 
        FROM saved_resumes 
        ORDER BY updated_at DESC
      `;
      return res.json(resumes);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === "POST") {
    const { id, title, target_company, target_role, jd_text, template_name, latex_content } = req.body;
    if (!title || !latex_content) {
      return res.status(400).json({ error: "Title and LaTeX content required" });
    }

    try {
      let result;
      if (id) {
        result = await sql`
          UPDATE saved_resumes SET
            title = ${title},
            target_company = ${target_company || ""},
            target_role = ${target_role || ""},
            jd_text = ${jd_text || ""},
            template_name = ${template_name || "jake-resume"},
            latex_content = ${latex_content},
            updated_at = NOW()
          WHERE id = ${id}
          RETURNING *
        `;
      } else {
        result = await sql`
          INSERT INTO saved_resumes (
            title, target_company, target_role, jd_text, template_name, latex_content, updated_at
          ) VALUES (
            ${title}, ${target_company || ""}, ${target_role || ""}, ${jd_text || ""}, ${template_name || "jake-resume"}, ${latex_content}, NOW()
          )
          RETURNING *
        `;
      }
      return res.json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
