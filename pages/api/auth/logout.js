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
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.neon_session_token || req.body?.token;
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;

  if (token && dbUrl) {
    try {
      const sql = neon(dbUrl);
      await sql`DELETE FROM neon_auth.session WHERE token = ${token}`;
    } catch (e) {
      console.error("Error deleting session:", e);
    }
  }

  // Clear cookie
  res.setHeader(
    "Set-Cookie",
    "neon_session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );

  return res.json({ success: true, message: "Logged out successfully" });
}
