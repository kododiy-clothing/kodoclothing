const DODO_API_BASE = process.env.DODO_API_BASE || "https://live.dodopayments.com";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://kododiy-clothing.github.io/kodoclothing";
const SEND_DYNAMIC_AMOUNTS = String(process.env.DODO_SEND_DYNAMIC_AMOUNTS || "true").toLowerCase() !== "false";

function getProductMap() {
  try {
    return JSON.parse(process.env.DODO_PRODUCT_MAP_JSON || "{}");
  } catch {
    return {};
  }
}

function getDodoProductId(item) {
  const productMap = getProductMap();
  const localId = item.productId || String(item.id || "").split("-")[0];
  return item.dodoProductId || productMap[localId] || process.env.DODO_PRODUCT_ID_DEFAULT;
}

function formatPhoneNumber(phone) {
  const raw = String(phone || "").trim();
  if (!raw) return null;
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return raw;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: "DODO_PAYMENTS_API_KEY is not configured on the backend"
    });
  }

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) {
    return res.status(400).json({ success: false, error: "Cart is empty" });
  }

  const productCart = [];
  for (const item of items) {
    const productId = getDodoProductId(item);
    if (!productId) {
      return res.status(500).json({
        success: false,
        error: "DODO_PRODUCT_ID_DEFAULT or DODO_PRODUCT_MAP_JSON is required"
      });
    }
    const cartItem = {
      product_id: productId,
      quantity: Math.max(1, Number.parseInt(item.quantity || 1, 10))
    };
    if (SEND_DYNAMIC_AMOUNTS) {
      cartItem.amount = Math.max(1, Math.round(Number(item.price || 0) * 100));
    }
    productCart.push(cartItem);
  }

  const customer = order.customer || {};
  const payload = {
    billing: {
      country: "IN",
      city: customer.city || "",
      street: customer.address || "",
      zipcode: customer.pincode || ""
    },
    customer: {
      email: customer.email || `${String(order.orderId || "order").toLowerCase()}@kododiy.local`,
      name: customer.name || "KODO Customer",
      phone_number: formatPhoneNumber(customer.phone)
    },
    product_cart: productCart.slice(0, 100),
    payment_link: true,
    require_phone_number: true,
    billing_currency: "INR",
    allowed_payment_method_types: ["upi_collect", "upi_intent", "credit", "debit"],
    return_url: `${PUBLIC_SITE_URL}/track.html?id=${encodeURIComponent(order.orderId || "")}`,
    metadata: {
      order_id: order.orderId || "",
      source: "kodo-web-checkout",
      subtotal: String(order.subtotal || ""),
      discount: String(order.discount || ""),
      shipping: String(order.shipping || ""),
      total: String(order.total || "")
    }
  };

  const response = await fetch(`${DODO_API_BASE.replace(/\/$/, "")}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return res.status(response.status).json({
      success: false,
      error: data.error?.message || data.message || JSON.stringify(data)
    });
  }

  return res.status(200).json({
    success: true,
    orderId: order.orderId,
    paymentId: data.payment_id,
    paymentLink: data.payment_link,
    checkoutUrl: data.payment_link
  });
};
