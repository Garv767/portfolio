import { neon } from "@neondatabase/serverless";

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    let [name, ...rest] = cookie.split("=");
    name = name?.trim();
    if (!name) return;
    const value = rest.join("=").trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

export default async function handler(req, res) {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    return res.status(200).json({ authenticated: false });
  }

  // Extract token from cookie or header
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization;
  let token = cookies.neon_session_token;

  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const sql = neon(dbUrl);
    const sessions = await sql`
      SELECT 
        s.id AS session_id,
        s.token,
        s."expiresAt",
        u.id AS user_id,
        u.name,
        u.email,
        u.role
      FROM neon_auth.session s
      JOIN neon_auth.user u ON s."userId" = u.id
      WHERE s.token = ${token} AND s."expiresAt" > NOW()
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return res.status(200).json({ authenticated: false });
    }

    const s = sessions[0];
    return res.status(200).json({
      authenticated: true,
      user: {
        id: s.user_id,
        name: s.name,
        email: s.email,
        role: s.role || "admin",
      },
      expiresAt: s.expiresAt,
    });
  } catch (err) {
    console.error("Neon session verification error:", err);
    return res.status(200).json({ authenticated: false });
  }
}
