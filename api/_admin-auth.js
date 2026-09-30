async function verifyAdminRequest(req) {
  const auth = String(req.headers?.authorization || "");
  if (!auth.startsWith("Bearer ")) return false;

  const token = auth.slice(7).trim();
  if (!token) return false;

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
    );
    if (!response.ok) return false;

    const profile = await response.json();
    const expectedEmail = String(
      process.env.KODO_ADMIN_EMAIL || "kododiy@gmail.com"
    ).toLowerCase();
    const expectedAudience = String(process.env.GOOGLE_CLIENT_ID || "");
    const exp = Number(profile.exp || 0);

    return (
      String(profile.email || "").toLowerCase() === expectedEmail &&
      String(profile.email_verified || "").toLowerCase() === "true" &&
      (!expectedAudience || profile.aud === expectedAudience) &&
      exp * 1000 > Date.now()
    );
  } catch (error) {
    console.error("Admin token verification failed", error);
    return false;
  }
}

async function requireAdmin(req, res) {
  if (await verifyAdminRequest(req)) return true;
  res.status(401).json({ success: false, error: "Admin authentication required" });
  return false;
}

module.exports = { verifyAdminRequest, requireAdmin };
