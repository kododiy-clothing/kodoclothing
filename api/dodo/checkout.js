const catalog = require("../../data/auto_products.json");

const DODO_API_BASE = process.env.DODO_API_BASE || "https://live.dodopayments.com";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.kodo.diy";

function getProductMap() {
  try {
    return JSON.parse(process.env.DODO_PRODUCT_MAP_JSON || "{}");
  } catch {
    return {};
  }
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

function trustedUnitPrice(item) {
  const itemId = String(item?.id || "");
  const productId = String(item?.productId || "");

  if (productId === "kd-street-combo-999" || itemId.startsWith("combo-")) return 999;
  if (productId === "kd-diy-custom" || itemId.startsWith("diy-")) {
    return String(item?.printStyle || "").toUpperCase().includes("PUFF") ? 799 : 699;
  }
  if (itemId.startsWith("mystery-rookie-")) return 999;
  if (itemId.startsWith("mystery-rebel-")) return 1799;
  if (itemId.startsWith("mystery-kingpin-")) return 2999;

  const product = catalog.find((entry) => {
    const id = String(entry?.id || "");
    return productId === id || itemId === id || itemId.startsWith(`${id}-`);
  });

  const price = Number(product?.price || 0);
  if (!product || !Number.isFinite(price) || price <= 0) {
    throw new Error("One or more cart items are not available in the live catalog");
  }
  return Math.round(price);
}

function calculateTrustedPricing(order) {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (!items.length) throw new Error("Cart is empty");

  let subtotal = 0;
  const trustedItems = items.slice(0, 100).map((rawItem) => {
    const item = { ...(rawItem || {}) };
    const quantity = Number.parseInt(item.quantity || 1, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      throw new Error("Invalid item quantity");
    }
    const price = trustedUnitPrice(item);
    subtotal += price * quantity;
    return { ...item, quantity, price };
  });

  const couponCode = String(order?.couponCode || "").trim().toUpperCase();
  const discount = couponCode === "KODO15" ? Math.round(subtotal * 0.15) : 0;
  const shipping = subtotal >= 799 || couponCode === "FREESHIP" ? 0 : 99;
  const total = Math.max(0, subtotal - discount + shipping);
  const paymentMode = String(order?.paymentMode || "prepaid");
  const gatewayAmount =
    paymentMode === "cod_advance"
      ? Math.min(total, Math.max(50, Math.round(total * 0.25)))
      : total;

  return {
    items: trustedItems,
    subtotal,
    discount,
    shipping,
    total,
    gatewayAmount,
    couponCode,
    paymentMode,
  };
}

function getGatewayProductId(firstItem) {
  const map = getProductMap();
  const productId = String(firstItem?.productId || "");
  const itemId = String(firstItem?.id || "");
  return (
    process.env.DODO_PRODUCT_ID_DEFAULT ||
    firstItem?.dodoProductId ||
    map[productId] ||
    map[itemId] ||
    null
  );
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
      error: "Payment service is not configured",
    });
  }

  const order = req.body || {};
  let pricing;
  try {
    pricing = calculateTrustedPricing(order);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error?.message || "Invalid cart",
    });
  }

  if (pricing.gatewayAmount < 50) {
    return res.status(400).json({
      success: false,
      error: "Minimum online payment amount is ₹50",
    });
  }

  const productId = getGatewayProductId(pricing.items[0]);
  if (!productId) {
    return res.status(500).json({
      success: false,
      error: "Payment product mapping is not configured",
    });
  }

  const customer = order.customer || {};
  const phone = formatPhoneNumber(customer.phone);
  if (!customer.name || !phone || !customer.address || !customer.city || !/^\d{6}$/.test(String(customer.pincode || ""))) {
    return res.status(400).json({
      success: false,
      error: "Complete delivery details are required",
    });
  }

  const orderId = String(order.orderId || "").trim();
  if (!/^KD-\d{6}$/.test(orderId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid order ID",
    });
  }

  const payload = {
    billing: {
      country: "IN",
      city: customer.city,
      street: customer.address,
      zipcode: String(customer.pincode),
    },
    customer: {
      email: customer.email || `${orderId.toLowerCase()}@kodo.diy`,
      name: customer.name,
      phone_number: phone,
    },
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: Math.round(pricing.gatewayAmount * 100),
      },
    ],
    payment_link: true,
    require_phone_number: true,
    billing_currency: "INR",
    allowed_payment_method_types: ["upi_collect", "upi_intent", "credit", "debit"],
    return_url: `${PUBLIC_SITE_URL.replace(/\/$/, "")}/track.html?id=${encodeURIComponent(orderId)}`,
    metadata: {
      order_id: orderId,
      source: "kodo-web-checkout",
      subtotal: String(pricing.subtotal),
      discount: String(pricing.discount),
      shipping: String(pricing.shipping),
      total: String(pricing.total),
      gateway_amount: String(pricing.gatewayAmount),
      payment_mode: pricing.paymentMode,
      coupon_code: pricing.couponCode,
    },
  };

  try {
    const response = await fetch(`${DODO_API_BASE.replace(/\/$/, "")}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Dodo checkout error", response.status, data);
      return res.status(502).json({
        success: false,
        error: "Unable to create secure payment. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      orderId,
      paymentId: data.payment_id,
      paymentLink: data.payment_link,
      checkoutUrl: data.payment_link,
      pricing: {
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shipping: pricing.shipping,
        total: pricing.total,
        gatewayAmount: pricing.gatewayAmount,
      },
    });
  } catch (error) {
    console.error("Dodo checkout request failed", error);
    return res.status(502).json({
      success: false,
      error: "Payment service is temporarily unavailable. Please try again.",
    });
  }
};
