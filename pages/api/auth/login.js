import crypto from "crypto";
import { getDb, hashPassword, verifyPassword } from "../../../src/utils/neonAuth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const sql = getDb();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify user dynamically in neon_auth.user (No hardcoded emails)
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role,
        u.banned,
        a.id AS account_id, 
        a.password AS password_hash
      FROM neon_auth.user u
      LEFT JOIN neon_auth.account a 
        ON a."userId" = u.id AND a."providerId" = 'credential'
      WHERE LOWER(u.email) = ${normalizedEmail}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: "Access denied. Email is not registered as an authorized user in Neon Auth.",
      });
    }

    const user = users[0];
    if (user.banned) {
      return res.status(403).json({ error: "This Neon Auth account is suspended." });
    }

    // 2. Password verification & first-time credential setup
    if (!user.password_hash) {
      // First-time login: Securely store password hash using scrypt (Better Auth format)
      const newHash = hashPassword(password);
      if (user.account_id) {
        await sql`
          UPDATE neon_auth.account 
          SET password = ${newHash}, "updatedAt" = NOW() 
          WHERE id = ${user.account_id}
        `;
      } else {
        const newAccountId = crypto.randomUUID();
        await sql`
          INSERT INTO neon_auth.account (
            id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
          ) VALUES (
            ${newAccountId}, ${user.id}, 'credential', ${user.id}, ${newHash}, NOW(), NOW()
          )
        `;
      }
    } else {
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid password for this Neon Auth account." });
      }
    }

    // 3. Create real session in neon_auth.session
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day session
    const userAgent = req.headers["user-agent"] || "Unknown Browser";
    const ipAddress =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    await sql`
      INSERT INTO neon_auth.session (
        id, "userId", token, "expiresAt", "createdAt", "updatedAt", "userAgent", "ipAddress"
      ) VALUES (
        ${sessionId}, ${user.id}, ${token}, ${expiresAt}, NOW(), NOW(), ${userAgent}, ${String(ipAddress)}
      )
    `;

    // 4. Set HTTP-only secure cookie
    const isProd = process.env.NODE_ENV === "production";
    res.setHeader(
      "Set-Cookie",
      `neon_session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${
        isProd ? "; Secure" : ""
      }`
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "admin",
      },
    });
  } catch (err) {
    console.error("Neon Auth login error:", err);
    return res.status(500).json({ error: err.message || "Authentication error" });
  }
}
