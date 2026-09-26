// KODO.DIY Main Application Logic

(function () {
  window.KODO_DATA = window.KODO_DATA || {};
  window.KODO_DATA.PRODUCTS = Array.isArray(window.KODO_DATA.PRODUCTS) ? window.KODO_DATA.PRODUCTS : [];
  window.KODO_DATA.PROMOS = Array.isArray(window.KODO_DATA.PROMOS) ? window.KODO_DATA.PROMOS : [
    "Free shipping above ₹799",
    "Buy any 2 oversized tees @ ₹1,199",
    "WhatsApp order verification before dispatch",
    "Heavyweight 240-380 GSM streetwear drops"
  ];
  window.KODO_DATA.CATEGORIES = Array.isArray(window.KODO_DATA.CATEGORIES) ? window.KODO_DATA.CATEGORIES : [
    { id: "all", name: "All Drops", icon: "✦" },
    { id: "bestsellers", name: "Bestsellers", icon: "★" },
    { id: "oversized-tees", name: "Oversized Tees", icon: "□" },
    { id: "celestial-series", name: "Celestial", icon: "☾" },
    { id: "alpine-series", name: "Alpine", icon: "△" },
    { id: "racing-tokyo", name: "Tokyo Racing", icon: "⚑" }
  ];
  window.KODO_DATA.SIZE_CHART = Array.isArray(window.KODO_DATA.SIZE_CHART) ? window.KODO_DATA.SIZE_CHART : [
    { size: "XS", chest: "38", length: "25", shoulder: "18" },
    { size: "S", chest: "40", length: "26", shoulder: "19" },
    { size: "M", chest: "42", length: "27", shoulder: "20" },
    { size: "L", chest: "44", length: "28", shoulder: "21" },
    { size: "XL", chest: "46", length: "29", shoulder: "22" },
    { size: "XXL", chest: "48", length: "30", shoulder: "23" }
  ];

  let currentCategory = 'all';
  let cart = [];
  let wishlist = [];
	  let appliedCoupon = null;
	  const FREE_SHIPPING_THRESHOLD = 799;
  const API_BASE_URL = (window.KODO_API_BASE_URL || localStorage.getItem("KODO_API_BASE_URL") || "").replace(/\/$/, "");
  const formatMoney = (value, product) => `${product?.currency === "USD" ? "$" : "₹"}${value}`;

  const filterState = {
    maxPrice: 3000,
    selectedFits: [],
    selectedGSMs: [],
    selectedGender: 'all',
    sortBy: 'featured'
  };

  const comboState = {
    item1: null,
    size1: "L",
    item2: null,
    size2: "L",
    bundlePrice: 999
  };

  document.addEventListener("DOMContentLoaded", () => {
    loadSavedState();
    initTicker();
    initHeader();
    initNavDrawer();
    initSearch();
    initCategoryTabs();
    initFiltersAndSort();
    initComboBuilder();
    const urlParams = new URLSearchParams(window.location.search);
    const genderParam = urlParams.get('gender');
    if (genderParam) {
      filterState.selectedGender = genderParam;
      setTimeout(() => {
        window.setGenderFilter?.(genderParam);
      }, 50);
    }
    renderProducts();
    initCartDrawer();
    initQuickView();
    initCheckoutModal();
    if (urlParams.get("checkout") === "1") {
      setTimeout(() => {
        if (cart.length > 0) {
          closeCartDrawer();
          openCheckoutModal();
        } else {
          openCartDrawer();
        }
      }, 150);
    }
    initSpinWheel();
    initSizePredictor();
    if (window.initDiyStudio) {
      window.initDiyStudio();
    }
    window.addEventListener("kodo:products-updated", () => {
      renderProducts();
    });
  });

  function loadSavedState() {
    try {
      const savedCart = localStorage.getItem("KODO_CART");
      if (savedCart) cart = JSON.parse(savedCart);
      const savedWish = localStorage.getItem("KODO_WISHLIST");
      if (savedWish) wishlist = JSON.parse(savedWish);
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    updateCartBadges();
    updateWishlistBadge();
  }

  function saveCart() {
    try {
      localStorage.setItem("KODO_CART", JSON.stringify(cart));
    } catch (e) {}
    updateCartBadges();
  }

  function saveWishlist() {
    try {
      localStorage.setItem("KODO_WISHLIST", JSON.stringify(wishlist));
    } catch (e) {}
    updateWishlistBadge();
  }

	  async function saveOrder(order) {
    try {
      const existing = JSON.parse(localStorage.getItem("KODO_ORDERS") || "[]");
      existing.unshift(order);
      localStorage.setItem("KODO_ORDERS", JSON.stringify(existing));
    } catch (e) {
      console.error("Order save error:", e);
    }

    // Sync only when the production backend is available.
    return fetch(`${API_BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    }).then(res => {
      if (!res.ok) throw new Error(`Order API responded ${res.status}`);
      console.log("Order synced to live backend:", order.orderId);
      return true;
    }).catch(err => {
      console.warn("Backend order sync error:", err);
      return false;
	    });
	  }

  async function createDodoCheckout(order) {
    const endpoint = `${API_BASE_URL}/api/dodo/checkout`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    });
    let data = {};
    try {
      data = await res.json();
    } catch (e) {}
    if (!res.ok || !data.success || !(data.checkoutUrl || data.paymentLink)) {
      throw new Error(data.error || `Dodo checkout failed (${res.status})`);
    }
    return data;
  }

  function showToast(msg) {
    let toast = document.getElementById("kodo-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "kodo-toast";
      toast.className = "toast-notice fixed bottom-6 right-6 z-[9999] bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-semibold border border-neutral-700";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="text-emerald-400 text-base">✓</span> <span>${msg}</span>`;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }
  window.showToast = showToast;

  function initTicker() {
    const tickerContainer = document.getElementById("promo-ticker-content");
    if (!tickerContainer) return;
    const items = [...window.KODO_DATA.PROMOS, ...window.KODO_DATA.PROMOS];
    tickerContainer.innerHTML = items.map(text => `
      <span class="inline-flex items-center gap-2 mx-8 text-xs font-bold tracking-wide uppercase">
        <span>${text}</span>
        <span class="text-white/40">•</span>
      </span>
    `).join("");
  }

  function initHeader() {
    const header = document.getElementById("main-header");
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        header.classList.add("shadow-md", "bg-white/95", "backdrop-blur-md");
      } else {
        header.classList.remove("shadow-md", "bg-white/95", "backdrop-blur-md");
      }
    });
  }

  function initNavDrawer() {
    const openBtn = document.getElementById("menu-drawer-toggle");
    const closeBtn = document.getElementById("menu-drawer-close");
    const drawerBackdrop = document.getElementById("nav-drawer-backdrop");
    const drawerContent = document.getElementById("nav-drawer");

    function openNav() {
      drawerBackdrop.classList.add("active");
      drawerContent.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeNav() {
      drawerBackdrop.classList.remove("active");
      drawerContent.classList.remove("active");
      document.body.style.overflow = "";
    }

    if (openBtn) openBtn.addEventListener("click", openNav);
    if (closeBtn) closeBtn.addEventListener("click", closeNav);
    if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeNav);

    document.querySelectorAll(".drawer-accordion-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetId = btn.dataset.target;
        const panel = document.getElementById(targetId);
        const icon = btn.querySelector(".accordion-arrow");
        if (panel) {
          panel.classList.toggle("hidden");
          if (icon) icon.classList.toggle("rotate-180");
        }
      });
    });

    document.querySelectorAll(".drawer-cat-link").forEach(link => {
      link.addEventListener("click", (e) => {
        const cat = link.dataset.cat;
        if (cat) {
          e.preventDefault();
          selectCategory(cat);
          closeNav();
          const target = document.getElementById("catalog-section");
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  function initSearch() {
    const openBtns = document.querySelectorAll(".search-trigger");
    const closeBtn = document.getElementById("search-modal-close");
    const modal = document.getElementById("search-modal");
    const input = document.getElementById("search-input");
    const resultsContainer = document.getElementById("search-results-list");
    const quickTags = document.querySelectorAll(".search-quick-tag");

    function openSearch() {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
      setTimeout(() => input && input.focus(), 100);
    }

    function closeSearch() {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }

    openBtns.forEach(btn => btn.addEventListener("click", openSearch));
    if (closeBtn) closeBtn.addEventListener("click", closeSearch);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeSearch();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("active")) {
        closeSearch();
      }
    });

    if (input) {
      input.addEventListener("input", (e) => {
        performSearch(e.target.value.trim());
      });
    }

    quickTags.forEach(tag => {
      tag.addEventListener("click", () => {
        const q = tag.textContent.trim().replace("#", "");
        if (input) {
          input.value = q;
          performSearch(q);
        }
      });
    });

    function performSearch(query) {
      if (!resultsContainer) return;
      if (!query) {
        resultsContainer.innerHTML = `<div class="p-8 text-center text-sm text-neutral-400">Type something to search streetwear, categories, or tags...</div>`;
        return;
      }

      const q = query.toLowerCase();
      const matches = window.KODO_DATA.PRODUCTS.filter(p => 
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );

      if (matches.length === 0) {
        resultsContainer.innerHTML = `
          <div class="p-8 text-center">
            <p class="text-sm font-semibold text-neutral-600">No matching streetwear found for "${query}"</p>
            <p class="text-xs text-neutral-400 mt-1">Try "Oversized", "Bomber", "Cargo", or "Hoodie"</p>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = `
        <div class="p-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">Results (${matches.length})</div>
        <div class="divide-y divide-neutral-100">
          ${matches.map(p => `
            <div class="flex items-center justify-between p-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer search-item-row" data-id="${p.id}">
              <div class="flex items-center gap-3">
                <img src="${p.images[0]}" alt="${p.title}" class="w-12 h-12 object-cover rounded-lg border border-neutral-200">
                <div>
                  <h4 class="text-xs font-bold text-neutral-900 line-clamp-1">${p.title}</h4>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-xs font-extrabold text-[#2D8CE3]">${formatMoney(p.price, p)}</span>
                    <span class="text-[10px] text-neutral-400 line-through">${formatMoney(p.comparePrice, p)}</span>
                    <span class="text-[10px] font-bold text-emerald-600">${p.discount}</span>
                  </div>
                </div>
              </div>
              <a href="product.html?id=${p.id}" class="search-view-btn px-3 py-1.5 bg-neutral-900 hover:bg-[#2D8CE3] text-white text-xs font-bold rounded-lg transition-colors">
                View PDP ↗
              </a>
            </div>
          `).join("")}
        </div>
      `;
    }
  }

  function initCategoryTabs() {
    const tabsContainer = document.getElementById("category-tabs-container");
    if (tabsContainer) {
      tabsContainer.innerHTML = window.KODO_DATA.CATEGORIES.map(cat => `
        <button 
          type="button" 
          data-cat="${cat.id}"
          class="cat-tab-btn flex-shrink-0 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide uppercase transition-all ${cat.id === currentCategory ? 'bg-neutral-900 text-white shadow-md' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}">
          <span class="mr-1">${cat.icon}</span> ${cat.name}
        </button>
      `).join("");

      tabsContainer.querySelectorAll(".cat-tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          selectCategory(btn.dataset.cat);
        });
      });
    }

    const bubblesContainer = document.getElementById("category-bubbles-container");
    if (bubblesContainer) {
      const bubbleItems = [
        { name: "Solar Eclipse", cat: "celestial-series", img: "assets/products/same-sky-tee/front.jpg" },
        { name: "Alpine Summit", cat: "alpine-series", img: "assets/products/altitude-tee/front.jpg" },
        { name: "Crescent Moon", cat: "celestial-series", img: "assets/products/crescent-moon-tee/front.jpg" },
        { name: "Tokyo Drift GT-R", cat: "racing-tokyo", img: "assets/products/racing-division-tee/front.jpg" },
        { name: "After Hours", cat: "celestial-series", img: "assets/products/after-hours-tee/front.jpg" },
        { name: "Tokyo NO SIGNAL", cat: "racing-tokyo", img: "assets/products/no-signal-tee/front.jpg" }
      ];

      bubblesContainer.innerHTML = bubbleItems.map((item, idx) => `
        <div class="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group category-bubble-item" data-cat="${item.cat}">
          <div class="relative w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] story-ring group-hover:scale-105 transition-all shadow-md">
            <div class="w-full h-full rounded-full p-[2px] bg-white overflow-hidden">
              <img src="${item.img}" alt="${item.name}" class="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300">
            </div>
            <span class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.2 bg-neutral-900 text-white text-[9px] font-black rounded-full uppercase border border-white tracking-wider whitespace-nowrap">
              ${idx === 0 ? '🔥 HOT' : (idx === 4 ? '🎨 DIY' : 'DROP')}
            </span>
          </div>
          <span class="text-[11px] md:text-xs font-bold text-neutral-800 text-center uppercase tracking-tight group-hover:text-[#2D8CE3] transition-colors mt-1">${item.name}</span>
        </div>
      `).join("");

      bubblesContainer.querySelectorAll(".category-bubble-item").forEach(item => {
        item.addEventListener("click", () => {
          selectCategory(item.dataset.cat);
          const target = document.getElementById("catalog-section");
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      });
    }
  }

  function initFiltersAndSort() {
    const priceSlider = document.getElementById("filter-price-slider");
    const priceDisplay = document.getElementById("filter-price-val");
    const sortSelect = document.getElementById("sort-by-select");
    const filterToggleBtn = document.getElementById("toggle-filters-btn");
    const filterPanel = document.getElementById("filters-collapse-panel");
    const clearFiltersBtn = document.getElementById("clear-filters-btn");

    if (filterToggleBtn && filterPanel) {
      filterToggleBtn.addEventListener("click", () => {
        filterPanel.classList.toggle("hidden");
      });
    }

    if (priceSlider && priceDisplay) {
      priceSlider.addEventListener("input", (e) => {
        filterState.maxPrice = parseInt(e.target.value, 10);
        priceDisplay.textContent = `₹${filterState.maxPrice}`;
        renderProducts();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        filterState.sortBy = e.target.value;
        renderProducts();
      });
    }

    document.querySelectorAll(".filter-fit-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const val = chk.value;
        if (chk.checked) filterState.selectedFits.push(val);
        else filterState.selectedFits = filterState.selectedFits.filter(f => f !== val);
        renderProducts();
      });
    });

    document.querySelectorAll(".filter-gsm-chk").forEach(chk => {
      chk.addEventListener("change", () => {
        const val = parseInt(chk.value, 10);
        if (chk.checked) filterState.selectedGSMs.push(val);
        else filterState.selectedGSMs = filterState.selectedGSMs.filter(g => g !== val);
        renderProducts();
      });
    });

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        filterState.maxPrice = 3000;
        filterState.selectedFits = [];
        filterState.selectedGSMs = [];
        filterState.sortBy = 'featured';

        if (priceSlider) priceSlider.value = 3000;
        if (priceDisplay) priceDisplay.textContent = '₹3000';
        if (sortSelect) sortSelect.value = 'featured';
        document.querySelectorAll(".filter-fit-chk, .filter-gsm-chk").forEach(c => c.checked = false);
        renderProducts();
        showToast("Filters reset!");
      });
    }
  }

  function selectCategory(catId) {
    currentCategory = catId;
    document.querySelectorAll(".cat-tab-btn").forEach(b => {
      if (b.dataset.cat === catId) {
        b.classList.add("bg-neutral-900", "text-white", "shadow-md");
        b.classList.remove("bg-neutral-100", "text-neutral-700");
      } else {
        b.classList.remove("bg-neutral-900", "text-white", "shadow-md");
        b.classList.add("bg-neutral-100", "text-neutral-700");
      }
    });
    renderProducts();
  }

  window.selectCategory = selectCategory;

  window.setGenderFilter = function(gender) {
    filterState.selectedGender = gender;
    document.querySelectorAll(".gender-tab-btn").forEach(btn => {
      if (btn.dataset.gender === gender) {
        btn.classList.add("bg-neutral-950", "text-white", "border-neutral-950", "shadow-sm");
        btn.classList.remove("bg-neutral-50", "text-neutral-700", "border-neutral-200", "text-pink-700", "text-blue-700");
      } else {
        btn.classList.remove("bg-neutral-950", "text-white", "border-neutral-950", "shadow-sm");
        btn.classList.add("bg-neutral-50", "text-neutral-700", "border-neutral-200");
      }
    });

    // Update banner text if needed
    const girlsBanner = document.getElementById("girls-streetwear-banner");
    if (girlsBanner) {
      if (gender === 'women') {
        girlsBanner.classList.remove("hidden");
      } else {
        girlsBanner.classList.add("hidden");
      }
    }

    renderProducts();
  };

  function renderProducts() {
    const grid = document.getElementById("products-grid");
    const countLabel = document.getElementById("products-count-label");
    if (!grid) return;

    let filtered = [...window.KODO_DATA.PRODUCTS];

    if (currentCategory === 'bestsellers') {
      filtered = filtered.filter(p => p.badge === 'BESTSELLER' || p.rating >= 4.8 || (p.tags && p.tags.includes('Bestseller')) || (p.salesCount && p.salesCount >= 10));
    } else if (currentCategory === 'celestial-series') {
      filtered = filtered.filter(p => p.category === 'solaris-equinox' || p.category === 'celestial-series' || (p.tags && p.tags.some(t => /celestial|moon|solar|sun|equinox|orbit/i.test(t))) || /celestial|moon|solar|sun/i.test(p.title));
    } else if (currentCategory === 'alpine-series') {
      filtered = filtered.filter(p => p.category === 'alpine-series' || p.category === 'acid-renaissance' || (p.tags && p.tags.some(t => /alpine|summit|mountain|acid/i.test(t))) || /alpine|summit|mountain|zenith|ridge/i.test(p.title));
    } else if (currentCategory === 'racing-tokyo') {
      filtered = filtered.filter(p => p.category === 'tokyo-drift' || p.category === 'racing-tokyo' || (p.tags && p.tags.some(t => /tokyo|cyber|racing|gtr|wangan/i.test(t))) || /tokyo|cyber|racing|division/i.test(p.title));
    } else if (currentCategory === 'oversized-tees') {
      filtered = filtered.filter(p => p.subCategory === 'oversized-tees' || p.category === 'oversized-tees' || (p.fit && p.fit.toLowerCase().includes('oversized')) || (p.tags && p.tags.some(t => t.toLowerCase().includes('oversized'))));
    } else if (currentCategory !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategory || (p.tags && p.tags.some(t => t.toLowerCase().includes(currentCategory.toLowerCase()))));
    }

    if (filterState.selectedGender === 'women') {
      filtered = filtered.filter(p => p.gender === 'women' || (p.tags && p.tags.includes('Women')) || p.category === 'women-streetwear' || (p.badge && p.badge.includes('WOMEN')));
    } else if (filterState.selectedGender === 'men') {
      filtered = filtered.filter(p => p.gender === 'men' || p.gender !== 'women');
    } else if (filterState.selectedGender === 'unisex') {
      filtered = filtered.filter(p => p.gender === 'unisex' || (!p.gender && p.tags && p.tags.includes('Oversized')));
    }

    filtered = filtered.filter(p => p.price <= filterState.maxPrice);

    if (filterState.selectedFits.length > 0) {
      filtered = filtered.filter(p => filterState.selectedFits.includes(p.fit));
    }

    if (filterState.selectedGSMs.length > 0) {
      filtered = filtered.filter(p => filterState.selectedGSMs.includes(p.gsm));
    }

    if (filterState.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filterState.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (filterState.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (filterState.sortBy === 'discount-high') {
      filtered.sort((a, b) => parseInt(b.discount) - parseInt(a.discount));
    }

    if (countLabel) {
      countLabel.textContent = `Showing ${filtered.length} products`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <p class="text-base font-bold text-neutral-600">No items match your filter criteria.</p>
          <button type="button" class="mt-4 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg" onclick="document.getElementById('clear-filters-btn').click()">Reset Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(product => {
      const isWish = wishlist.some(w => w.id === product.id);
      return `
        <div class="product-card group relative bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col justify-between" data-id="${product.id}">
          <div class="image-swap-wrapper relative w-full aspect-[3/4] bg-neutral-100 overflow-hidden cursor-pointer quick-view-trigger" data-id="${product.id}">
            <img src="${product.images[0]}" alt="${product.title}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            ${product.images[1] ? `<img src="${product.images[1]}" alt="${product.title} view 2" loading="lazy" class="secondary-image absolute inset-0 w-full h-full object-cover">` : ''}
            
            <div class="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
              <span class="${product.badgeColor} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                ${product.badge}
              </span>
              ${product.gsm ? `<span class="bg-black/70 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">${product.gsm} GSM</span>` : ''}
            </div>

            <button type="button" class="wishlist-btn absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-sm shadow hover:scale-110 transition-all z-10" data-id="${product.id}">
              <span class="${isWish ? 'text-red-500' : 'text-neutral-400'}">${isWish ? '♥' : '♡'}</span>
            </button>

            <div class="absolute bottom-2.5 inset-x-2.5 hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button type="button" class="quick-view-btn w-full py-2 bg-white/95 backdrop-blur text-neutral-900 text-xs font-extrabold rounded-xl shadow-md hover:bg-neutral-900 hover:text-white transition-all flex items-center justify-center gap-1.5" data-id="${product.id}">
                <span>👁️</span> Quick View
              </button>
            </div>
          </div>

          <div class="p-3.5 flex flex-col flex-1 justify-between">
            <div>
              <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wide mb-1">
                ${product.fit} • ${product.sizes.length} Sizes
              </div>

              <!-- Product title links directly to dedicated PDP product.html -->
              <a href="product.html?id=${product.id}" class="text-xs md:text-sm font-bold text-neutral-900 line-clamp-1 hover:text-[#2D8CE3] transition-colors block">
                ${product.title}
              </a>

              <div class="flex items-baseline gap-2 mt-2">
                <span class="text-sm md:text-base font-extrabold text-neutral-900">${formatMoney(product.price, product)}</span>
                <span class="text-xs text-neutral-400 line-through">${formatMoney(product.comparePrice, product)}</span>
                <span class="text-xs font-extrabold text-emerald-600">${product.discount}</span>
              </div>

              <div class="mt-2 text-[10px] font-bold text-[#8F54F0] bg-[#F9F8FF] px-2 py-0.5 rounded border border-[#8F54F0]/20 inline-block">
                ⚡ ${product.offer}
              </div>
            </div>

            <div class="mt-3 pt-3 border-t border-neutral-100">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-bold text-neutral-500 uppercase">Select Size:</span>
                <span class="text-[10px] font-bold text-[#2D8CE3] cursor-pointer size-guide-trigger" data-id="${product.id}">Size Guide</span>
              </div>
              <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 size-pills-row" data-id="${product.id}">
                ${product.sizes.map((s, idx) => `
                  <button type="button" class="size-pill text-[11px] font-extrabold px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-700 hover:border-neutral-900 ${idx === 0 ? 'active' : ''}" data-size="${s}">
                    ${s}
                  </button>
                `).join("")}
              </div>

              <button type="button" class="add-to-bag-card-btn w-full mt-2 py-2.5 bg-neutral-900 hover:bg-[#2D8CE3] text-white text-xs font-extrabold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2" data-id="${product.id}">
                <span>ADD TO BAG</span>
                <span class="text-white/60">→</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    attachProductCardEvents();
  }

  function attachProductCardEvents() {
    document.querySelectorAll(".size-pills-row").forEach(row => {
      row.querySelectorAll(".size-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          row.querySelectorAll(".size-pill").forEach(p => p.classList.remove("active"));
          pill.classList.add("active");
        });
      });
    });

    document.querySelectorAll(".wishlist-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const prod = window.KODO_DATA.PRODUCTS.find(p => p.id === id);
        if (!prod) return;

        const idx = wishlist.findIndex(w => w.id === id);
        if (idx > -1) {
          wishlist.splice(idx, 1);
          btn.innerHTML = `<span class="text-neutral-400">♡</span>`;
          showToast(`Removed from wishlist`);
        } else {
          wishlist.push(prod);
          btn.innerHTML = `<span class="text-red-500">♥</span>`;
          showToast(`Added to wishlist!`);
        }
        saveWishlist();
      });
    });

    document.querySelectorAll(".quick-view-trigger, .quick-view-btn").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        const prod = window.KODO_DATA.PRODUCTS.find(p => p.id === id);
        if (prod) openQuickViewModal(prod);
      });
    });

    document.querySelectorAll(".size-guide-trigger").forEach(el => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openSizeChartModal();
      });
    });

    document.querySelectorAll(".add-to-bag-card-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const prod = window.KODO_DATA.PRODUCTS.find(p => p.id === id);
        if (!prod) return;

        const card = btn.closest(".product-card");
        const activeSizePill = card.querySelector(".size-pill.active");
        const selectedSize = activeSizePill ? activeSizePill.dataset.size : prod.sizes[0];

        addItemToCart({
          id: `${prod.id}-${selectedSize}`,
          productId: prod.id,
          title: prod.title,
          price: prod.price,
          comparePrice: prod.comparePrice,
          image: prod.images[0],
          size: selectedSize,
          sizes: prod.sizes,
          quantity: 1
        });

        openCartDrawer();
        showToast(`Added ${prod.title} (Size ${selectedSize}) to bag!`);
      });
    });
  }

  function initComboBuilder() {
    const tees = window.KODO_DATA.PRODUCTS.filter(p => p.category === 'oversized-tees' || p.subCategory === 'oversized-tees' || (p.fit && p.fit.toLowerCase().includes('oversized')) || (p.tags && p.tags.some(t => t.toLowerCase().includes('oversized'))));
    if (tees.length < 2) return;

    comboState.item1 = tees[0];
    comboState.item2 = tees[1] || tees[0];

    const slot1Select = document.getElementById("combo-slot-1-select");
    const slot2Select = document.getElementById("combo-slot-2-select");
    const size1Select = document.getElementById("combo-slot-1-size");
    const size2Select = document.getElementById("combo-slot-2-size");
    const addComboBtn = document.getElementById("add-combo-to-bag-btn");

    function renderComboOptions() {
      if (slot1Select) {
        slot1Select.innerHTML = tees.map(t => `<option value="${t.id}" ${t.id === comboState.item1.id ? 'selected' : ''}>${t.title}</option>`).join("");
      }
      if (slot2Select) {
        slot2Select.innerHTML = tees.map(t => `<option value="${t.id}" ${t.id === comboState.item2.id ? 'selected' : ''}>${t.title}</option>`).join("");
      }
      updateComboPreview();
    }

    function updateComboPreview() {
      const img1 = document.getElementById("combo-img-1");
      const img2 = document.getElementById("combo-img-2");

      if (img1) img1.src = comboState.item1.images[0];
      if (img2) img2.src = comboState.item2.images[0];
    }

    if (slot1Select) {
      slot1Select.addEventListener("change", (e) => {
        comboState.item1 = tees.find(t => t.id === e.target.value);
        updateComboPreview();
      });
    }
    if (slot2Select) {
      slot2Select.addEventListener("change", (e) => {
        comboState.item2 = tees.find(t => t.id === e.target.value);
        updateComboPreview();
      });
    }
    if (size1Select) {
      size1Select.addEventListener("change", (e) => comboState.size1 = e.target.value);
    }
    if (size2Select) {
      size2Select.addEventListener("change", (e) => comboState.size2 = e.target.value);
    }

    if (addComboBtn) {
      addComboBtn.addEventListener("click", () => {
        addItemToCart({
          id: `combo-${Date.now()}`,
          productId: "kd-street-combo-999",
          title: `Buy 2 Combo: ${comboState.item1.title.split(' ')[0]} + ${comboState.item2.title.split(' ')[0]}`,
          price: 999,
          comparePrice: 2598,
          size: `${comboState.size1} & ${comboState.size2}`,
          sizes: ["Mixed Combo"],
          image: comboState.item1.images[0],
          quantity: 1,
          isCombo: true
        });

        openCartDrawer();
        showToast("Added 'Buy 2 @ ₹999' Street Combo to bag! Saved ₹1,599!");
      });
    }

    renderComboOptions();
  }

  function initCartDrawer() {
    const openBtns = document.querySelectorAll(".cart-drawer-trigger");
    const closeBtn = document.getElementById("cart-drawer-close");
    const backdrop = document.getElementById("cart-drawer-backdrop");

    openBtns.forEach(btn => btn.addEventListener("click", openCartDrawer));
    if (closeBtn) closeBtn.addEventListener("click", closeCartDrawer);
    if (backdrop) backdrop.addEventListener("click", closeCartDrawer);

    const couponBtn = document.getElementById("apply-coupon-btn");
    if (couponBtn) {
      couponBtn.addEventListener("click", () => {
        const input = document.getElementById("cart-coupon-input");
        const code = input ? input.value.trim().toUpperCase() : "";
        if (code === "KODO15") {
          appliedCoupon = { code: "KODO15", discountPercent: 15 };
          showToast("Coupon KODO15 applied! 15% discount unlocked.");
          renderCart();
        } else if (code === "FREESHIP") {
          appliedCoupon = { code: "FREESHIP", freeShipping: true };
          showToast("Coupon FREESHIP applied! Free delivery unlocked.");
          renderCart();
        } else {
          showToast("Invalid promo code. Try KODO15");
        }
      });
    }

    renderCart();
  }

  function openCartDrawer() {
    const backdrop = document.getElementById("cart-drawer-backdrop");
    const drawer = document.getElementById("cart-drawer");
    if (backdrop && drawer) {
      backdrop.classList.add("active");
      drawer.classList.add("active");
      document.body.style.overflow = "hidden";
      renderCart();
    }
  }

  function closeCartDrawer() {
    const backdrop = document.getElementById("cart-drawer-backdrop");
    const drawer = document.getElementById("cart-drawer");
    if (backdrop && drawer) {
      backdrop.classList.remove("active");
      drawer.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  function addItemToCart(item) {
    const existing = cart.find(x => x.id === item.id);
    if (existing) {
      existing.quantity += (item.quantity || 1);
    } else {
      cart.push(item);
    }
    saveCart();
    renderCart();
  }

  function removeItemFromCart(id) {
    cart = cart.filter(x => x.id !== id);
    saveCart();
    renderCart();
  }

  function updateQuantity(id, delta) {
    const item = cart.find(x => x.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        removeItemFromCart(id);
        return;
      }
      saveCart();
      renderCart();
    }
  }

  function updateItemSize(id, newSize) {
    const item = cart.find(x => x.id === id);
    if (!item) return;
    const newId = `${item.productId || item.id.split('-')[0]}-${newSize}`;
    const duplicate = cart.find(x => x.id === newId);
    if (duplicate && duplicate !== item) {
      duplicate.quantity += item.quantity;
      cart = cart.filter(x => x.id !== id);
    } else {
      item.id = newId;
      item.size = newSize;
    }
    saveCart();
    renderCart();
  }

  function renderCart() {
    const itemsList = document.getElementById("cart-items-list");
    const emptyState = document.getElementById("cart-empty-state");
    const footer = document.getElementById("cart-drawer-footer");
    const meterProgress = document.getElementById("shipping-meter-progress");
    const meterText = document.getElementById("shipping-meter-text");

    if (!itemsList) return;

    if (cart.length === 0) {
      itemsList.innerHTML = "";
      if (emptyState) emptyState.classList.remove("hidden");
      if (footer) footer.classList.add("hidden");
      if (meterProgress) meterProgress.style.width = "0%";
      if (meterText) meterText.innerHTML = `Add items worth <b>₹${FREE_SHIPPING_THRESHOLD}</b> to get FREE Delivery!`;
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");
    if (footer) footer.classList.remove("hidden");

    let subtotal = 0;
    cart.forEach(it => {
      subtotal += (it.price * it.quantity);
    });

    const remainingForFree = FREE_SHIPPING_THRESHOLD - subtotal;
    const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    if (meterProgress) meterProgress.style.width = `${percent}%`;
    if (meterText) {
      if (remainingForFree <= 0 || (appliedCoupon && appliedCoupon.freeShipping)) {
        meterText.innerHTML = `🎉 <b>Congratulations!</b> You've unlocked FREE Express Shipping!`;
      } else {
        meterText.innerHTML = `Add <b>₹${remainingForFree}</b> more to get <b>FREE Express Shipping</b>!`;
      }
    }

    itemsList.innerHTML = cart.map(item => `
      <div class="flex gap-3 py-3 border-b border-neutral-100">
        <img src="${item.image}" alt="${item.title}" class="w-16 h-20 object-cover rounded-xl border border-neutral-200">
        <div class="flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h4 class="text-xs font-bold text-neutral-900 line-clamp-1">${item.title}</h4>
              <button type="button" class="remove-cart-item text-neutral-400 hover:text-red-500 text-xs" data-id="${item.id}">✕</button>
            </div>
            
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs font-extrabold text-neutral-900">₹${item.price}</span>
              ${item.comparePrice ? `<span class="text-[10px] text-neutral-400 line-through">₹${item.comparePrice}</span>` : ''}
              ${item.isDiy ? `<span class="text-[9px] font-bold bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">CUSTOM DIY</span>` : ''}
              ${item.isCombo ? `<span class="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">COMBO BUNDLE</span>` : ''}
            </div>

            <div class="mt-1 flex items-center gap-2">
              <span class="text-[10px] text-neutral-500">Size:</span>
              <select class="cart-size-select text-[10px] font-bold bg-neutral-50 border border-neutral-200 rounded px-1 py-0.5" data-id="${item.id}">
                ${(item.sizes || ["S", "M", "L", "XL", "XXL"]).map(sz => `
                  <option value="${sz}" ${sz === item.size ? 'selected' : ''}>${sz}</option>
                `).join("")}
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center border border-neutral-200 rounded-lg bg-white overflow-hidden">
              <button type="button" class="qty-btn px-2.5 py-0.5 text-xs font-bold hover:bg-neutral-100" data-id="${item.id}" data-delta="-1">-</button>
              <span class="px-2 text-xs font-extrabold">${item.quantity}</span>
              <button type="button" class="qty-btn px-2.5 py-0.5 text-xs font-bold hover:bg-neutral-100" data-id="${item.id}" data-delta="1">+</button>
            </div>
            <span class="text-xs font-bold text-neutral-900">₹${item.price * item.quantity}</span>
          </div>
        </div>
      </div>
    `).join("");

    let discountAmount = 0;
    if (appliedCoupon && appliedCoupon.discountPercent) {
      discountAmount = Math.round(subtotal * (appliedCoupon.discountPercent / 100));
    }
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || (appliedCoupon && appliedCoupon.freeShipping);
    const shippingFee = isFreeShipping ? 0 : 99;
    const finalTotal = subtotal - discountAmount + shippingFee;

    const subtotalEl = document.getElementById("cart-subtotal");
    const discountEl = document.getElementById("cart-discount");
    const discountRow = document.getElementById("cart-discount-row");
    const shippingEl = document.getElementById("cart-shipping");
    const totalEl = document.getElementById("cart-total");

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (discountEl && discountRow) {
      if (discountAmount > 0) {
        discountRow.classList.remove("hidden");
        discountEl.textContent = `-₹${discountAmount}`;
      } else {
        discountRow.classList.add("hidden");
      }
    }
    if (shippingEl) shippingEl.textContent = shippingFee === 0 ? "FREE" : `₹${shippingFee}`;
    if (totalEl) totalEl.textContent = `₹${finalTotal}`;

    itemsList.querySelectorAll(".qty-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const delta = parseInt(btn.dataset.delta, 10);
        updateQuantity(id, delta);
      });
    });

    itemsList.querySelectorAll(".remove-cart-item").forEach(btn => {
      btn.addEventListener("click", () => {
        removeItemFromCart(btn.dataset.id);
        showToast("Item removed from bag");
      });
    });

    itemsList.querySelectorAll(".cart-size-select").forEach(sel => {
      sel.addEventListener("change", (e) => {
        updateItemSize(sel.dataset.id, e.target.value);
        showToast(`Size updated to ${e.target.value}`);
      });
    });
  }

  function updateCartBadges() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll(".cart-badge-count").forEach(b => {
      b.textContent = totalCount;
      b.style.display = totalCount > 0 ? "flex" : "none";
    });
  }

  function updateWishlistBadge() {
    document.querySelectorAll(".wishlist-badge-count").forEach(b => {
      b.textContent = wishlist.length;
      b.style.display = wishlist.length > 0 ? "flex" : "none";
    });
  }

  function initQuickView() {
    const modal = document.getElementById("quick-view-modal");
    const closeBtn = document.getElementById("quick-view-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }
  }

  function openQuickViewModal(product) {
    const modal = document.getElementById("quick-view-modal");
    const body = document.getElementById("quick-view-body");
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div class="space-y-3">
          <div class="qv-zoom-container relative aspect-[3/4] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200 cursor-crosshair group">
            <img id="qv-main-img" src="${product.images[0]}" alt="${product.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-150 origin-center">
            <div class="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none">
              🔍 Hover to Zoom
            </div>
          </div>
          <div class="flex gap-2">
            ${product.images.map((img, idx) => `
              <img src="${img}" class="qv-thumb w-14 h-16 object-cover rounded-lg border-2 cursor-pointer transition-all ${idx === 0 ? 'border-blue-600' : 'border-neutral-200 opacity-70'}" data-src="${img}">
            `).join("")}
          </div>
        </div>

        <div class="flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1.5">
              <span class="${product.badgeColor} text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                ${product.badge}
              </span>
              <span class="text-xs text-amber-500 font-bold">★ ${product.rating} (${product.reviewsCount} reviews)</span>
            </div>

            <a href="product.html?id=${product.id}" class="text-lg md:text-xl font-extrabold text-neutral-900 hover:text-blue-600 block">
              ${product.title} ↗
            </a>
            
            <div class="flex items-baseline gap-3 mt-3">
              <span class="text-2xl font-black text-neutral-900">${formatMoney(product.price, product)}</span>
              <span class="text-sm text-neutral-400 line-through">${formatMoney(product.comparePrice, product)}</span>
              <span class="text-sm font-extrabold text-emerald-600">${product.discount}</span>
            </div>
            <p class="text-xs text-neutral-500 mt-1">${product.currency === "USD" ? "USD flash price for this special capsule." : "Inclusive of all taxes. Free shipping on orders over ₹799."}</p>

            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <span class="text-xs font-bold text-blue-900">⚡ Special Deal: ${product.offer}</span>
              <span class="text-[10px] font-extrabold text-blue-600 bg-white px-2 py-0.5 rounded shadow-sm">AUTO-APPLIED</span>
            </div>

            <div class="mt-5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-neutral-800 uppercase">Select Size:</span>
                <button type="button" class="text-xs font-extrabold text-[#2D8CE3] size-chart-btn">Size Guide 📏</button>
              </div>
              <div class="flex items-center gap-2" id="qv-size-options">
                ${product.sizes.map((s, idx) => `
                  <button type="button" class="qv-size-btn text-xs font-extrabold px-4 py-2 rounded-xl border border-neutral-300 text-neutral-800 ${idx === 0 ? 'bg-neutral-900 text-white border-neutral-900' : 'hover:border-neutral-800'}" data-size="${s}">
                    ${s}
                  </button>
                `).join("")}
              </div>
            </div>

            <div class="mt-5 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
              <span class="text-xs font-bold text-neutral-700 block mb-2">Check Estimated Delivery:</span>
              <div class="flex gap-2">
                <input type="text" id="pincode-input" placeholder="Enter 6-digit Pincode" maxlength="6" class="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:border-blue-600">
                <button type="button" id="pincode-check-btn" class="px-4 py-1.5 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800">Check</button>
              </div>
              <div id="pincode-status" class="mt-2 text-xs font-semibold text-neutral-600 hidden"></div>
            </div>

            <div class="mt-5 space-y-1.5 text-xs text-neutral-600">
              <div><b>Fabric:</b> ${product.fabric} (${product.gsm || 240} GSM)</div>
              <div><b>Fit:</b> ${product.fit}</div>
              <p class="mt-2 text-neutral-500 leading-relaxed">${product.description}</p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-neutral-100 flex gap-3">
            <button type="button" id="qv-add-to-bag-btn" class="flex-1 py-3.5 bg-neutral-900 hover:bg-[#2D8CE3] text-white text-sm font-extrabold rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
              <span>ADD TO BAG</span>
            </button>
            <button type="button" id="qv-buy-now-btn" class="flex-1 py-3.5 bg-[#2D8CE3] hover:bg-blue-600 text-white text-sm font-extrabold rounded-xl transition-colors shadow-md">
              BUY NOW (1-CLICK)
            </button>
          </div>
        </div>
      </div>
    `;

    const zoomContainer = body.querySelector(".qv-zoom-container");
    const zoomImg = body.querySelector("#qv-main-img");
    if (zoomContainer && zoomImg) {
      zoomContainer.addEventListener("mousemove", (e) => {
        const rect = zoomContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        zoomImg.style.transformOrigin = `${x}% ${y}%`;
      });
    }

    body.querySelectorAll(".qv-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        body.querySelectorAll(".qv-thumb").forEach(t => t.classList.remove("border-blue-600"));
        thumb.classList.add("border-blue-600");
        const main = document.getElementById("qv-main-img");
        if (main) main.src = thumb.dataset.src;
      });
    });

    let currentSelectedSize = product.sizes[0];
    body.querySelectorAll(".qv-size-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        body.querySelectorAll(".qv-size-btn").forEach(b => b.classList.remove("bg-neutral-900", "text-white", "border-neutral-900"));
        btn.classList.add("bg-neutral-900", "text-white", "border-neutral-900");
        currentSelectedSize = btn.dataset.size;
      });
    });

    const pinInput = document.getElementById("pincode-input");
    const pinBtn = document.getElementById("pincode-check-btn");
    const pinStatus = document.getElementById("pincode-status");
    if (pinBtn && pinInput && pinStatus) {
      pinBtn.addEventListener("click", () => {
        const val = pinInput.value.trim();
        if (val.length === 6 && /^\d+$/.test(val)) {
          pinStatus.classList.remove("hidden", "text-red-500");
          pinStatus.classList.add("text-emerald-600");
          pinStatus.innerHTML = `✓ Delivery available to <b>${val}</b>! Expected in <b>2-3 Days</b>. COD available.`;
        } else {
          pinStatus.classList.remove("hidden", "text-emerald-600");
          pinStatus.classList.add("text-red-500");
          pinStatus.textContent = "Please enter a valid 6-digit Indian PIN code.";
        }
      });
    }

    const sizeGuideBtn = body.querySelector(".size-chart-btn");
    if (sizeGuideBtn) sizeGuideBtn.addEventListener("click", openSizeChartModal);

    const qvAddBtn = document.getElementById("qv-add-to-bag-btn");
    if (qvAddBtn) {
      qvAddBtn.addEventListener("click", () => {
        addItemToCart({
          id: `${product.id}-${currentSelectedSize}`,
          productId: product.id,
          title: product.title,
          price: product.price,
          comparePrice: product.comparePrice,
          image: product.images[0],
          size: currentSelectedSize,
          sizes: product.sizes,
          quantity: 1
        });
        modal.classList.remove("active");
        document.body.style.overflow = "";
        openCartDrawer();
        showToast(`Added ${product.title} to bag!`);
      });
    }

    const qvBuyBtn = document.getElementById("qv-buy-now-btn");
    if (qvBuyBtn) {
      qvBuyBtn.addEventListener("click", () => {
        addItemToCart({
          id: `${product.id}-${currentSelectedSize}`,
          productId: product.id,
          title: product.title,
          price: product.price,
          comparePrice: product.comparePrice,
          image: product.images[0],
          size: currentSelectedSize,
          sizes: product.sizes,
          quantity: 1
        });
        modal.classList.remove("active");
        document.body.style.overflow = "";
        openCheckoutModal();
      });
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function openSizeChartModal() {
    if (typeof window.openSizeChartModal === "function") {
      window.openSizeChartModal();
      return;
    }
    let modal = document.getElementById("size-chart-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "size-chart-modal";
      modal.className = "modal-overlay fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4";
      modal.innerHTML = `
        <div class="modal-box bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
          <div class="flex items-center justify-between border-b pb-3 mb-4">
            <h3 class="text-base font-extrabold text-neutral-900 uppercase">Streetwear Size Guide (Inches)</h3>
            <button type="button" id="size-chart-close" class="text-neutral-400 hover:text-neutral-900 text-lg">✕</button>
          </div>
          <p class="text-xs text-neutral-500 mb-4">All measurements are in inches. Relaxed boxy cut with drop shoulders.</p>
          <table class="w-full text-xs text-left border-collapse">
            <thead>
              <tr class="bg-neutral-100 text-neutral-700 font-extrabold">
                <th class="p-2.5 rounded-l-lg">Size</th>
                <th class="p-2.5">Chest</th>
                <th class="p-2.5">Length</th>
                <th class="p-2.5 rounded-r-lg">Shoulder</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              ${window.KODO_DATA.SIZE_CHART.map(row => `
                <tr class="hover:bg-blue-50/50">
                  <td class="p-2.5 font-bold text-neutral-900">${row.size}</td>
                  <td class="p-2.5 text-neutral-600">${row.chest}</td>
                  <td class="p-2.5 text-neutral-600">${row.length}</td>
                  <td class="p-2.5 text-neutral-600">${row.shoulder}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      document.body.appendChild(modal);
      modal.querySelector("#size-chart-close").addEventListener("click", () => {
        modal.classList.remove("active");
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
      });
    }
    modal.classList.add("active");
  }

  // 11. Honest checkout: no fake payment success, no auto-confirmed payment.
  function initCheckoutModal() {
    const checkoutBtn = document.getElementById("cart-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        closeCartDrawer();
        openCheckoutModal();
      });
    }
  }

  function openCheckoutModal() {
    let modal = document.getElementById("checkout-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "checkout-modal";
      modal.className = "modal-overlay fixed inset-0 z-[10000] bg-white flex items-start justify-center p-0 overflow-y-auto";
      document.body.appendChild(modal);
    }

    let subtotal = cart.reduce((s, it) => s + (it.price * it.quantity), 0);
    let discount = appliedCoupon && appliedCoupon.discountPercent ? Math.round(subtotal * (appliedCoupon.discountPercent / 100)) : 0;
    let shipping = (subtotal >= FREE_SHIPPING_THRESHOLD || (appliedCoupon && appliedCoupon.freeShipping)) ? 0 : 99;
    let total = subtotal - discount + shipping;
    const MIN_GATEWAY_AMOUNT = 50;
    const codAdvance = Math.min(total, Math.max(MIN_GATEWAY_AMOUNT, Math.round(total * 0.25)));
    const codBalance = Math.max(0, total - codAdvance);

    modal.innerHTML = `
      <div class="modal-box bg-white w-full min-h-screen overflow-hidden">
        <div class="sticky top-0 z-10 bg-gradient-to-r from-[#2D8CE3] via-blue-600 to-[#8F54F0] px-4 sm:px-8 py-4 text-white flex items-center justify-between shadow-lg">
          <div class="flex items-center gap-3">
            <img src="assets/kodo-logo.png?v=4" alt="KODO Logo" class="h-6 w-auto object-contain bg-white/10 px-2 py-0.5 rounded-lg">
            <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Secure Checkout</span>
          </div>
          <button type="button" id="checkout-close" class="text-white hover:text-white/80 text-xl font-bold">✕</button>
        </div>

        <div id="checkout-content-area" class="max-w-4xl mx-auto p-4 sm:p-8">
          <div class="mb-6">
            <h4 class="text-xs font-black uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-[#2D8CE3] text-white flex items-center justify-center text-[10px]">1</span>
              Delivery Address
            </h4>
            <div class="space-y-2.5">
              <input type="text" id="chk-name" placeholder="Full Name" class="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500">
              <div class="flex rounded-xl border border-neutral-200 overflow-hidden focus-within:border-blue-500">
                <select id="chk-country-code" class="px-3.5 py-2 bg-neutral-50 text-xs font-black border-r border-neutral-200 focus:outline-none">
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <input type="tel" id="chk-phone" placeholder="Mobile Number" inputmode="numeric" class="w-full px-3.5 py-2 text-xs focus:outline-none">
              </div>
              <input type="text" id="chk-addr" placeholder="Complete Street Address" class="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500">
              <div class="grid grid-cols-2 gap-2">
                <input type="text" id="chk-city" placeholder="City" class="px-3.5 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500">
                <input type="text" id="chk-pin" placeholder="Pincode" class="px-3.5 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-blue-500">
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h4 class="text-xs font-black uppercase tracking-wider text-neutral-800 mb-3 flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-[#2D8CE3] text-white flex items-center justify-center text-[10px]">2</span>
              Payment Method
            </h4>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-blue-500 bg-blue-50/50 cursor-pointer payment-option">
                <input type="radio" name="payment-method" value="Dodo Secure Checkout" checked class="hidden">
                <span class="text-lg mb-1">🔒</span>
                <span class="text-[11px] font-extrabold text-blue-900">Secure Pay</span>
                <span class="text-[9px] text-emerald-600 font-bold">UPI / Card / Netbanking</span>
              </label>
              <label class="flex flex-col items-center justify-center p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 cursor-pointer payment-option">
                <input type="radio" name="payment-method" value="Cash On Delivery" class="hidden">
                <span class="text-lg mb-1">💵</span>
                <span class="text-[11px] font-extrabold text-neutral-800">COD + 25% Advance</span>
                <span class="text-[9px] text-neutral-400">Pay ₹${codAdvance} now</span>
              </label>
            </div>
            <div id="cod-advance-note" class="hidden mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] leading-relaxed text-amber-800">
              COD orders require a 25% non-refundable confirmation advance through secure checkout. Balance <b>₹${codBalance}</b> is payable in cash on delivery.
            </div>
          </div>

          <div class="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 mb-6">
            <div class="flex justify-between text-xs text-neutral-600 mb-1.5">
              <span>Items Total (${cart.reduce((s, it) => s + it.quantity, 0)})</span>
              <span>₹${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div class="flex justify-between text-xs text-emerald-600 font-bold mb-1.5">
                <span>Discount (Promo)</span>
                <span>-₹${discount}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-xs text-neutral-600 mb-2">
              <span>Delivery Fee</span>
              <span>${shipping === 0 ? '<span class="text-emerald-600 font-bold">FREE</span>' : `₹${shipping}`}</span>
            </div>
            <div class="border-t border-neutral-200 pt-2 flex justify-between text-sm font-black text-neutral-900">
              <span>Total Payable</span>
              <span class="text-blue-600">₹${total}</span>
            </div>
          </div>

          <button type="button" id="confirm-place-order-btn" class="w-full py-4 bg-[#2D8CE3] hover:bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
            <span>PAY SECURELY ₹${total}</span>
          </button>
        </div>
      </div>
    `;

    let selectedPayment = "Dodo Secure Checkout";
    modal.querySelectorAll(".payment-option").forEach(lbl => {
      lbl.addEventListener("click", () => {
        modal.querySelectorAll(".payment-option").forEach(l => {
          l.classList.remove("border-2", "border-blue-500", "bg-blue-50/50");
          l.classList.add("border", "border-neutral-200", "bg-white");
        });
        lbl.classList.add("border-2", "border-blue-500", "bg-blue-50/50");
        lbl.classList.remove("border", "border-neutral-200", "bg-white");
        const radio = lbl.querySelector("input[type='radio']");
        if (radio) {
          radio.checked = true;
          selectedPayment = radio.value;
        }
        const codNote = modal.querySelector("#cod-advance-note");
        const actionText = modal.querySelector("#confirm-place-order-btn span");
        if (codNote) codNote.classList.toggle("hidden", selectedPayment !== "Cash On Delivery");
        if (actionText) {
          actionText.textContent = selectedPayment === "Cash On Delivery"
            ? `PAY 25% COD ADVANCE ₹${codAdvance}`
            : `PAY SECURELY ₹${total}`;
        }
      });
    });

    modal.querySelector("#checkout-close").addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    modal.querySelector("#confirm-place-order-btn").addEventListener("click", async () => {
      const content = modal.querySelector("#checkout-content-area");
      const payBtn = modal.querySelector("#confirm-place-order-btn");
      const orderId = "KD-" + Math.floor(100000 + Math.random() * 900000);
      const name = modal.querySelector("#chk-name").value.trim();
      const countryCode = modal.querySelector("#chk-country-code")?.value || "+91";
      const phoneDigits = modal.querySelector("#chk-phone").value.replace(/\D/g, "");
      const phone = `${countryCode}${phoneDigits}`;
      const addr = modal.querySelector("#chk-addr").value.trim();
      const city = modal.querySelector("#chk-city").value.trim();
      const pin = modal.querySelector("#chk-pin").value.trim();

      if (!name || phoneDigits.length < 8 || !addr || !city || !/^\d{6}$/.test(pin)) {
        showToast("Please enter a real name, country-code phone, address, city, and 6-digit PIN.");
        return;
      }

      const orderLines = cart.map(it => `${it.quantity} x ${it.title} (${it.size || "Size not selected"}) - ₹${it.price * it.quantity}`).join("\n");
      const whatsappText = [
        `KODO order request ${orderId}`,
        "",
        orderLines,
        "",
        `Subtotal: ₹${subtotal}`,
        `Discount: ₹${discount}`,
        `Shipping: ₹${shipping}`,
        `Total: ₹${total}`,
        selectedPayment === "Cash On Delivery" ? `COD Advance Due Now: ₹${codAdvance}` : "",
        selectedPayment === "Cash On Delivery" ? `COD Balance on Delivery: ₹${codBalance}` : "",
        `Payment: ${selectedPayment}`,
        "",
        `Customer: ${name}`,
        `Phone: ${phone}`,
        `Address: ${addr}, ${city} - ${pin}`
      ].join("\n");
      const whatsappUrl = `https://wa.me/917046702094?text=${encodeURIComponent(whatsappText)}`;

      const isCod = selectedPayment === "Cash On Delivery";
      const newOrder = buildOrder(
        isCod ? "COD with 25% Advance" : "Dodo Secure Checkout",
        isCod ? `25% advance pending: ₹${codAdvance}; COD balance: ₹${codBalance}` : "Redirected to Dodo Checkout",
        "Awaiting Payment"
      );
      if (isCod) {
        newOrder.paymentMode = "cod_advance";
        newOrder.gatewayAmount = codAdvance;
        newOrder.codBalance = codBalance;
      } else {
        newOrder.paymentMode = "prepaid";
        newOrder.gatewayAmount = total;
      }

      if (payBtn) {
        payBtn.disabled = true;
        payBtn.classList.add("opacity-70", "cursor-wait");
        payBtn.innerHTML = isCod ? "<span>CREATING COD ADVANCE PAYMENT...</span>" : "<span>CREATING SECURE PAYMENT...</span>";
      }
      try {
        window.KODO_ANALYTICS?.track?.({
          type: "checkout_started",
          label: selectedPayment,
          value: total,
          currency: "INR"
        });
        const checkout = await createDodoCheckout(newOrder);
        newOrder.dodoPaymentId = checkout.paymentId;
        newOrder.paymentLink = checkout.checkoutUrl || checkout.paymentLink;
        await saveOrder(newOrder);
        window.KODO_ANALYTICS?.track?.({
          type: "order_created",
          label: newOrder.paymentMode,
          value: total,
          currency: "INR"
        });
        window.location.href = newOrder.paymentLink;
      } catch (err) {
        console.error("Dodo checkout error:", err);
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.classList.remove("opacity-70", "cursor-wait");
          payBtn.innerHTML = isCod ? `<span>PAY 25% COD ADVANCE ₹${codAdvance}</span>` : `<span>PAY SECURELY ₹${total}</span>`;
        }
        content.querySelector("#checkout-payment-error")?.remove();
        const paymentErrorMessage = err?.message || "Unable to create payment link. Please try again.";
        content.insertAdjacentHTML("beforeend", `
          <div id="checkout-payment-error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 leading-relaxed">
            <b>Payment could not start.</b><br>
            ${paymentErrorMessage}<br>
            No order was confirmed or charged. Please try again or switch to Secure Pay.
          </div>
        `);
      }
      return;

      function buildOrder(paymentMethod, paymentStatus, status) {
        return {
          orderId,
          date: new Date().toISOString(),
          customer: { name, phone, address: addr, city, pincode: pin },
          items: [...cart],
          subtotal,
          discount,
          shipping,
          total,
          paymentMethod,
          paymentStatus,
          status
        };
      }

      async function finalizeOrder() {
        const newOrder = buildOrder(selectedPayment, "COD Pending", "Order Request Received");
        const synced = await saveOrder(newOrder);

        content.innerHTML = `
          <div class="py-8 text-center">
            <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              →
            </div>
            <h3 class="text-lg font-black text-neutral-900">ORDER REQUEST READY</h3>
            <p class="text-xs font-bold text-[#2D8CE3] mt-1">Order #${orderId}</p>
            <p class="text-xs text-neutral-500 mt-2 max-w-xs mx-auto">
              Send this order on WhatsApp so the KODO team can verify payment, confirm stock, and dispatch only after real confirmation.
            </p>

            <div class="mt-6 p-4 bg-neutral-50 rounded-2xl text-left border border-neutral-200 text-xs space-y-1">
              <div class="font-bold text-neutral-800">Payment Status: ${newOrder.paymentStatus}</div>
              <div class="text-neutral-500">${synced ? "Saved to backend order queue." : "Static site mode: WhatsApp confirmation is required."}</div>
            </div>

            <div class="mt-6 flex flex-col sm:flex-row gap-2">
              <a href="track.html?id=${encodeURIComponent(orderId)}" class="flex-1 py-3.5 bg-blue-600 text-white text-center font-extrabold text-xs rounded-xl hover:bg-blue-700 transition-colors">
                TRACK ORDER
              </a>
              <a href="${whatsappUrl}" target="_blank" rel="noopener" class="flex-1 py-3.5 bg-emerald-600 text-white text-center font-extrabold text-xs rounded-xl hover:bg-emerald-700 transition-colors">
                SEND ON WHATSAPP
              </a>
              <button type="button" id="order-success-done-btn" class="flex-1 py-3.5 bg-neutral-900 text-white font-extrabold text-xs rounded-xl hover:bg-neutral-800 transition-colors">
                CONTINUE SHOPPING
              </button>
            </div>
          </div>
        `;

        cart = [];
        saveCart();
        renderCart();

        const doneBtn = content.querySelector("#order-success-done-btn");
        if (doneBtn) {
          doneBtn.addEventListener("click", () => {
            modal.classList.remove("active");
            document.body.style.overflow = "";
          });
        }
      }
    });

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function initSpinWheel() {
    const trigger = document.getElementById("spin-wheel-trigger");
    const modal = document.getElementById("spin-wheel-modal");
    const closeBtn = document.getElementById("spin-wheel-close");
    const canvas = document.getElementById("spin-canvas");
    const actionBtn = document.getElementById("spin-wheel-action-btn");
    const resultBox = document.getElementById("spin-result-box");
    const winText = document.getElementById("spin-win-text");

    if (!trigger || !modal || !canvas || !actionBtn) return;

    const segments = [
      { label: "15% OFF", code: "KODO15", color: "#2D8CE3" },
      { label: "₹200 CASH", code: "REBEL200", color: "#18181b" },
      { label: "20% OFF", code: "STREET20", color: "#ec4899" },
      { label: "FREE SHIP", code: "FREESHIP", color: "#8b5cf6" },
      { label: "3D PUFF", code: "FREEPUFF", color: "#059669" },
      { label: "10% OFF", code: "EXTRA10", color: "#d97706" }
    ];

    const ctx = canvas.getContext("2d");
    const numSegments = segments.length;
    const arc = (2 * Math.PI) / numSegments;
    let currentAngle = 0;
    let isSpinning = false;

    function drawWheel(angle) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = canvas.width / 2 - 8;

      segments.forEach((seg, i) => {
        const segAngle = angle + i * arc;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, segAngle, segAngle + arc);
        ctx.fillStyle = seg.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff25";
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(segAngle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px 'Space Grotesk', sans-serif";
        ctx.fillText(seg.label, radius - 18, 5);
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fbbf24";
      ctx.stroke();

      ctx.fillStyle = "#18181b";
      ctx.font = "bold 10px 'Syne', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KODO", cx, cy + 3.5);
    }

    drawWheel(currentAngle);

    trigger.addEventListener("click", () => {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    actionBtn.addEventListener("click", () => {
      if (isSpinning) return;

      if (actionBtn.dataset.won) {
        const wonCode = actionBtn.dataset.won;
        appliedCoupon = { code: wonCode, discountPercent: 20, discountFlat: 0 };
        showToast(`Coupon ${wonCode} auto-applied!`);
        modal.classList.remove("active");
        document.body.style.overflow = "";
        openCartDrawer();
        return;
      }

      isSpinning = true;
      actionBtn.disabled = true;
      actionBtn.textContent = "SPINNING... ⚡";
      resultBox.classList.add("hidden");

      const spinDuration = 3600;
      const startAngle = currentAngle;
      const targetWinningIndex = Math.floor(Math.random() * numSegments);
      const fullSpins = 5 * 2 * Math.PI;
      const targetSliceCenter = (targetWinningIndex * arc) + (arc / 2);
      const targetAngle = (3 * Math.PI / 2) - targetSliceCenter;
      const totalRotation = fullSpins + (targetAngle - (startAngle % (2 * Math.PI))) + (2 * Math.PI * 2);

      const startTime = performance.now();

      function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + totalRotation * easeOut;
        drawWheel(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          isSpinning = false;
          actionBtn.disabled = false;
          const wonSeg = segments[targetWinningIndex];
          resultBox.classList.remove("hidden");
          winText.textContent = `${wonSeg.label} — Use Code: ${wonSeg.code}`;
          actionBtn.dataset.won = wonSeg.code;
          actionBtn.textContent = `CLAIM & AUTO-APPLY (${wonSeg.code}) 🛍️`;
          showToast(`Unlocked ${wonSeg.code}!`);
        }
      }

      requestAnimationFrame(animate);
    });
  }

  function initSizePredictor() {
    const modal = document.getElementById("size-finder-modal");
    const closeBtn = document.getElementById("size-finder-close");
    const triggers = document.querySelectorAll(".size-finder-trigger, #size-guide-btn");
    const hSlider = document.getElementById("sf-height-slider");
    const wSlider = document.getElementById("sf-weight-slider");
    const hVal = document.getElementById("sf-height-val");
    const wVal = document.getElementById("sf-weight-val");
    const fitBtns = document.querySelectorAll(".sf-fit-btn");
    const resSize = document.getElementById("sf-result-size");
    const resDesc = document.getElementById("sf-result-desc");
    const applyBtn = document.getElementById("sf-apply-btn");

    if (!modal || !hSlider || !wSlider) return;

    let selectedFit = "oversized";

    function calcSize() {
      const height = parseInt(hSlider.value, 10);
      const weight = parseInt(wSlider.value, 10);

      const feet = Math.floor(height / 30.48);
      const inches = Math.round((height % 30.48) / 2.54);
      if (hVal) hVal.textContent = `${height} cm (${feet}'${inches}")`;
      if (wVal) wVal.textContent = `${weight} kg`;

      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);

      let size = "L";
      let chest = '44"';

      if (bmi < 20) {
        size = selectedFit === 'oversized' ? "M" : "S";
        chest = size === 'M' ? '42"' : '40"';
      } else if (bmi < 24.5) {
        size = selectedFit === 'oversized' ? "L" : "M";
        chest = size === 'L' ? '44"' : '42"';
      } else if (bmi < 29) {
        size = selectedFit === 'oversized' ? "XL" : "L";
        chest = size === 'XL' ? '46"' : '44"';
      } else {
        size = selectedFit === 'oversized' ? "XXL" : "XL";
        chest = size === 'XXL' ? '48"' : '46"';
      }

      if (resSize) resSize.textContent = `SIZE ${size}`;
      if (resDesc) resDesc.textContent = `Chest ${chest} • ${selectedFit.toUpperCase()} streetwear drape`;
      if (applyBtn) {
        applyBtn.textContent = `SELECT SIZE ${size} ON PAGE`;
        applyBtn.dataset.size = size;
      }
    }

    hSlider.addEventListener("input", calcSize);
    wSlider.addEventListener("input", calcSize);

    fitBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        fitBtns.forEach(b => {
          b.classList.remove("border-neutral-900", "bg-neutral-900", "text-white", "font-black");
          b.classList.add("border-neutral-300", "text-neutral-700", "font-bold");
        });
        btn.classList.add("border-neutral-900", "bg-neutral-900", "text-white", "font-black");
        btn.classList.remove("border-neutral-300", "text-neutral-700", "font-bold");
        selectedFit = btn.dataset.fit;
        calcSize();
      });
    });

    triggers.forEach(trig => {
      trig.addEventListener("click", (e) => {
        e.preventDefault();
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
        calcSize();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      });
    }

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        const pickedSize = applyBtn.dataset.size || "L";
        const diySizeBtns = document.querySelectorAll(".diy-size-btn");
        diySizeBtns.forEach(btn => {
          if (btn.dataset.size === pickedSize) {
            btn.click();
          }
        });
        modal.classList.remove("active");
        document.body.style.overflow = "";
        showToast(`Selected Size ${pickedSize}!`);
      });
    }

    calcSize();
  }

  window.selectCategory = selectCategory;
  window.CartManager = {
    addItem: addItemToCart,
    openDrawer: openCartDrawer,
    closeDrawer: closeCartDrawer
  };
})();
