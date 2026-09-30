// Google tag: KODO.DIY GA4
(function () {
  const measurementId = "G-JPX7V11PWB";
  if (!measurementId || window.KODO_GOOGLE_TAG) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  function compact(payload) {
    return Object.fromEntries(
      Object.entries(payload || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
  }

  function itemFromProduct(product, quantity) {
    if (!product) return null;
    return compact({
      item_id: product.id || product.productId,
      item_name: product.title || product.name,
      item_category: product.category || product.gender || "streetwear",
      price: Number(product.price || product.item_price || 0),
      quantity: quantity || product.quantity || 1
    });
  }

  window.KODO_GOOGLE_TAG = {
    id: measurementId,
    event(name, params = {}) {
      if (!window.gtag || !name) return;
      window.gtag("event", name, compact(params));
    },
    viewItem(product) {
      const item = itemFromProduct(product);
      if (!item) return;
      this.event("view_item", {
        currency: product.currency || "INR",
        value: Number(product.price || 0),
        items: [item]
      });
    },
    addToCart(product, quantity = 1) {
      const item = itemFromProduct(product, quantity);
      if (!item) return;
      this.event("add_to_cart", {
        currency: product.currency || "INR",
        value: Number(product.price || 0) * quantity,
        items: [item]
      });
    },
    addToWishlist(product) {
      const item = itemFromProduct(product);
      if (!item) return;
      this.event("add_to_wishlist", {
        currency: product.currency || "INR",
        value: Number(product.price || 0),
        items: [item]
      });
    },
    beginCheckout(items, value, paymentMode) {
      const gaItems = (items || []).map((item) => itemFromProduct(item, item.quantity)).filter(Boolean);
      this.event("begin_checkout", {
        currency: "INR",
        value: Number(value || 0),
        payment_type: paymentMode,
        items: gaItems
      });
    }
  };
})();
