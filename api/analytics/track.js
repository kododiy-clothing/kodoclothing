const MAX_EVENTS = 3000;

function store() {
  globalThis.KODO_ANALYTICS_EVENTS = globalThis.KODO_ANALYTICS_EVENTS || [];
  return globalThis.KODO_ANALYTICS_EVENTS;
}

function clean(value, max = 500) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function countryFromHeaders(req) {
  return clean(
    req.headers["x-vercel-ip-country"] ||
    req.headers["x-country-code"] ||
    req.headers["cf-ipcountry"] ||
    "Unknown",
    80
  );
}

function summarize(events) {
  const sessions = new Map();
  const pages = {};
  const countries = {};
  const clicks = {};
  let sales = 0;
  let revenue = 0;
  let addToCart = 0;
  let checkoutStarted = 0;
  let bounces = 0;

  for (const event of events) {
    const session = sessions.get(event.sessionId) || { events: 0, pageviews: 0, firstPage: event.page, lastPage: event.page };
    session.events += 1;
    session.lastPage = event.page || session.lastPage;
    if (event.type === "pageview") session.pageviews += 1;
    sessions.set(event.sessionId, session);

    if (event.page) pages[event.page] = (pages[event.page] || 0) + (event.type === "pageview" ? 1 : 0);
    if (event.country) countries[event.country] = (countries[event.country] || 0) + 1;
    if (event.type === "click" && event.label) clicks[event.label] = (clicks[event.label] || 0) + 1;
    if (event.type === "add_to_cart") addToCart += 1;
    if (event.type === "checkout_started") checkoutStarted += 1;
    if (event.type === "order_created") {
      sales += 1;
      revenue += Number(event.value || 0);
    }
  }

  sessions.forEach((session) => {
    if (session.pageviews <= 1 && session.events <= 2) bounces += 1;
  });

  const top = (obj) => Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name, count]) => ({ name, count }));

  return {
    totalEvents: events.length,
    visitors: sessions.size,
    pageviews: events.filter(e => e.type === "pageview").length,
    clicks: events.filter(e => e.type === "click").length,
    addToCart,
    checkoutStarted,
    sales,
    revenue,
    bounceRate: sessions.size ? Math.round((bounces / sessions.size) * 100) : 0,
    topPages: top(pages).filter(item => item.count > 0),
    topCountries: top(countries),
    topClicks: top(clicks),
    recentEvents: events.slice(-80).reverse()
  };
}

module.exports = async function handler(req, res) {
  const events = store();

  if (req.method === "GET") {
    return res.status(200).json({ success: true, summary: summarize(events) });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const body = req.body || {};
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: clean(body.type, 80) || "event",
    sessionId: clean(body.sessionId, 120) || `guest_${Date.now()}`,
    page: clean(body.page || body.path, 300),
    label: clean(body.label, 180),
    productId: clean(body.productId, 120),
    value: Number(body.value || 0),
    currency: clean(body.currency, 20),
    referrer: clean(body.referrer, 500),
    country: countryFromHeaders(req),
    userAgent: clean(req.headers["user-agent"], 240),
    createdAt: new Date().toISOString()
  };

  events.push(event);
  if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
  return res.status(200).json({ success: true, event });
};
