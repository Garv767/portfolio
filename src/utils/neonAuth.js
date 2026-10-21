import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

export function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL / NEON_DATABASE_URL is not configured");
  }
  return neon(dbUrl);
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${derivedKey.toString("hex")}.${salt}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !password) return false;
  if (storedHash.includes(".")) {
    const [expectedHash, salt] = storedHash.split(".");
    const actualKey = crypto.scryptSync(password, salt, 64);
    const expectedKey = Buffer.from(expectedHash, "hex");
    if (actualKey.length !== expectedKey.length) return false;
    return crypto.timingSafeEqual(actualKey, expectedKey);
  }
  // Fallback for plain text or legacy hashes
  return storedHash === password;
}

export function parseCookies(cookieHeader) {
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

export async function verifyNeonSession(req) {
  try {
    const cookies = req.headers?.cookie ? parseCookies(req.headers.cookie) : (req.cookies || {});
    const authHeader = req.headers?.authorization;
    let token = cookies.neon_session_token;

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return { authenticated: false };
    }

    const sql = getDb();
    const sessions = await sql`
      SELECT 
        s.id AS session_id,
        s.token,
        s."expiresAt",
        u.id AS user_id,
        u.name,
        u.email,
        u.role,
        u.banned
      FROM neon_auth.session s
      JOIN neon_auth.user u ON s."userId" = u.id
      WHERE s.token = ${token} 
        AND s."expiresAt" > NOW() 
        AND (u.banned IS NULL OR u.banned = false)
      LIMIT 1
    `;

    if (sessions.length === 0) {
      return { authenticated: false };
    }

    const s = sessions[0];
    return {
      authenticated: true,
      user: {
        id: s.user_id,
        name: s.name,
        email: s.email,
        role: s.role || "admin",
      },
      sessionId: s.session_id,
      expiresAt: s.expiresAt,
    };
  } catch (err) {
    console.error("Neon session verification failure:", err);
    return { authenticated: false, error: err.message };
  }
}

/**
 * Higher-order middleware function to protect API routes
 */
export function requireNeonAuth(handler) {
  return async (req, res) => {
    const session = await verifyNeonSession(req);
    if (!session.authenticated) {
      return res.status(401).json({
        error: "Unauthorized: Active Neon Auth session required to access this resource.",
      });
    }
    req.user = session.user;
    return handler(req, res);
  };
}
