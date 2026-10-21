import { getDb, parseCookies } from "../../../src/utils/neonAuth";

export default async function handler(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.neon_session_token || req.body?.token;

  if (token) {
    try {
      const sql = getDb();
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
