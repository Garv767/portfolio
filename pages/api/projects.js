import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) return res.status(500).json({ error: "DATABASE_URL not configured" });

  try {
    const sql = neon(dbUrl);

    if (req.method === "GET") {
      const projects = await sql`SELECT * FROM portfolio_projects ORDER BY priority ASC`;
      return res.json(projects);
    }

    if (req.method === "POST" || req.method === "PUT") {
      const body = req.body;

      // Batch update (e.g. priorities after drag-and-drop)
      if (Array.isArray(body)) {
        for (const item of body) {
          if (item.repo_name) {
            await sql`
              INSERT INTO portfolio_projects (repo_name, priority, updated_at)
              VALUES (${item.repo_name}, ${item.priority ?? 0}, NOW())
              ON CONFLICT (repo_name) DO UPDATE 
              SET priority = EXCLUDED.priority, updated_at = NOW()
            `;
          }
        }
        return res.json({ success: true, count: body.length });
      }

      // Single item upsert
      const {
        repo_name,
        display_title,
        custom_description,
        custom_image_url,
        demo_url,
        is_visible,
        priority,
      } = body;

      if (!repo_name) {
        return res.status(400).json({ error: "repo_name is required" });
      }

      const result = await sql`
        INSERT INTO portfolio_projects (
          repo_name, 
          display_title, 
          custom_description, 
          custom_image_url, 
          demo_url, 
          is_visible, 
          priority, 
          updated_at
        )
        VALUES (
          ${repo_name},
          ${display_title || null},
          ${custom_description || null},
          ${custom_image_url || null},
          ${demo_url || null},
          ${is_visible ?? true},
          ${priority ?? 0},
          NOW()
        )
        ON CONFLICT (repo_name) DO UPDATE SET
          display_title = COALESCE(EXCLUDED.display_title, portfolio_projects.display_title),
          custom_description = COALESCE(EXCLUDED.custom_description, portfolio_projects.custom_description),
          custom_image_url = COALESCE(EXCLUDED.custom_image_url, portfolio_projects.custom_image_url),
          demo_url = EXCLUDED.demo_url,
          is_visible = COALESCE(EXCLUDED.is_visible, portfolio_projects.is_visible),
          priority = COALESCE(EXCLUDED.priority, portfolio_projects.priority),
          updated_at = NOW()
        RETURNING *
      `;

      return res.json({ success: true, project: result[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("API /api/projects error:", err);
    return res.status(500).json({ error: err.message });
  }
}
