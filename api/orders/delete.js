module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const orderId = String(req.body?.orderId || "").trim();
  if (!orderId) {
    return res.status(400).json({ success: false, error: "orderId is required" });
  }

  globalThis.KODO_DELETED_ORDERS = globalThis.KODO_DELETED_ORDERS || [];
  if (!globalThis.KODO_DELETED_ORDERS.includes(orderId)) {
    globalThis.KODO_DELETED_ORDERS.push(orderId);
  }

  return res.status(200).json({
    success: true,
    orderId,
    message: "Order delete acknowledged"
  });
};
