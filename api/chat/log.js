const MAX_EVENTS = 500;

function getStore() {
  globalThis.KODO_CHAT_LOGS = globalThis.KODO_CHAT_LOGS || [];
  return globalThis.KODO_CHAT_LOGS;
}

function cleanText(value, max = 1200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

module.exports = async function handler(req, res) {
  const store = getStore();

  if (req.method === "GET") {
    const sessionId = cleanText(req.query?.sessionId, 120);
    const events = sessionId ? store.filter((event) => event.sessionId === sessionId) : store;
    return res.status(200).json({
      success: true,
      conversations: events.slice(-MAX_EVENTS).reverse()
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const body = req.body || {};
  const event = {
    id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: cleanText(body.sessionId, 120) || `guest_${Date.now()}`,
    sender: body.sender === "bot" ? "bot" : "customer",
    message: cleanText(body.message),
    page: cleanText(body.page, 300),
    productId: cleanText(body.productId, 120),
    createdAt: new Date().toISOString()
  };

  if (!event.message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }

  store.push(event);
  if (store.length > MAX_EVENTS) store.splice(0, store.length - MAX_EVENTS);

  return res.status(200).json({ success: true, event });
};
