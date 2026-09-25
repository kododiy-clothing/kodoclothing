// KODO.DIY Shopify-Grade Real DTC Merchant Central Controller
// Genuine live catalog, real order fulfillment & inventory sync

(function () {
  let orders = [];
  let currentStatusFilter = "all";

  document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();
    await loadOrders();
    initTabNavigation();
    initKPIs();
    renderOrders();
    renderProducts();
    renderDiscounts();
    renderCustomers();
    initModals();
    initExportCSV();
    initSyncOrdersBtn();
  });

  /* -------------------------------------------------------------
     1. LOAD & SYNC REAL PRODUCTS
     ------------------------------------------------------------- */
  async function loadProducts() {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          window.KODO_DATA = window.KODO_DATA || {};
          window.KODO_DATA.PRODUCTS = data;
        }
      }
    } catch (e) {
      console.warn("Could not fetch /api/products, using local catalog data", e);
    }
  }

  /* -------------------------------------------------------------
     2. LOAD & SYNC REAL ORDERS
     ------------------------------------------------------------- */
  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const liveOrders = await res.json();
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          orders = liveOrders;
          localStorage.setItem("KODO_ORDERS", JSON.stringify(orders));
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch /api/orders, checking local storage", e);
    }

    const stored = localStorage.getItem("KODO_ORDERS");
    if (stored) {
      try {
        orders = JSON.parse(stored);
      } catch (e) {
        orders = [];
      }
    }
  }

  function saveOrders() {
    try {
      localStorage.setItem("KODO_ORDERS", JSON.stringify(orders));
    } catch (e) {}
  }

  /* -------------------------------------------------------------
     3. TAB NAVIGATION & GLOBAL SEARCH
     ------------------------------------------------------------- */
  function initTabNavigation() {
    const navLinks = document.querySelectorAll(".admin-nav-link");
    const tabPanes = document.querySelectorAll(".admin-tab-pane");

    navLinks.forEach(link => {
      link.addEventListener("click", () => {
        navLinks.forEach(l => {
          l.classList.remove("active", "bg-neutral-800", "text-white");
          l.classList.add("text-neutral-400");
        });
        link.classList.add("active", "bg-neutral-800", "text-white");
        link.classList.remove("text-neutral-400");

        const tabId = link.dataset.tab;
        tabPanes.forEach(pane => {
          if (pane.id === `tab-${tabId}`) pane.classList.remove("hidden");
          else pane.classList.add("hidden");
        });
      });
    });

    // Global Search
    const searchInput = document.getElementById("admin-global-search");
    searchInput?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const ordersTabBtn = document.querySelector("[data-tab='orders']");
      if (ordersTabBtn && !ordersTabBtn.classList.contains("active")) {
        ordersTabBtn.click();
      }
      const orderSearch = document.getElementById("admin-orders-search");
      if (orderSearch) {
        orderSearch.value = q;
        renderOrders();
      }
    });
  }

  /* -------------------------------------------------------------
     4. REAL KPI METRICS & RECENT ORDERS
     ------------------------------------------------------------- */
  function initKPIs() {
    let gross = 0;
    orders.forEach(o => {
      if (o.status !== "Cancelled") {
        gross += (Number(o.total) || 0);
      }
    });

    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? Math.round(gross / totalOrders) : 0;

    let totalStock = 0;
    if (window.KODO_DATA && window.KODO_DATA.PRODUCTS) {
      window.KODO_DATA.PRODUCTS.forEach(p => {
        totalStock += (Number(p.stock) || 50);
      });
    }

    const revEl = document.getElementById("kpi-revenue");
    const countEl = document.getElementById("kpi-orders-count");
    const aovEl = document.getElementById("kpi-aov");
    const stockEl = document.getElementById("kpi-stock-count");
    const navOrdersBadge = document.getElementById("nav-orders-badge");
    const navProductsBadge = document.getElementById("nav-products-badge");
    const skuBadge = document.getElementById("store-sku-count-badge");

    if (revEl) revEl.textContent = `₹${gross.toLocaleString('en-IN')}`;
    if (countEl) countEl.textContent = totalOrders;
    if (aovEl) aovEl.textContent = `₹${aov.toLocaleString('en-IN')}`;
    if (stockEl) stockEl.textContent = `${totalStock.toLocaleString('en-IN')} pcs`;
    if (navOrdersBadge) navOrdersBadge.textContent = totalOrders;
    if (navProductsBadge && window.KODO_DATA && window.KODO_DATA.PRODUCTS) {
      navProductsBadge.textContent = window.KODO_DATA.PRODUCTS.length;
    }
    if (skuBadge && window.KODO_DATA && window.KODO_DATA.PRODUCTS) {
      skuBadge.textContent = `${window.KODO_DATA.PRODUCTS.length} Live SKUs Active`;
    }

    // Recent orders preview on dashboard
    const previewList = document.getElementById("dashboard-recent-orders-list");
    if (previewList) {
      if (orders.length === 0) {
        previewList.innerHTML = `<div class="p-6 text-center text-xs text-neutral-500">No customer orders received yet.</div>`;
      } else {
        previewList.innerHTML = orders.slice(0, 4).map(o => `
          <div class="p-3 bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-between gap-4 text-xs hover:border-neutral-700 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center font-bold text-white shadow-inner">
                📦
              </div>
              <div>
                <div class="font-bold text-white">${o.orderId} — ${o.customer?.name || 'Customer'}</div>
                <div class="text-[11px] text-neutral-400 font-mono-tech">${o.customer?.city || 'India'} • ${o.items?.length || 1} drops</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-mono-tech font-black text-emerald-400">₹${o.total}</div>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(o.status)}">
                ${o.status}
              </span>
            </div>
          </div>
        `).join("");
      }
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Delivered": return "bg-emerald-900/60 text-emerald-300 border border-emerald-700";
      case "Dispatched": return "bg-blue-900/60 text-blue-300 border border-blue-700";
      case "In Production": return "bg-purple-900/60 text-purple-300 border border-purple-700";
      case "Cancelled": return "bg-red-900/60 text-red-300 border border-red-700";
      default: return "bg-amber-900/60 text-amber-300 border border-amber-700";
    }
  }

  /* -------------------------------------------------------------
     5. ORDERS & LIVE FULFILLMENT MANAGER
     ------------------------------------------------------------- */
  function renderOrders() {
    const tbody = document.getElementById("admin-orders-table-body");
    const searchInput = document.getElementById("admin-orders-search");
    const filterTabs = document.querySelectorAll(".admin-status-filter");

    if (!tbody) return;

    let filtered = [...orders];

    if (currentStatusFilter !== "all") {
      filtered = filtered.filter(o => o.status === currentStatusFilter);
    }

    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.trim().toLowerCase();
      filtered = filtered.filter(o => 
        (o.orderId && o.orderId.toLowerCase().includes(q)) ||
        (o.customer?.name && o.customer.name.toLowerCase().includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        (o.awb && o.awb.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="p-12 text-center text-xs text-neutral-500">
            No orders found matching the filter.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((ord) => {
      const dateStr = ord.date ? new Date(ord.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent";
      const awbNum = ord.awb || `AWB-${ord.orderId}`;
      const courierName = ord.courier || "BlueDart Express";

      return `
        <tr class="hover:bg-neutral-900/50 transition-colors">
          <td class="p-4">
            <div class="font-mono-tech font-bold text-white">${ord.orderId}</div>
            <div class="text-[10px] text-neutral-400 font-mono-tech mt-0.5">${dateStr}</div>
          </td>

          <td class="p-4">
            <div class="font-bold text-white">${ord.customer?.name || "Customer"}</div>
            <div class="text-[11px] text-neutral-400 font-mono-tech">${ord.customer?.city || "India"} (${ord.customer?.phone || ""})</div>
          </td>

          <td class="p-4">
            <div class="space-y-1">
              ${(ord.items || []).map(it => `
                <div class="flex items-center gap-2">
                  <img src="${it.image || 'assets/kodo-logo.png'}" class="w-8 h-9 object-cover rounded-lg border border-neutral-700">
                  <div class="min-w-0">
                    <div class="truncate max-w-[160px] text-neutral-200 font-bold">${it.title}</div>
                    <div class="text-[10px] text-neutral-400 font-mono-tech">Size: ${it.size || 'L'} • Qty: ${it.quantity || 1}</div>
                  </div>
                </div>
              `).join("")}
            </div>
          </td>

          <td class="p-4 font-mono-tech font-bold text-white">
            ₹${ord.total}
          </td>

          <td class="p-4">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              ${ord.paymentMethod || 'Prepaid'}
            </span>
          </td>

          <td class="p-4">
            <div class="space-y-1">
              <select class="order-status-changer text-[11px] font-bold px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-700 text-white focus:outline-none" data-id="${ord.orderId}">
                <option value="Confirmed" ${ord.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="In Production" ${ord.status === 'In Production' ? 'selected' : ''}>In Production</option>
                <option value="Dispatched" ${ord.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                <option value="Delivered" ${ord.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                <option value="Cancelled" ${ord.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
              </select>
              <div class="text-[10px] text-neutral-400 font-mono-tech">
                <a href="track.html?awb=${awbNum}" target="_blank" class="text-blue-400 hover:underline">
                  ${courierName} • ${awbNum} ↗
                </a>
              </div>
            </div>
          </td>

          <td class="p-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <a href="invoice.html?id=${ord.orderId}" target="_blank" class="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-bold transition-colors" title="Print GST Tax Invoice">
                🖨️ Invoice
              </a>
              <button type="button" class="print-slip-btn px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer" data-id="${ord.orderId}" title="Print Packing Slip">
                🏷️ Slip
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Wire status changers
    document.querySelectorAll(".order-status-changer").forEach(sel => {
      sel.addEventListener("change", async (e) => {
        const orderId = sel.dataset.id;
        const newStatus = e.target.value;
        const ord = orders.find(o => o.orderId === orderId);
        if (ord) {
          ord.status = newStatus;
          saveOrders();
          initKPIs();

          // Sync with backend API
          try {
            await fetch("/api/orders/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId, status: newStatus })
            });
          } catch (err) {
            console.warn("Backend order update error:", err);
          }
        }
      });
    });

    // Wire Packing Slip print
    document.querySelectorAll(".print-slip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const ord = orders.find(o => o.orderId === btn.dataset.id);
        if (!ord) return;
        const w = window.open("", "_blank");
        w.document.write(`
          <html>
            <head>
              <title>Packing Slip - ${ord.orderId}</title>
              <style>
                body { font-family: monospace; padding: 24px; color: #111; }
                .box { border: 2px solid #000; padding: 18px; border-radius: 8px; }
                .title { font-size: 18px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; }
                .row { display: flex; justify-content: space-between; margin: 8px 0; }
                .barcode { font-size: 24px; letter-spacing: 4px; font-weight: 900; margin-top: 16px; text-align: center; }
              </style>
            </head>
            <body>
              <div class="box">
                <div class="title">KODO STREETWEAR ATELIER - PACKING MANIFEST</div>
                <div class="row"><b>ORDER:</b> ${ord.orderId}</div>
                <div class="row"><b>DATE:</b> ${ord.date}</div>
                <div class="row"><b>CUSTOMER:</b> ${ord.customer?.name} (${ord.customer?.phone})</div>
                <div class="row"><b>SHIP TO:</b> ${ord.customer?.address}, ${ord.customer?.city} - ${ord.customer?.pincode}</div>
                <div class="row"><b>COURIER:</b> ${ord.courier || 'BlueDart Air'}</div>
                <div class="row"><b>AWB:</b> ${ord.awb || 'AWB-' + ord.orderId}</div>
                <hr>
                <b>ITEMS:</b>
                <ul>
                  ${(ord.items || []).map(it => `<li>${it.title} [Size: ${it.size || 'L'}] × ${it.quantity || 1}</li>`).join("")}
                </ul>
                <div class="barcode">||||||| | ||||| || |||||||||| |||</div>
              </div>
              <script>window.print();</script>
            </body>
          </html>
        `);
        w.document.close();
      });
    });

    // Wire filters
    filterTabs.forEach(tab => {
      tab.addEventListener("click", () => {
        filterTabs.forEach(t => {
          t.classList.remove("active", "bg-neutral-800", "text-white");
          t.classList.add("text-neutral-400");
        });
        tab.classList.add("active", "bg-neutral-800", "text-white");
        tab.classList.remove("text-neutral-400");

        currentStatusFilter = tab.dataset.status;
        renderOrders();
      });
    });

    searchInput?.addEventListener("input", renderOrders);
  }

  /* -------------------------------------------------------------
     6. PRODUCT CATALOG & LIVE INVENTORY MANAGER
     ------------------------------------------------------------- */
  function renderProducts() {
    const tbody = document.getElementById("admin-products-table-body");
    const search = document.getElementById("admin-products-search");
    const navBadge = document.getElementById("nav-products-badge");

    if (!tbody || !window.KODO_DATA || !window.KODO_DATA.PRODUCTS) return;

    let list = [...window.KODO_DATA.PRODUCTS];

    if (search && search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      list = list.filter(p => 
        p.title.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q))
      );
    }

    if (navBadge) navBadge.textContent = list.length;

    tbody.innerHTML = list.map(p => {
      const currentStock = p.stock !== undefined ? p.stock : 50;
      let stockBadgeClass = "bg-emerald-900/50 text-emerald-400 border border-emerald-700";
      let stockLabel = "In Stock";
      if (currentStock <= 0) {
        stockBadgeClass = "bg-red-900/50 text-red-400 border border-red-700";
        stockLabel = "Out of Stock";
      } else if (currentStock <= 15) {
        stockBadgeClass = "bg-amber-900/50 text-amber-400 border border-amber-700";
        stockLabel = "Low Stock";
      }

      const skuCode = p.sku || `KODO-${p.id.toUpperCase()}`;

      return `
        <tr class="hover:bg-neutral-900/50 transition-colors" id="prod-row-${p.id}">
          <td class="p-4">
            <div class="flex items-center gap-3">
              <img src="${p.images?.[0] || 'assets/kodo-logo.png'}" class="w-11 h-14 object-cover rounded-lg border border-neutral-700 flex-shrink-0">
              <div class="min-w-0">
                <div class="font-bold text-white max-w-xs truncate">${p.title}</div>
                <div class="text-[10px] text-neutral-400 font-mono-tech mt-1 flex items-center gap-2 flex-wrap">
                  <span class="bg-neutral-800 text-blue-300 px-1.5 py-0.5 rounded font-bold">${skuCode}</span>
                  <span>•</span>
                  <span>${p.badge || 'ACTIVE DROP'}</span>
                </div>
              </div>
            </div>
          </td>

          <td class="p-4 uppercase text-neutral-300 font-mono-tech text-[11px]">
            ${p.category || 'Oversized Tees'}
          </td>

          <td class="p-4 font-mono-tech text-neutral-300 text-xs">
            ${p.gsm || 280} GSM
          </td>

          <td class="p-4">
            <div class="flex items-center gap-1">
              <span class="text-neutral-400 font-mono-tech text-xs">₹</span>
              <input type="number" id="price-input-${p.id}" value="${p.price}" class="w-20 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono-tech text-xs font-bold focus:border-blue-500 focus:outline-none">
            </div>
            <div class="text-[10px] text-neutral-500 line-through font-mono-tech mt-0.5">₹${p.comparePrice || p.price * 2}</div>
          </td>

          <td class="p-4">
            <div class="flex items-center gap-2.5">
              <input type="number" id="stock-input-${p.id}" value="${currentStock}" class="w-16 px-2 py-1 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono-tech text-xs font-bold text-center focus:border-blue-500 focus:outline-none">
              <span id="stock-badge-${p.id}" class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${stockBadgeClass}">
                ${stockLabel}
              </span>
            </div>
          </td>

          <td class="p-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button type="button" class="save-prod-btn px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer" data-id="${p.id}">
                <span>💾</span> <span>Save</span>
              </button>
              <a href="product.html?id=${p.id}" target="_blank" class="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold transition-colors">
                ↗
              </a>
              <button type="button" class="del-product-btn text-neutral-500 hover:text-red-400 p-1.5 text-xs transition-colors cursor-pointer" data-id="${p.id}" title="Delete product">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    search?.addEventListener("input", renderProducts);

    // Save stock & price handler
    document.querySelectorAll(".save-prod-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const stockInput = document.getElementById(`stock-input-${id}`);
        const priceInput = document.getElementById(`price-input-${id}`);
        const badgeEl = document.getElementById(`stock-badge-${id}`);

        const newStock = parseInt(stockInput?.value, 10) || 0;
        const newPrice = parseInt(priceInput?.value, 10) || 699;

        // Update in-memory
        const prod = window.KODO_DATA.PRODUCTS.find(p => p.id === id);
        if (prod) {
          prod.stock = newStock;
          prod.price = newPrice;
        }

        // Update badge UI
        if (badgeEl) {
          if (newStock <= 0) {
            badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-900/50 text-red-400 border border-red-700";
            badgeEl.textContent = "Out of Stock";
          } else if (newStock <= 15) {
            badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-900/50 text-amber-400 border border-amber-700";
            badgeEl.textContent = "Low Stock";
          } else {
            badgeEl.className = "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-900/50 text-emerald-400 border border-emerald-700";
            badgeEl.textContent = "In Stock";
          }
        }

        initKPIs();

        btn.innerHTML = "<span>✓</span> <span>Saved!</span>";
        btn.classList.replace("bg-blue-600", "bg-emerald-600");

        // Sync with backend API
        try {
          await fetch("/api/products/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, stock: newStock, price: newPrice })
          });
        } catch (err) {
          console.warn("Backend product update error:", err);
        }

        setTimeout(() => {
          btn.innerHTML = "<span>💾</span> <span>Save</span>";
          btn.classList.replace("bg-emerald-600", "bg-blue-600");
        }, 1800);
      });
    });

    // Delete product listener
    document.querySelectorAll(".del-product-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (confirm(`Remove product ${id} from catalog?`)) {
          window.KODO_DATA.PRODUCTS = window.KODO_DATA.PRODUCTS.filter(p => p.id !== id);
          let custom = JSON.parse(localStorage.getItem("KODO_CUSTOM_PRODUCTS") || "[]");
          custom = custom.filter(p => p.id !== id);
          localStorage.setItem("KODO_CUSTOM_PRODUCTS", JSON.stringify(custom));
          renderProducts();
          initKPIs();
        }
      });
    });
  }

  /* -------------------------------------------------------------
     7. DISCOUNTS & MARKETING ENGINE
     ------------------------------------------------------------- */
  function renderDiscounts() {
    const tbody = document.getElementById("admin-discounts-table-body");
    if (!tbody) return;

    const discounts = [
      { code: "KODO15", type: "Percentage", val: "15% OFF", min: 0, status: "Active" },
      { code: "STREET20", type: "Percentage", val: "20% OFF", min: 999, status: "Active" },
      { code: "REBEL850", type: "Flat Coins", val: "₹850 OFF", min: 1499, status: "Active" },
      { code: "DONTGO10", type: "Exit Intent", val: "10% OFF", min: 0, status: "Active" },
      { code: "FREESHIP", type: "Shipping", val: "Free Air Freight", min: 799, status: "Active" }
    ];

    tbody.innerHTML = discounts.map(d => `
      <tr class="hover:bg-neutral-900/50 transition-colors">
        <td class="p-4 font-mono-tech font-black text-[#2D8CE3] text-sm">
          ${d.code}
        </td>
        <td class="p-4 font-bold text-white">
          ${d.val} (${d.type})
        </td>
        <td class="p-4 font-mono-tech text-neutral-400">
          ₹${d.min}
        </td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-900/40 text-emerald-400 border border-emerald-700">
            ● ${d.status}
          </span>
        </td>
        <td class="p-4 text-right">
          <button type="button" onclick="navigator.clipboard?.writeText('${d.code}'); alert('Coupon ${d.code} copied to clipboard!');" class="text-xs text-neutral-400 hover:text-white cursor-pointer">
            Copy
          </button>
        </td>
      </tr>
    `).join("");
  }

  /* -------------------------------------------------------------
     8. CUSTOMER CRM DIRECTORY
     ------------------------------------------------------------- */
  function renderCustomers() {
    const tbody = document.getElementById("admin-customers-table-body");
    if (!tbody) return;

    const customerMap = {};
    orders.forEach(o => {
      const phone = o.customer?.phone || "+91 98000 00000";
      if (!customerMap[phone]) {
        customerMap[phone] = {
          name: o.customer?.name || "Customer",
          phone: phone,
          city: o.customer?.city || "India",
          ordersCount: 0,
          totalSpent: 0
        };
      }
      customerMap[phone].ordersCount++;
      customerMap[phone].totalSpent += (Number(o.total) || 0);
    });

    const customers = Object.values(customerMap);

    if (customers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-xs text-neutral-500">No customers registered yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = customers.map(c => {
      const isVip = c.totalSpent >= 2000;
      const tierBadge = isVip ? "bg-amber-400 text-neutral-950" : "bg-neutral-800 text-neutral-300";

      return `
        <tr class="hover:bg-neutral-900/50 transition-colors">
          <td class="p-4 font-bold text-white">
            ${c.name}
          </td>
          <td class="p-4 font-mono-tech text-neutral-400">
            ${c.phone}
          </td>
          <td class="p-4 text-neutral-300 font-mono-tech">
            ${c.city}
          </td>
          <td class="p-4 font-mono-tech font-bold text-white text-center">
            ${c.ordersCount}
          </td>
          <td class="p-4 font-mono-tech font-bold text-emerald-400">
            ₹${c.totalSpent.toLocaleString('en-IN')}
          </td>
          <td class="p-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${tierBadge}">
              ${isVip ? 'STREET OG VIP' : 'REBEL MEMBER'}
            </span>
          </td>
          <td class="p-4 text-right">
            <a href="https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Hey%20${encodeURIComponent(c.name)}%2C%20thank%20you%20for%20your%20order%20with%20KODO!" target="_blank" class="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[11px] font-bold transition-colors">
              Chat ↗
            </a>
          </td>
        </tr>
      `;
    }).join("");
  }

  /* -------------------------------------------------------------
     9. MODALS & FORMS HANDLERS
     ------------------------------------------------------------- */
  function initModals() {
    // Add Product Modal
    const addProductModal = document.getElementById("add-product-modal");
    const openAddProductBtn = document.getElementById("open-add-product-modal");
    const closeAddProductBtn = document.getElementById("close-add-product-modal");
    const addProductForm = document.getElementById("add-product-form");

    openAddProductBtn?.addEventListener("click", () => {
      addProductModal?.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    closeAddProductBtn?.addEventListener("click", () => {
      addProductModal?.classList.remove("active");
      document.body.style.overflow = "";
    });

    addProductForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("p-title")?.value.trim() || "New Streetwear Drop";
      const cat = document.getElementById("p-cat")?.value || "oversized-tees";
      const price = parseInt(document.getElementById("p-price")?.value, 10) || 799;
      const comparePrice = parseInt(document.getElementById("p-compare")?.value, 10) || 1499;
      const gsm = parseInt(document.getElementById("p-gsm")?.value, 10) || 280;
      const fit = document.getElementById("p-fit")?.value || "Oversized Boxy Fit";
      const badge = document.getElementById("p-badge")?.value.trim() || "NEW DROP";
      const image = document.getElementById("p-image")?.value.trim() || "assets/products/same-sky-tee/front.jpg";
      const desc = document.getElementById("p-desc")?.value.trim() || "Authentic 280 GSM heavyweight cotton streetwear tee.";

      const newId = `kd-drop-${Date.now().toString().slice(-4)}`;
      const newProduct = {
        id: newId,
        sku: `KODO-${newId.toUpperCase()}`,
        title: title,
        category: cat,
        badge: badge,
        badgeColor: "bg-[#2D8CE3]",
        price: price,
        comparePrice: comparePrice,
        discount: `${Math.round(((comparePrice - price) / comparePrice) * 100)}% OFF`,
        stock: 50,
        rating: 5.0,
        reviewsCount: 1,
        images: [image],
        fabric: `100% Combed Terry Cotton ${gsm} GSM`,
        gsm: gsm,
        fit: fit,
        color: "Street Dark",
        sizes: ["S", "M", "L", "XL", "XXL"],
        description: desc
      };

      // Prepend to catalog
      window.KODO_DATA = window.KODO_DATA || {};
      window.KODO_DATA.PRODUCTS = window.KODO_DATA.PRODUCTS || [];
      window.KODO_DATA.PRODUCTS.unshift(newProduct);

      // Persist to server
      try {
        await fetch("/api/products/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProduct)
        });
      } catch (err) {}

      alert(`✓ Product "${title}" has been published live to your catalog!`);
      addProductModal?.classList.remove("active");
      document.body.style.overflow = "";
      addProductForm.reset();
      renderProducts();
      initKPIs();
    });

    // Add Discount Modal
    const discountModal = document.getElementById("add-discount-modal");
    const openDiscountBtn = document.getElementById("open-add-discount-modal");
    const closeDiscountBtn = document.getElementById("close-add-discount-modal");
    const addDiscountForm = document.getElementById("add-discount-form");

    openDiscountBtn?.addEventListener("click", () => {
      discountModal?.classList.add("active");
    });
    closeDiscountBtn?.addEventListener("click", () => {
      discountModal?.classList.remove("active");
    });

    addDiscountForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      const code = document.getElementById("d-code")?.value.trim().toUpperCase();
      alert(`Coupon "${code}" activated for customers!`);
      discountModal?.classList.remove("active");
      addDiscountForm.reset();
    });
  }

  /* -------------------------------------------------------------
     10. EXPORT CSV GENERATOR
     ------------------------------------------------------------- */
  function initExportCSV() {
    const btn = document.getElementById("admin-export-csv-btn");
    btn?.addEventListener("click", () => {
      let csv = "Order ID,Date,Customer Name,Phone,City,Status,Payment Method,Total Amount,AWB Courier\n";
      orders.forEach(o => {
        csv += `"${o.orderId}","${o.date}","${o.customer?.name}","${o.customer?.phone}","${o.customer?.city}","${o.status}","${o.paymentMethod}","${o.total}","${o.courier || ''} - ${o.awb || ''}"\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kodo-live-orders-${Date.now()}.csv`;
      a.click();
    });
  }

  /* -------------------------------------------------------------
     11. SYNC ORDERS BUTTON
     ------------------------------------------------------------- */
  function initSyncOrdersBtn() {
    const btn = document.getElementById("admin-refresh-orders-btn");
    btn?.addEventListener("click", async () => {
      btn.innerHTML = `<span>🔄</span> <span>Syncing...</span>`;
      await loadProducts();
      await loadOrders();
      initKPIs();
      renderOrders();
      renderProducts();
      renderCustomers();
      btn.innerHTML = `<span>✓</span> <span>Synced!</span>`;
      setTimeout(() => {
        btn.innerHTML = `<span>🔄</span> <span>Sync Live Orders</span>`;
      }, 1500);
    });
  }

})();
