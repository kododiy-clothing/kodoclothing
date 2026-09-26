module.exports = async function handler(req, res) {
  const country = String(
    req.headers["x-vercel-ip-country"] ||
    req.headers["x-country-code"] ||
    req.headers["cf-ipcountry"] ||
    "IN"
  ).toUpperCase();

  return res.status(200).json({
    success: true,
    country,
    currency: country === "IN" ? "INR" : "USD"
  });
};
