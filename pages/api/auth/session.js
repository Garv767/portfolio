import { verifyNeonSession } from "../../../src/utils/neonAuth";

export default async function handler(req, res) {
  try {
    const session = await verifyNeonSession(req);
    if (!session.authenticated) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({
      authenticated: true,
      user: session.user,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(200).json({ authenticated: false });
  }
}
