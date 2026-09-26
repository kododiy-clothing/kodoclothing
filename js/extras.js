// KODO.DIY Extras: WhatsApp Support, UGC Reviews, Exit-Intent, OTP Login, FOMO Radar, Dark Mode & Global Currency

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    initHeroBannerCarousel();
    initUgcReviewModal();
    initExitIntentModal();
    initPhoneOtpModal();
    initFomoRadar();
    initDarkModeToggle();
    initCurrencyConverter();
    initVisualSizeChartModal();
    initKodoStylistBot();
    initMobileBottomDock();
    initProductPhotoRotator();
  });

  /* -------------------------------------------------------------
     1. HERO BANNER CAROUSEL CONTROLLER
     ------------------------------------------------------------- */
  function initHeroBannerCarousel() {
    const track = document.getElementById("hero-slider-track");
    const container = document.getElementById("hero-carousel-container");
    const prevBtn = document.getElementById("hero-prev-btn");
    const nextBtn = document.getElementById("hero-next-btn");
    const dots = document.querySelectorAll(".hero-dot");

    if (!track || !container) return;

    let currentIndex = 0;
    const totalSlides = track.children.length;
    let timer = null;
    const intervalTime = 4500; // 4.5s autoplay rotation

    function updateSlide(index) {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentIndex = index;

      // Smooth slide translate
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      // Update dot active indicator
      dots.forEach((dot, idx) => {
        if (idx === currentIndex) {
          dot.classList.remove("w-2", "bg-white/40");
          dot.classList.add("w-7", "bg-white");
        } else {
          dot.classList.remove("w-7", "bg-white");
          dot.classList.add("w-2", "bg-white/40");
        }
      });
    }

    function nextSlide() {
      updateSlide(currentIndex + 1);
    }

    function prevSlide() {
      updateSlide(currentIndex - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(nextSlide, intervalTime);
    }

    function stopAutoplay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevSlide();
        startAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextSlide();
        startAutoplay();
      });
    }

    dots.forEach((dot, idx) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateSlide(idx);
        startAutoplay();
      });
    });

    // Pause rotation when user is hovering over banner
    container.addEventListener("mouseenter", stopAutoplay);
    container.addEventListener("mouseleave", startAutoplay);

    // Touch swipe support for smooth mobile interaction
    let touchStartX = 0;
    let touchEndX = 0;

    container.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) {
        touchStartX = e.touches[0].screenX;
      }
      stopAutoplay();
    }, { passive: true });

    container.addEventListener("touchend", (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 40) {
          if (diffX > 0) {
            prevSlide();
          } else {
            nextSlide();
          }
        }
      }
      startAutoplay();
    }, { passive: true });

    startAutoplay();
  }

  /* -------------------------------------------------------------
     2. WHATSAPP FLOATING QUICK-SUPPORT WIDGET
     ------------------------------------------------------------- */
  function initWhatsAppWidget() {
    const wrap = document.createElement("div");
    wrap.id = "kodo-wa-widget";
    wrap.className = "fixed bottom-14 left-6 z-40";
    wrap.innerHTML = `
      <button type="button" id="wa-trigger-btn" class="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-2xl transition-all hover:scale-105 font-bold text-xs border border-emerald-400/40">
        <span class="text-base">💬</span>
        <span>Need Help? WhatsApp</span>
      </button>

      <div id="wa-flyout-card" class="hidden absolute bottom-14 left-0 w-72 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden text-neutral-900 dark:text-white transition-all">
        <div class="bg-neutral-950 p-4 text-white flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-base font-bold">
              💬
            </div>
            <div>
              <div class="font-syne font-black text-xs uppercase">KODO STREET SUPPORT</div>
              <div class="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Online • Replies in 2 mins
              </div>
            </div>
          </div>
          <button type="button" id="wa-close-card" class="text-neutral-400 hover:text-white text-sm font-bold">✕</button>
        </div>

        <div class="p-3 space-y-2 text-xs">
          <a href="track.html" class="flex items-center gap-2 p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-100 dark:border-neutral-800">
            <span>🚚</span>
            <span class="font-bold">Where is my order? (Track AWB)</span>
          </a>
          <a href="returns.html" class="flex items-center gap-2 p-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-100 dark:border-neutral-800">
            <span>🔄</span>
            <span class="font-bold">Size Exchange & Returns Portal</span>
          </a>
          <a href="collection.html?cat=all" class="flex items-center gap-2 p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-100 dark:border-neutral-800">
            <span>👕</span>
            <span class="font-bold">Browse All Streetwear Drops</span>
          </a>
          <a href="https://wa.me/917046702094?text=Hey%20KODO%2C%20I%20want%20to%20order%20custom%20bulk%20tees%20for%20our%20crew" target="_blank" class="flex items-center gap-2 p-2.5 rounded-xl hover:bg-pink-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors border border-neutral-100 dark:border-neutral-800">
            <span>🎨</span>
            <span class="font-bold">Custom Bulk DIY Inquiry</span>
          </a>
          <a href="https://wa.me/917046702094?text=Hey%20KODO%20Stylist%2C%20help%20me%20choose%20my%20size" target="_blank" class="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-center mt-2 shadow-sm">
            <span>Chat with Human Agent ↗</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);

    const triggerBtn = document.getElementById("wa-trigger-btn");
    const flyout = document.getElementById("wa-flyout-card");
    const closeCard = document.getElementById("wa-close-card");

    triggerBtn.addEventListener("click", () => {
      flyout.classList.toggle("hidden");
    });
    closeCard.addEventListener("click", () => {
      flyout.classList.add("hidden");
    });
  }

  /* -------------------------------------------------------------
     3. CUSTOMER REVIEW & FIT PIC SUBMISSION MODAL
     ------------------------------------------------------------- */
  function initUgcReviewModal() {
    const modal = document.createElement("div");
    modal.id = "ugc-review-modal";
    modal.className = "modal-overlay fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="modal-box bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left">
        <button type="button" id="ugc-modal-close" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 flex items-center justify-center font-bold">
          ✕
        </button>

        <div class="text-xs font-black tracking-widest text-pink-600 uppercase font-mono-tech mb-1">
          📸 STREETWEAR REBEL UGC WALL
        </div>
        <h3 class="font-syne text-2xl font-black uppercase text-neutral-900 dark:text-white">
          DROP YOUR FIT PIC & REVIEW
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-5">
          Submit your fit picture to get featured on <b>#KODOGANG</b> and earn <b>100 Rebel Coins</b> instantly!
        </p>

        <form id="ugc-review-form" class="space-y-4">
          <div>
            <label class="text-xs font-black uppercase tracking-wider text-neutral-700 dark:text-neutral-300 block mb-1">Your Rating:</label>
            <div class="flex items-center gap-1.5 text-2xl text-amber-400 cursor-pointer" id="ugc-star-rating">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Your Name / Handle</label>
              <input type="text" id="ugc-reviewer-name" required placeholder="@street_rebel" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none">
            </div>
            <div>
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">City</label>
              <input type="text" id="ugc-reviewer-city" required placeholder="Mumbai, DL, BLR" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Size Purchased</label>
              <select id="ugc-reviewer-size" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none">
                <option value="S">Size S</option>
                <option value="M">Size M</option>
                <option value="L" selected>Size L</option>
                <option value="XL">Size XL</option>
                <option value="XXL">Size XXL</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Your Height (cm)</label>
              <input type="number" id="ugc-reviewer-height" placeholder="178" value="175" class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-white focus:outline-none">
            </div>
          </div>

          <div>
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1">Review & Silhouette Comments</label>
            <textarea id="ugc-review-text" rows="3" required placeholder="Tell other rebels how the fabric feels, drape, GSM heaviness..." class="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"></textarea>
          </div>

          <div>
            <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">Upload Fit Picture:</label>
            <input type="file" id="ugc-photo-input" accept="image/*" class="w-full text-xs text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer">
            <div id="ugc-photo-preview" class="hidden mt-2">
              <img id="ugc-preview-img" class="w-24 h-32 object-cover rounded-xl border border-neutral-200">
            </div>
          </div>

          <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-pink-500 to-[#2D8CE3] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
            SUBMIT & CLAIM 100 REBEL COINS 🪙
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById("ugc-modal-close");
    const form = document.getElementById("ugc-review-form");
    const fileInput = document.getElementById("ugc-photo-input");
    const previewContainer = document.getElementById("ugc-photo-preview");
    const previewImg = document.getElementById("ugc-preview-img");

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

    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          previewContainer.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("ugc-reviewer-name").value;
      alert(`Thank you, ${name}! Your fit picture has been submitted for #KODOGANG verification. 100 Rebel Coins added to your account!`);
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    window.openUgcModal = function () {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    };
  }

  /* -------------------------------------------------------------
     4. EXIT-INTENT CART ABANDONMENT POP-UP
     ------------------------------------------------------------- */
  function initExitIntentModal() {
    let hasShown = sessionStorage.getItem("KODO_EXIT_SHOWN");
    if (hasShown) return;

    const modal = document.createElement("div");
    modal.id = "exit-intent-modal";
    modal.className = "modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="modal-box bg-neutral-950 text-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-white/20 text-center relative overflow-hidden">
        <button type="button" id="exit-modal-close" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center font-bold">
          ✕
        </button>
        <div class="inline-flex items-center gap-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider mb-3">
          ⚡ EXCLUSIVE EXIT PASS
        </div>
        <h3 class="font-syne text-2xl sm:text-3xl font-black uppercase tracking-tight">
          WAIT REBEL! DON'T LEAVE YOUR FIT BEHIND
        </h3>
        <p class="text-xs text-neutral-400 mt-2 mb-5">
          Take an instant <span class="text-amber-400 font-bold">EXTRA 10% OFF</span> on your entire cart before drops sell out!
        </p>
        <div class="p-4 bg-white/5 rounded-2xl border border-white/15 space-y-2 mb-5">
          <div class="text-[10px] uppercase font-mono-tech tracking-widest text-neutral-400">YOUR VIP REBEL CODE:</div>
          <div class="text-2xl font-black font-mono-tech text-amber-400 tracking-wider">DONTGO10</div>
          <div class="text-[11px] text-pink-400 font-bold flex items-center justify-center gap-1">
            <span>⏳</span> Offer expires in <span id="exit-timer">04:59</span>
          </div>
        </div>
        <button type="button" id="exit-apply-btn" class="w-full py-4 bg-gradient-to-r from-pink-500 via-purple-600 to-[#2D8CE3] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all hover:scale-102 shadow-lg shadow-pink-500/25">
          CLAIM 10% OFF & CHECKOUT NOW 🛍️
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById("exit-modal-close");
    const applyBtn = document.getElementById("exit-apply-btn");
    const timerEl = document.getElementById("exit-timer");

    let seconds = 299;
    setInterval(() => {
      if (seconds > 0) {
        seconds--;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        if (timerEl) timerEl.textContent = `${m}:${s}`;
      }
    }, 1000);

    function triggerModal() {
      const cart = JSON.parse(localStorage.getItem("KODO_CART") || "[]");
      if (cart.length > 0 && !hasShown) {
        hasShown = true;
        sessionStorage.setItem("KODO_EXIT_SHOWN", "true");
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    }

    document.addEventListener("mouseleave", (e) => {
      if (e.clientY <= 15) triggerModal();
    });

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    applyBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
      alert("Coupon DONTGO10 copied & applied! Directing to checkout...");
      if (window.location.pathname.includes("index.html") || window.location.pathname === "/") {
        const couponInput = document.getElementById("cart-coupon-input");
        const couponBtn = document.getElementById("cart-coupon-apply");
        if (couponInput && couponBtn) {
          couponInput.value = "DONTGO10";
          couponBtn.click();
        }
        if (window.CartManager) window.CartManager.openDrawer();
      } else {
        window.location.href = "index.html";
      }
    });
  }

  /* -------------------------------------------------------------
     5. REAL SIGN-IN NOTICE
     ------------------------------------------------------------- */
  function initPhoneOtpModal() {
    const modal = document.createElement("div");
    modal.id = "phone-otp-modal";
    modal.className = "modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="modal-box bg-white dark:bg-neutral-900 rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative text-neutral-900 dark:text-white">
        <button type="button" id="otp-modal-close" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 flex items-center justify-center font-bold">
          ✕
        </button>

        <div class="w-12 h-12 rounded-2xl bg-blue-50 text-[#2D8CE3] flex items-center justify-center mx-auto text-xl mb-2">
          📱
        </div>
        <h3 class="font-syne text-xl font-black uppercase text-neutral-900 dark:text-white">
          KODO REBEL CLUB SIGN IN
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-5">
          Real customer sign-in needs an OTP provider or Google OAuth. Demo OTP is disabled on this production storefront.
        </p>

        <div id="otp-step-1" class="space-y-4">
          <div class="flex items-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl px-3 py-2.5">
            <span class="text-xs font-bold text-neutral-500 mr-2 font-mono-tech">+91</span>
            <input type="tel" id="otp-phone-input" placeholder="Enter mobile number" maxlength="10" class="w-full text-xs font-bold bg-transparent focus:outline-none text-neutral-900 dark:text-white">
          </div>
          <button type="button" id="otp-send-btn" class="w-full py-3.5 bg-neutral-900 dark:bg-blue-600 hover:bg-[#2D8CE3] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md">
            CHECK SIGN-IN SETUP →
          </button>
        </div>

        <div id="otp-step-2" class="hidden space-y-4">
          <div class="text-xs text-neutral-600 dark:text-neutral-400">
            Sign-in setup required for <b id="otp-display-phone" class="text-neutral-900 dark:text-white">this number</b>
          </div>
          <div class="flex justify-center gap-2 my-3">
            <input type="text" maxlength="1" disabled class="otp-digit w-12 h-12 text-center text-lg font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none">
            <input type="text" maxlength="1" disabled class="otp-digit w-12 h-12 text-center text-lg font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none">
            <input type="text" maxlength="1" disabled class="otp-digit w-12 h-12 text-center text-lg font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none">
            <input type="text" maxlength="1" disabled class="otp-digit w-12 h-12 text-center text-lg font-black bg-neutral-100 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none">
          </div>
          <div class="text-[11px] text-emerald-600 font-bold">
            Connect Google OAuth, Firebase Auth, or an SMS OTP provider before enabling login.
          </div>
          <button type="button" id="otp-verify-btn" class="w-full py-3.5 bg-[#2D8CE3] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors shadow-md">
            GO TO ACCOUNT
          </button>
        </div>

      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = document.getElementById("otp-modal-close");
    const step1 = document.getElementById("otp-step-1");
    const step2 = document.getElementById("otp-step-2");
    const sendBtn = document.getElementById("otp-send-btn");
    const verifyBtn = document.getElementById("otp-verify-btn");
    const phoneInput = document.getElementById("otp-phone-input");
    const displayPhone = document.getElementById("otp-display-phone");

    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    sendBtn.addEventListener("click", () => {
      const val = phoneInput.value.trim();
      if (val.length === 10) {
        displayPhone.textContent = `+91 ${val}`;
        step1.classList.add("hidden");
        step2.classList.remove("hidden");
      } else {
        alert("Please enter a valid 10-digit mobile number.");
      }
    });

    verifyBtn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
      window.location.href = "account.html";
    });

    window.openPhoneOtpModal = function () {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    };
  }

  /* -------------------------------------------------------------
     6. LIVE SOCIAL PROOF FOMO RADAR
     ------------------------------------------------------------- */
  function initFomoRadar() {
    const fomo = document.createElement("div");
    fomo.id = "kodo-fomo-toast";
    fomo.className = "fomo-toast fixed bottom-28 left-6 z-30 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-3 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 max-w-xs flex items-center gap-3 text-xs";
    document.body.appendChild(fomo);

    const fomoEvents = [
      { name: "Aryan S.", city: "Mumbai", item: "Solar Eclipse: 'Same Sky' 280 GSM Tee (Size L)", time: "2 mins ago", img: "assets/products/same-sky-tee/front.jpg" },
      { name: "Kabir V.", city: "Gurugram", item: "Alpine Summit 'Higher Than Yesterday' Tee", time: "3 mins ago", img: "assets/products/altitude-tee/front.jpg" },
      { name: "Zoya K.", city: "Delhi", item: "Nocturnal Crescent Moon Embroidered Tee", time: "1 min ago", img: "assets/products/crescent-moon-tee/front.jpg" },
      { name: "Tanya M.", city: "Bengaluru", item: "Tokyo Drift: Racing Division GT-R 280 GSM Tee", time: "6 mins ago", img: "assets/products/racing-division-tee/front.jpg" },
      { name: "Aarav R.", city: "Hyderabad", item: "KODO 'After Hours' 11:47 PM Celestial Tee", time: "Just now", img: "assets/products/after-hours-tee/front.jpg" }
    ];

    let idx = 0;

    function showNextFomo() {
      const ev = fomoEvents[idx % fomoEvents.length];
      fomo.innerHTML = `
        <img src="${ev.img}" class="w-11 h-13 object-cover rounded-xl border border-neutral-200 dark:border-neutral-700 flex-shrink-0">
        <div class="flex-1 min-w-0">
          <div class="font-bold truncate text-[11px] text-[#2D8CE3] uppercase">⚡ RECENT VERIFIED DROP</div>
          <div class="text-[11px] font-black text-neutral-900 dark:text-white truncate">${ev.name} (${ev.city})</div>
          <div class="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">Bought: ${ev.item}</div>
          <div class="text-[9px] text-neutral-400 mt-0.5">${ev.time} • Verified Rebel</div>
        </div>
        <button type="button" onclick="document.getElementById('kodo-fomo-toast').classList.remove('show');" class="text-neutral-400 hover:text-neutral-600 text-xs p-1">✕</button>
      `;
      fomo.classList.add("show");

      setTimeout(() => {
        fomo.classList.remove("show");
      }, 5500);

      idx++;
      setTimeout(showNextFomo, 18000);
    }

    setTimeout(showNextFomo, 3500);
  }

  /* -------------------------------------------------------------
     7. CYBER REBEL OLED DARK MODE TOGGLE
     ------------------------------------------------------------- */
  function initDarkModeToggle() {
    if (!sessionStorage.getItem("KODO_WHITE_INIT")) {
      localStorage.setItem("KODO_THEME", "light");
      document.body.classList.remove("dark-mode");
      sessionStorage.setItem("KODO_WHITE_INIT", "true");
    }
    const savedTheme = localStorage.getItem("KODO_THEME") || "light";
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    let btn = document.getElementById("theme-toggle-btn");
    if (!btn) {
      const headerFlexes = document.querySelectorAll("header .flex.items-center");
      const rightActions = document.getElementById("header-right-actions") || (headerFlexes.length > 1 ? headerFlexes[headerFlexes.length - 1] : null);
      if (rightActions) {
        btn = document.createElement("button");
        btn.id = "theme-toggle-btn";
        btn.type = "button";
        btn.className = "p-2 sm:p-2.5 rounded-xl text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors text-base font-bold flex-shrink-0";
        btn.title = "Toggle Cyber Dark Mode";
        btn.innerHTML = savedTheme === "dark" ? "☀️" : "🌙";
        rightActions.prepend(btn);
      }
    }

    btn?.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("KODO_THEME", isDark ? "dark" : "light");
      btn.innerHTML = isDark ? "☀️" : "🌙";
    });
  }

  /* -------------------------------------------------------------
     8. MULTI-CURRENCY GLOBAL SWITCHER
     ------------------------------------------------------------- */
  function initCurrencyConverter() {
    const currencies = {
      INR: { symbol: "₹", rate: 1.0 },
      USD: { symbol: "$", rate: 0.012 },
      AED: { symbol: "AED ", rate: 0.044 },
      GBP: { symbol: "£", rate: 0.0095 },
      EUR: { symbol: "€", rate: 0.011 }
    };

    let activeCur = localStorage.getItem("KODO_CURRENCY") || "INR";

    const topBar = document.querySelector(".bg-neutral-950.text-white");
    if (topBar && !document.getElementById("currency-select")) {
      const curSelect = document.createElement("select");
      curSelect.id = "currency-select";
      curSelect.className = "ml-3 bg-neutral-900 text-amber-400 text-[10px] font-black font-mono-tech px-2 py-0.5 rounded border border-neutral-700 focus:outline-none cursor-pointer";
      curSelect.innerHTML = Object.keys(currencies).map(c => `
        <option value="${c}" ${c === activeCur ? 'selected' : ''}>${c} (${currencies[c].symbol})</option>
      `).join("");
      topBar.appendChild(curSelect);
      curSelect.addEventListener("change", (e) => {
        activeCur = e.target.value;
        localStorage.setItem("KODO_CURRENCY", activeCur);
        alert(`Currency updated to ${activeCur}! Prices recalculated for global checkout.`);
        location.reload();
      });
    }

    function applyDomConversion(curKey) {
      if (curKey === "INR") return;
      const conf = currencies[curKey];
      if (!conf) return;

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const nodesToChange = [];
      while ((node = walker.nextNode())) {
        if (node.parentElement && !["SCRIPT", "STYLE", "TEXTAREA"].includes(node.parentElement.tagName)) {
          if (node.nodeValue && node.nodeValue.includes("₹")) {
            nodesToChange.push(node);
          }
        }
      }
      nodesToChange.forEach(n => {
        n.nodeValue = n.nodeValue.replace(/₹\s?([\d,]+)/g, (match, p1) => {
          const num = parseFloat(p1.replace(/,/g, ""));
          if (isNaN(num)) return match;
          const converted = Math.round(num * conf.rate);
          return `${conf.symbol}${converted.toLocaleString()}`;
        });
      });
    }

    if (activeCur !== "INR") {
      setTimeout(() => applyDomConversion(activeCur), 300);
      setTimeout(() => applyDomConversion(activeCur), 1200);
    }
  }

  /* -------------------------------------------------------------
     9. VISUAL "HOW TO MEASURE" STREETWEAR SIZE CHART MODAL
     ------------------------------------------------------------- */
  function initVisualSizeChartModal() {
    const modal = document.createElement("div");
    modal.id = "size-chart-modal";
    modal.className = "modal-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4";
    modal.innerHTML = `
      <div class="modal-box bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative max-h-[90vh] overflow-y-auto">
        <button type="button" id="size-chart-close" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-900 flex items-center justify-center font-bold">
          ✕
        </button>

        <div class="text-xs font-black tracking-widest text-[#2D8CE3] uppercase font-mono-tech mb-1">
          📐 VEIRDO INSPIRED FIT BLUEPRINT
        </div>
        <h3 class="font-syne text-2xl font-black uppercase tracking-tight">
          OVERSIZED STREETWEAR SIZE GUIDE
        </h3>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-5">
          Veirdo & KODO cuts feature dropped shoulders with boxy chest drape. All measurements are for garment flat lay.
        </p>

        <div class="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div class="w-36 h-40 flex items-center justify-center text-center font-mono-tech text-[10px] bg-white dark:bg-neutral-900 rounded-xl border border-neutral-300 dark:border-neutral-700 p-2 shadow-sm">
            <div>
              <div class="text-2xl mb-1">👕</div>
              <div class="font-bold text-[#2D8CE3]">A. Chest Width</div>
              <div class="text-purple-400 font-bold">B. Body Length</div>
              <div class="text-emerald-500 font-bold">C. Shoulder Drop</div>
            </div>
          </div>
          <div class="space-y-1.5 text-xs">
            <div><b>A. Chest Width:</b> Measure across garment chest 1 inch below armholes.</div>
            <div><b>B. Body Length:</b> Measure from highest point of shoulder collar down to bottom hem.</div>
            <div><b>C. Shoulder Drop:</b> Relaxed extended seam creating the effortless street silhouette.</div>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b-2 border-neutral-900 dark:border-neutral-700 font-black uppercase text-neutral-500 text-[11px]">
                <th class="py-2.5">Size</th>
                <th class="py-2.5">Chest (Inches)</th>
                <th class="py-2.5">Length (Inches)</th>
                <th class="py-2.5">Shoulder Drop</th>
                <th class="py-2.5">Recommended For</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800 font-bold">
              <tr>
                <td class="py-2.5 text-[#2D8CE3] font-black">S</td>
                <td class="py-2.5">40" (101 cm)</td>
                <td class="py-2.5">28" (71 cm)</td>
                <td class="py-2.5">19.5"</td>
                <td class="py-2.5 text-neutral-500 font-normal">Height 5'3" - 5'6"</td>
              </tr>
              <tr>
                <td class="py-2.5 text-[#2D8CE3] font-black">M</td>
                <td class="py-2.5">42" (107 cm)</td>
                <td class="py-2.5">29" (73 cm)</td>
                <td class="py-2.5">20.5"</td>
                <td class="py-2.5 text-neutral-500 font-normal">Height 5'7" - 5'9"</td>
              </tr>
              <tr class="bg-blue-50/50 dark:bg-blue-950/20">
                <td class="py-2.5 text-[#2D8CE3] font-black">L (Most Popular)</td>
                <td class="py-2.5">44" (112 cm)</td>
                <td class="py-2.5">30" (76 cm)</td>
                <td class="py-2.5">21.5"</td>
                <td class="py-2.5 text-neutral-500 font-normal">Height 5'9" - 6'0"</td>
              </tr>
              <tr>
                <td class="py-2.5 text-[#2D8CE3] font-black">XL</td>
                <td class="py-2.5">46" (117 cm)</td>
                <td class="py-2.5">31" (78 cm)</td>
                <td class="py-2.5">22.5"</td>
                <td class="py-2.5 text-neutral-500 font-normal">Height 6'0" - 6'2"</td>
              </tr>
              <tr>
                <td class="py-2.5 text-[#2D8CE3] font-black">XXL</td>
                <td class="py-2.5">48" (122 cm)</td>
                <td class="py-2.5">32" (81 cm)</td>
                <td class="py-2.5">23.5"</td>
                <td class="py-2.5 text-neutral-500 font-normal">Heavyweight Built</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span class="text-xs text-neutral-400">Still unsure? Contact our stylist via WhatsApp.</span>
          <button type="button" onclick="document.getElementById('size-chart-modal').classList.remove('active'); document.body.style.overflow='';" class="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-black text-xs uppercase rounded-xl">
            GOT IT
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("size-chart-close")?.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    window.openSizeChartModal = function () {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    };
  }

  /* -------------------------------------------------------------
     10. AI STREETWEAR STYLIST ASSISTANT ("KODO BOT")
     ------------------------------------------------------------- */
  function initKodoStylistBot() {
    if (document.getElementById("kodo-bot-trigger")) return;

    // Floating Bot Trigger
    const trigger = document.createElement("button");
    trigger.id = "kodo-bot-trigger";
    trigger.type = "button";
    trigger.className = "fixed bottom-6 right-6 z-40 bg-neutral-950 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl border-2 border-[#2D8CE3] hidden md:flex items-center gap-2.5 hover:scale-105 transition-all group font-syne cursor-pointer";
    trigger.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="text-xl">🤖</span>
        <span class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
        </span>
      </div>
      <div class="text-left hidden sm:block">
        <div class="text-[11px] font-black uppercase tracking-wider text-sky-400 leading-none">KODO BOT</div>
        <div class="text-[9px] text-neutral-400 font-mono-tech leading-none mt-0.5">AI Drip Stylist</div>
      </div>
    `;
    document.body.appendChild(trigger);

    // Chat Window
    const chatWin = document.createElement("div");
    chatWin.id = "kodo-bot-window";
    chatWin.className = "fixed bottom-20 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden transition-all duration-300 transform scale-95 opacity-0 pointer-events-none";
    chatWin.style.maxHeight = "540px";
    chatWin.style.height = "520px";

    chatWin.innerHTML = `
      <!-- Header -->
      <div class="bg-neutral-950 text-white p-4 flex items-center justify-between border-b border-neutral-800">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-neutral-800 border border-sky-400 flex items-center justify-center text-base">
            🤖
          </div>
          <div>
            <div class="font-syne text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <span>KODO AI DRIP STYLIST</span>
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            </div>
            <div class="text-[9px] text-neutral-400 font-mono-tech">Powered by KODO Atelier Engine</div>
          </div>
        </div>
        <button type="button" id="kodo-bot-close" class="text-neutral-400 hover:text-white text-base p-1">✕</button>
      </div>

      <!-- Messages Stream -->
      <div id="kodo-bot-messages" class="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        <!-- Initial Bot Message -->
        <div class="flex items-start gap-2.5">
          <div class="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[10px] flex-shrink-0">🤖</div>
          <div class="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-3 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed">
            Yo fam! 👋 Looking for the perfect oversized streetwear silhouette or a full drip combo for college / concerts?
            <div class="mt-2 text-[11px] font-bold text-[#2D8CE3]">Tap a vibe preset below or ask me anything!</div>
          </div>
        </div>
      </div>

      <!-- Quick Chips -->
      <div class="p-2.5 bg-neutral-50 dark:bg-neutral-950/60 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap">
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:border-emerald-500 transition-all" data-query="ambassador">
          💸 Earn 12% Cash
        </button>
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-pink-600 dark:text-pink-400 hover:border-pink-500 transition-all" data-query="women">
          🎀 Women's Street Drip
        </button>
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 transition-all" data-query="college">
          🎓 College Drip (Under ₹1,500)
        </button>
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 transition-all" data-query="cyberpunk">
          ⚡ Tokyo Cyberpunk Look
        </button>
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 transition-all" data-query="winter">
          ❄️ Heavyweight Winter Drip
        </button>
        <button type="button" class="bot-preset-chip px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full text-[10px] font-bold text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 transition-all" data-query="sneakers">
          👟 Match My Kicks
        </button>
      </div>

      <!-- Input Bar -->
      <form id="kodo-bot-form" class="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <input type="text" id="kodo-bot-input" placeholder="Type a vibe (e.g. 'baggy cargos', 'black hoodie')..." class="flex-1 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-[#2D8CE3]">
        <button type="submit" class="px-3 py-2 bg-[#2D8CE3] text-white rounded-xl text-xs font-black hover:bg-blue-600 transition-colors">
          ➤
        </button>
      </form>
    `;
    document.body.appendChild(chatWin);

    // Toggle Chat
    let isOpen = false;
    function toggleChat(open) {
      isOpen = typeof open === "boolean" ? open : !isOpen;
      if (isOpen) {
        chatWin.classList.remove("scale-95", "opacity-0", "pointer-events-none");
        chatWin.classList.add("scale-100", "opacity-100", "pointer-events-auto");
      } else {
        chatWin.classList.remove("scale-100", "opacity-100", "pointer-events-auto");
        chatWin.classList.add("scale-95", "opacity-0", "pointer-events-none");
      }
    }
    window.openKodoBot = () => toggleChat(true);

    trigger.addEventListener("click", () => toggleChat());
    chatWin.querySelector("#kodo-bot-close")?.addEventListener("click", () => toggleChat(false));

    // Preset chips & form submission
    const msgContainer = chatWin.querySelector("#kodo-bot-messages");
    const chatSessionId = (() => {
      const key = "KODO_CHAT_SESSION_ID";
      let existing = localStorage.getItem(key);
      if (!existing) {
        existing = `web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(key, existing);
      }
      return existing;
    })();

    function saveChatLocal(sender, message) {
      try {
        const key = "KODO_CHAT_LOGS";
        const logs = JSON.parse(localStorage.getItem(key) || "[]");
        logs.push({
          id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          sessionId: chatSessionId,
          sender,
          message,
          page: window.location.pathname + window.location.search,
          productId: new URLSearchParams(window.location.search).get("id") || "",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(logs.slice(-200)));
      } catch (e) {}
    }

    function logChatMessage(sender, message) {
      saveChatLocal(sender, message);
      fetch("/api/chat/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: chatSessionId,
          sender,
          message,
          page: window.location.pathname + window.location.search,
          productId: new URLSearchParams(window.location.search).get("id") || ""
        })
      }).catch(() => {});
    }

    function addMessage(sender, text, outfitCard) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `flex items-start gap-2.5 ${sender === 'user' ? 'justify-end' : ''}`;
      if (sender === "user") {
        msgDiv.innerHTML = `
          <div class="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 p-3 rounded-2xl rounded-tr-none max-w-[85%] font-medium">
            ${text}
          </div>
        `;
      } else {
        msgDiv.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[10px] flex-shrink-0">🤖</div>
          <div class="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-3 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed">
            <div>${text}</div>
            ${outfitCard ? outfitCard : ''}
          </div>
        `;
      }
      msgContainer.appendChild(msgDiv);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    // Curated recommendations database
    function handleStylistQuery(query) {
      const q = query.toLowerCase();
      let replyText = "";
      let outfitCard = "";

      if (q.includes("ambassador") || q.includes("affiliate") || q.includes("earn") || q.includes("cash") || q.includes("commission") || q.includes("rep")) {
        replyText = "Wanna rep KODO and stack cash? 💸 Join the KODO Campus Ambassador & Creator Syndicate! You get an exclusive 15% OFF discount code for your campus squad, and earn 12% flat cash commission on every single order paid directly into your UPI account, plus free monthly streetwear drops!";
        outfitCard = `
          <div class="mt-3 p-3 bg-neutral-900 dark:bg-black rounded-xl border border-emerald-500/40 text-white text-left">
            <div class="text-[10px] font-black uppercase text-emerald-400 font-mono-tech mb-1">🤝 12% CASH AMBASSADOR PROGRAM</div>
            <div class="text-[11px] text-neutral-300 mb-2.5">Generate your custom 15% OFF coupon, track live earnings, and withdraw via instant UPI cashouts.</div>
            <a href="ambassador.html" class="block w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-center rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow-md">
              🚀 Launch Ambassador Dashboard ↗
            </a>
          </div>
        `;
      } else if (q.includes("women") || q.includes("girl") || q.includes("baby tee") || q.includes("crop") || q.includes("skort")) {
        replyText = "Say less queen! 🎀 For women's streetwear, the elite proportion is a fitted Y2K Ribbed Baby Tee paired with high-waisted, wide-leg Parachute Pants. It gives that effortless Bella Hadid / Tokyo Harajuku silhouette:";
        outfitCard = `
          <div class="mt-3 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-rose-200 dark:border-rose-900 shadow-sm">
            <div class="text-[10px] font-black uppercase text-pink-600 font-mono-tech mb-1">🎀 KODO ARCHIVE • 2-PIECE DRIP</div>
            <div class="flex items-center gap-2 mb-2">
              <img src="assets/products/same-sky-tee/front.jpg" class="w-10 h-12 object-cover rounded-lg border">
              <div class="text-[11px] font-bold leading-tight">
                <div>Solar Eclipse 'Same Sky' + Crescent Moon Tee</div>
                <div class="text-neutral-400 font-mono-tech text-[9px]">Combo Deal: ₹999 (Save ₹1,599)</div>
              </div>
            </div>
            <button type="button" onclick="window.addBotFitToCart('kd-same-sky', 'kd-moon', 'KODO Celestial Duo', 999)" class="w-full py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg text-[10px] font-black uppercase">
              ⚡ Add Entire Fit to Bag (₹999)
            </button>
          </div>
        `;
      } else if (q.includes("college") || q.includes("under") || q.includes("1500") || q.includes("budget")) {
        replyText = "For college lectures and daily chilling, go with an effortless oversized graphic tee pairing. Clean, ultra-dense 280 GSM French Terry cotton that drapes with an effortless streetwear silhouette:";
        outfitCard = `
          <div class="mt-3 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div class="text-[10px] font-black uppercase text-[#2D8CE3] font-mono-tech mb-1">CURATED FIT • 2-PIECE DRIP</div>
            <div class="flex items-center gap-2 mb-2">
              <img src="assets/products/altitude-tee/front.jpg" class="w-10 h-12 object-cover rounded-lg border">
              <div class="text-[11px] font-bold leading-tight">
                <div>Alpine Summit + Solar Eclipse Tee</div>
                <div class="text-neutral-400 font-mono-tech text-[9px]">Combo Deal: ₹999 (Save ₹1,599)</div>
              </div>
            </div>
            <button type="button" onclick="window.addBotFitToCart('kd-altitude', 'kd-same-sky', 'College Drip Combo', 999)" class="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-[10px] font-black uppercase">
              ⚡ Add Entire Fit to Bag (₹999)
            </button>
          </div>
        `;
      } else if (q.includes("cyber") || q.includes("tokyo") || q.includes("anime")) {
        replyText = "Straight out of Shibuya underground! Layer our Tokyo Drift Racing Division GT-R tee with the Tokyo Cyber 'NO SIGNAL' glitch drop. Underground JDM graphics hit hard:";
        outfitCard = `
          <div class="mt-3 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div class="text-[10px] font-black uppercase text-[#2D8CE3] font-mono-tech mb-1">CURATED FIT • TOKYO CYBERPUNK</div>
            <div class="flex items-center gap-2 mb-2">
              <img src="assets/products/racing-division-tee/front.jpg" class="w-10 h-12 object-cover rounded-lg border">
              <div class="text-[11px] font-bold leading-tight">
                <div>Tokyo Drift GT-R + NO SIGNAL Tee</div>
                <div class="text-neutral-400 font-mono-tech text-[9px]">Combo Deal: ₹999 (Save ₹1,599)</div>
              </div>
            </div>
            <button type="button" onclick="window.addBotFitToCart('kd-racing-division', 'kd-no-signal', 'Tokyo Cyber Combo', 999)" class="w-full py-2 bg-[#2D8CE3] text-white rounded-lg text-[10px] font-black uppercase">
              ⚡ Add Entire Fit to Bag (₹999)
            </button>
          </div>
        `;
      } else if (q.includes("winter") || q.includes("hoodie") || q.includes("cold") || q.includes("jacket")) {
        replyText = "Lock in with 280 GSM heavyweight French Terry armor! High-altitude alpine peak graphics paired with celestial planetary prints:";
        outfitCard = `
          <div class="mt-3 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div class="text-[10px] font-black uppercase text-amber-500 font-mono-tech mb-1">CURATED FIT • HEAVYWEIGHT 280 GSM</div>
            <div class="flex items-center gap-2 mb-2">
              <img src="assets/products/same-sky-tee/seated.jpg" class="w-10 h-12 object-cover rounded-lg border">
              <div class="text-[11px] font-bold leading-tight">
                <div>Solar Eclipse + Alpine Summit Bundle</div>
                <div class="text-neutral-400 font-mono-tech text-[9px]">Bundle: ₹999 (Save ₹1,599)</div>
              </div>
            </div>
            <button type="button" onclick="window.addBotFitToCart('kd-same-sky', 'kd-altitude', 'Heavyweight Street Bundle', 999)" class="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-[10px] font-black uppercase">
              ⚡ Add Entire Fit to Bag (₹999)
            </button>
          </div>
        `;
      } else {
        replyText = `Big bet! For "${query}", the best streetwear proportion is an oversized boxy drop-shoulder cut in 280 GSM combed cotton. Check this combo out:`;
        outfitCard = `
          <div class="mt-3 p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <div class="text-[10px] font-black uppercase text-[#2D8CE3] font-mono-tech mb-1">KODO STYLIST SELECTION</div>
            <div class="flex items-center gap-2 mb-2">
              <img src="assets/products/crescent-moon-tee/front.jpg" class="w-10 h-12 object-cover rounded-lg border">
              <div class="text-[11px] font-bold leading-tight">
                <div>Solar Eclipse + Crescent Moon Duo</div>
                <div class="text-neutral-400 font-mono-tech text-[9px]">Buy 2 @ ₹999</div>
              </div>
            </div>
            <button type="button" onclick="window.addBotFitToCart('kd-same-sky', 'kd-moon', 'Stylist Essential Fit', 999)" class="w-full py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-[10px] font-black uppercase">
              ⚡ Add Entire Fit to Bag (₹999)
            </button>
          </div>
        `;
      }

      addMessage("bot", replyText, outfitCard);
      logChatMessage("bot", replyText);
    }

    // Handle Form Submit
    const form = chatWin.querySelector("#kodo-bot-form");
    const input = chatWin.querySelector("#kodo-bot-input");

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = (input.value || "").trim();
      if (!val) return;
      addMessage("user", val);
      logChatMessage("customer", val);
      input.value = "";

      // Bot thinking delay
      setTimeout(() => {
        handleStylistQuery(val);
      }, 500);
    });

    // Handle preset chips
    chatWin.querySelectorAll(".bot-preset-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.dataset.query;
        const chipText = chip.textContent.trim();
        addMessage("user", chipText);
        logChatMessage("customer", chipText);
        setTimeout(() => {
          handleStylistQuery(query);
        }, 400);
      });
    });

    // Helper for adding full fit to bag
    window.addBotFitToCart = function(id1, id2, fitName, comboPrice) {
      const p1 = window.KODO_DATA?.PRODUCTS?.find(p => p.id === id1) || { title: "Street Drop Piece 1", price: 699, image: "assets/products/same-sky-tee/front.jpg" };
      const p2 = window.KODO_DATA?.PRODUCTS?.find(p => p.id === id2) || { title: "Street Drop Piece 2", price: 699, image: "assets/products/crescent-moon-tee/front.jpg" };

      const comboItem = {
        id: `bot-fit-${Date.now()}`,
        title: `🔥 [AI DRIP] ${fitName}`,
        price: comboPrice,
        comparePrice: (p1.price + p2.price) + 800,
        size: "L",
        image: p1.images?.[0] || p1.image,
        quantity: 1
      };

      const cart = JSON.parse(localStorage.getItem("KODO_CART") || "[]");
      cart.push(comboItem);
      localStorage.setItem("KODO_CART", JSON.stringify(cart));

      if (typeof window.showToast === "function") {
        window.showToast(`Added full outfit '${fitName}' to bag! Combo saved ₹800!`);
      } else {
        alert(`Added '${fitName}' to bag!`);
      }

      toggleChat(false);
      document.getElementById("cart-drawer-toggle")?.click();
    };
  }

  /* -------------------------------------------------------------
     11. MOBILE BOTTOM QUICK NAVIGATION DOCK
     ------------------------------------------------------------- */
  function initMobileBottomDock() {
    if (window.location.pathname.includes("admin.html") || window.location.pathname.includes("invoice.html")) return;
    if (document.getElementById("kodo-mobile-dock")) return;

    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const currentSearch = window.location.search;
    const isWomen = currentSearch.includes("gender=women");
    const isMen = currentSearch.includes("gender=men");

    const dock = document.createElement("nav");
    dock.id = "kodo-mobile-dock";
    dock.className = "fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-around px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]";

    const links = [
      {
        href: "collection.html?gender=men",
        icon: "♂",
        label: "Men",
        active: isMen
      },
      {
        href: "collection.html?gender=women",
        icon: "♀",
        label: "Women",
        active: isWomen
      },
      {
        href: "index.html",
        icon: "⌂",
        label: "Home",
        active: (currentPath === "index.html" || currentPath === "") && !isWomen && !isMen
      },
      {
        href: "#cart",
        icon: "🛒",
        label: "Checkout",
        active: false,
        action: "checkout"
      },
      {
        href: "#chat",
        icon: "✦",
        label: "Chat",
        active: false,
        action: "chat"
      }
    ];

    dock.innerHTML = links.map(l => `
      <a href="${l.href}" data-action="${l.action || ""}" class="kodo-dock-link flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl transition-all text-[10px] uppercase ${
        l.active 
          ? 'text-[#2D8CE3] font-black scale-105' 
          : 'text-neutral-600 dark:text-neutral-400 font-medium hover:text-neutral-900 dark:hover:text-white'
      }">
        <span class="text-base leading-none">${l.icon}</span>
        <span class="mt-0.5">${l.label}</span>
      </a>
    `).join("");

    document.body.appendChild(dock);
    dock.querySelectorAll(".kodo-dock-link").forEach(link => {
      link.addEventListener("click", (event) => {
        const action = link.dataset.action;
        if (!action) return;
        event.preventDefault();
        if (action === "checkout") {
          document.querySelector(".cart-drawer-trigger")?.click();
        }
        if (action === "chat") {
          window.openKodoBot?.();
        }
      });
    });
    document.body.classList.add("pb-14", "md:pb-0");
  }

  /* -------------------------------------------------------------
     12. SITEWIDE PRODUCT PHOTO ROTATOR
     ------------------------------------------------------------- */
  function initProductPhotoRotator() {
    const productMap = () => new Map((window.KODO_DATA?.PRODUCTS || []).map(product => [product.id, product]));
    const findProductFromNode = (node, productsById) => {
      const explicitId = node.dataset?.id || node.dataset?.productId;
      if (explicitId && productsById.has(explicitId)) return productsById.get(explicitId);

      const link = node.matches?.("a[href*='product.html?id=']")
        ? node
        : node.querySelector?.("a[href*='product.html?id=']");
      if (!link) return null;

      try {
        const id = new URL(link.getAttribute("href"), window.location.href).searchParams.get("id");
        return id ? productsById.get(id) : null;
      } catch (_) {
        return null;
      }
    };

    const attachRotator = (img, product) => {
      const images = (product?.images || []).filter(Boolean);
      if (!img || img.dataset.kodoRotating === "1" || images.length < 2) return;

      img.dataset.kodoRotating = "1";
      img.dataset.kodoImageIndex = String(Math.max(0, images.indexOf(img.getAttribute("src"))));
      if (!img.style.transition) img.style.transition = "opacity 180ms ease, transform 500ms ease";

      const timer = setInterval(() => {
        if (!img.isConnected) {
          clearInterval(timer);
          return;
        }

        const current = Number.parseInt(img.dataset.kodoImageIndex || "0", 10) || 0;
        const next = (current + 1) % images.length;
        img.dataset.kodoImageIndex = String(next);
        img.style.opacity = "0.35";
        window.setTimeout(() => {
          if (!img.isConnected) return;
          img.src = images[next];
          img.alt = `${product.title || "KODO product"} view ${next + 1}`;
          img.style.opacity = "1";
        }, 120);
      }, 1000);
    };

    const wireCards = () => {
      const productsById = productMap();
      document.querySelectorAll(".product-card[data-id], .quick-view-trigger[data-id], a[href*='product.html?id=']").forEach(node => {
        const product = findProductFromNode(node, productsById);
        const img = node.matches?.("img") ? node : node.querySelector?.("img");
        attachRotator(img, product);
      });

      const pdpImg = document.getElementById("pdp-main-image");
      const pdpId = new URLSearchParams(window.location.search).get("id");
      if (pdpImg && pdpId) attachRotator(pdpImg, productsById.get(pdpId));
    };

    wireCards();
    let rewireTimer = null;
    new MutationObserver(() => {
      window.clearTimeout(rewireTimer);
      rewireTimer = window.setTimeout(wireCards, 200);
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* -------------------------------------------------------------
     13. VISITOR ANALYTICS TRACKER
     ------------------------------------------------------------- */
  function initKodoAnalytics() {
    if (window.location.pathname.includes("admin.html")) return;
    const apiBase = (window.KODO_API_BASE_URL || "").replace(/\/$/, "");
    const endpoint = `${apiBase}/api/analytics/track`;
    const sessionKey = "KODO_ANALYTICS_SESSION_ID";
    let sessionId = localStorage.getItem(sessionKey);
    if (!sessionId) {
      sessionId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(sessionKey, sessionId);
    }

    const page = () => window.location.pathname + window.location.search;
    const productId = () => new URLSearchParams(window.location.search).get("id") || "";
    const send = (payload, useBeacon = false) => {
      const body = JSON.stringify({
        sessionId,
        page: page(),
        productId: productId(),
        referrer: document.referrer || "",
        ...payload
      });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
        return;
      }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body }).catch(() => {});
    };

    window.KODO_ANALYTICS = { track: send, sessionId };
    send({ type: "pageview", label: document.title || page() });

    document.addEventListener("click", (event) => {
      const target = event.target.closest("a,button,[data-product-id],[data-action]");
      if (!target) return;
      const label = target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        target.dataset.action ||
        target.dataset.productId ||
        target.textContent?.trim()?.slice(0, 80) ||
        target.tagName;
      send({
        type: "click",
        label,
        productId: target.dataset.productId || productId()
      });
    }, true);

    window.addEventListener("pagehide", () => {
      send({ type: "exit", label: page() }, true);
    });
  }

  initKodoAnalytics();
})();
