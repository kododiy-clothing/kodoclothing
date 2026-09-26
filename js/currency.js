(function () {
  const USD_RATE = 83;
  const saved = localStorage.getItem("KODO_DISPLAY_CURRENCY");
  window.KODO_DISPLAY_CURRENCY = saved || "INR";

  window.KODO_FORMAT_MONEY = function formatMoney(value) {
    const inr = Number(value || 0);
    if (window.KODO_DISPLAY_CURRENCY === "USD") {
      return `$${Math.max(1, Math.round(inr / USD_RATE))}`;
    }
    return `₹${Math.round(inr).toLocaleString("en-IN")}`;
  };

  fetch("/api/geo")
    .then((res) => res.ok ? res.json() : null)
    .then((data) => {
      if (!data?.currency) return;
      const next = data.currency === "USD" ? "USD" : "INR";
      if (next !== window.KODO_DISPLAY_CURRENCY) {
        window.KODO_DISPLAY_CURRENCY = next;
        localStorage.setItem("KODO_DISPLAY_CURRENCY", next);
        window.dispatchEvent(new CustomEvent("kodo:currencychange", { detail: { currency: next } }));
        if (!sessionStorage.getItem("KODO_CURRENCY_RELOADED")) {
          sessionStorage.setItem("KODO_CURRENCY_RELOADED", "1");
          window.location.reload();
        }
      }
    })
    .catch(() => {});
})();
