// KODO.DIY Advanced Front & Back Customizer Engine with 3D Puff Print Simulation

(function () {
  const state = {
    selectedColor: window.KODO_DATA.DIY_PRESETS.colors[0],
    currentView: 'back', // 'front' or 'back'
    printStyle: 'puff', // 'puff' (3D Rubberized) or 'flat' (DTG)
    front: {
      graphic: window.KODO_DATA.DIY_PRESETS.graphics[0],
      customText: "KODO",
      userImage: null,
      scale: 1.0,
      font: "'Syne', sans-serif"
    },
    back: {
      graphic: window.KODO_DATA.DIY_PRESETS.graphics[0],
      customText: "EST. 2026 // STREET DIVISION",
      userImage: null,
      scale: 1.0,
      font: "'Syne', sans-serif"
    },
    selectedSize: "L",
    basePrice: 699,
    puffAddon: 100
  };

  function initDiyStudio() {
    if (!document.getElementById("diy-studio-section")) return;
    renderColorPickers();
    renderGraphicPills();
    setupEventListeners();
    updatePreview();
  }

  function renderColorPickers() {
    const container = document.getElementById("diy-color-options");
    if (!container) return;

    container.innerHTML = window.KODO_DATA.DIY_PRESETS.colors.map((c, i) => `
      <button 
        type="button" 
        data-color-idx="${i}"
        class="diy-color-btn relative w-8 h-8 md:w-9 md:h-9 rounded-full border-2 transition-all ${i === 0 ? 'border-blue-500 scale-110 ring-2 ring-blue-200' : 'border-neutral-200 hover:scale-105'}"
        style="background-color: ${c.hex};"
        title="${c.name}">
      </button>
    `).join("");

    container.querySelectorAll(".diy-color-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".diy-color-btn").forEach(b => {
          b.classList.remove("border-blue-500", "scale-110", "ring-2", "ring-blue-200");
          b.classList.add("border-neutral-200");
        });
        btn.classList.add("border-blue-500", "scale-110", "ring-2", "ring-blue-200");
        btn.classList.remove("border-neutral-200");

        const idx = parseInt(btn.dataset.colorIdx, 10);
        state.selectedColor = window.KODO_DATA.DIY_PRESETS.colors[idx];
        const label = document.getElementById("diy-selected-color-name");
        if (label) label.textContent = state.selectedColor.name;
        updatePreview();
      });
    });
  }

  function renderGraphicPills() {
    const container = document.getElementById("diy-graphic-options");
    if (!container) return;

    container.innerHTML = window.KODO_DATA.DIY_PRESETS.graphics.map((g, i) => `
      <button 
        type="button" 
        data-graphic-id="${g.id}"
        class="diy-graphic-btn flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs font-semibold transition-all ${i === 0 ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-800'}">
        ${g.imgSrc ? `<img src="${g.imgSrc}" alt="${g.name}" class="w-7 h-4 object-contain">` : `<span class="text-xl">${g.icon}</span>`}
        <div>
          <div class="font-bold uppercase leading-tight text-[11px]">${g.name}</div>
          <div class="text-[9px] text-neutral-500 font-normal">${g.subtitle}</div>
        </div>
      </button>
    `).join("");

    container.querySelectorAll(".diy-graphic-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        container.querySelectorAll(".diy-graphic-btn").forEach(b => {
          b.classList.remove("border-blue-600", "bg-blue-50", "text-blue-700", "shadow-sm");
          b.classList.add("border-neutral-200", "bg-white", "text-neutral-800");
        });
        btn.classList.add("border-blue-600", "bg-blue-50", "text-blue-700", "shadow-sm");
        btn.classList.remove("border-neutral-200", "bg-white", "text-neutral-800");

        const gId = btn.dataset.graphicId;
        const selected = window.KODO_DATA.DIY_PRESETS.graphics.find(x => x.id === gId);
        const currentViewData = state[state.currentView];
        currentViewData.graphic = selected;
        currentViewData.userImage = null;
        updatePreview();
      });
    });
  }

  function setupEventListeners() {
    // Front vs Back View Toggle
    const viewBtns = document.querySelectorAll(".diy-view-toggle-btn");
    viewBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        viewBtns.forEach(b => {
          b.classList.remove("bg-[#2D8CE3]", "text-white", "shadow-md");
          b.classList.add("bg-neutral-800", "text-neutral-400");
        });
        btn.classList.add("bg-[#2D8CE3]", "text-white", "shadow-md");
        btn.classList.remove("bg-neutral-800", "text-neutral-400");

        state.currentView = btn.dataset.view;
        syncInputsWithCurrentView();
        updatePreview();
      });
    });

    // 3D Puff vs Flat Print Toggle
    const printStyleBtns = document.querySelectorAll(".diy-print-style-btn");
    printStyleBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        printStyleBtns.forEach(b => {
          b.classList.remove("bg-pink-600", "text-white", "shadow-md");
          b.classList.add("bg-neutral-800", "text-neutral-400");
        });
        btn.classList.add("bg-pink-600", "text-white", "shadow-md");
        btn.classList.remove("bg-neutral-800", "text-neutral-400");

        state.printStyle = btn.dataset.style;
        updatePreview();
      });
    });

    // Custom text input
    const textInput = document.getElementById("diy-text-input");
    if (textInput) {
      textInput.addEventListener("input", (e) => {
        state[state.currentView].customText = e.target.value.trim().toUpperCase();
        updatePreview();
      });
    }

    // Font selector
    const fontSelect = document.getElementById("diy-font-select");
    if (fontSelect) {
      fontSelect.addEventListener("change", (e) => {
        state[state.currentView].font = e.target.value;
        updatePreview();
      });
    }

    // Scale slider
    const scaleSlider = document.getElementById("diy-scale-slider");
    if (scaleSlider) {
      scaleSlider.addEventListener("input", (e) => {
        state[state.currentView].scale = parseFloat(e.target.value);
        updatePreview();
      });
    }

    // Custom image upload
    const uploadInput = document.getElementById("diy-image-upload");
    if (uploadInput) {
      uploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            state[state.currentView].userImage = event.target.result;
            updatePreview();
            if (window.showToast) {
              window.showToast(`Custom image loaded on ${state.currentView.toUpperCase()} view!`);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // Size selector buttons
    const sizeBtns = document.querySelectorAll(".diy-size-btn");
    sizeBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sizeBtns.forEach(b => b.classList.remove("bg-neutral-900", "text-white", "border-neutral-900"));
        btn.classList.add("bg-neutral-900", "text-white", "border-neutral-900");
        state.selectedSize = btn.dataset.size;
      });
    });

    // Download Mockup Button
    const downloadBtn = document.getElementById("diy-download-mockup-btn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", downloadMockup);
    }

    // Add to Cart from DIY studio
    const addDiyBtn = document.getElementById("diy-add-to-cart-btn");
    if (addDiyBtn) {
      addDiyBtn.addEventListener("click", () => {
        const finalPrice = state.printStyle === 'puff' ? (state.basePrice + state.puffAddon) : state.basePrice;
        const item = {
          id: `diy-${Date.now()}`,
          productId: "kd-diy-custom",
          title: `Custom ${state.printStyle === 'puff' ? '3D Puff Print' : 'DTG'} Tee (${state.back.graphic ? state.back.graphic.name : 'Custom Artwork'})`,
          price: finalPrice,
          comparePrice: 1799,
          size: state.selectedSize,
          color: state.selectedColor.name,
          printStyle: state.printStyle.toUpperCase(),
          frontPrint: {
            graphic: state.front.graphic ? state.front.graphic.name : "None",
            text: state.front.customText || "None",
            hasCustomUpload: !!state.front.userImage
          },
          backPrint: {
            graphic: state.back.graphic ? state.back.graphic.name : "None",
            text: state.back.customText || "None",
            hasCustomUpload: !!state.back.userImage
          },
          image: "assets/kodo-logo.png",
          quantity: 1,
          isDiy: true
        };

        if (window.CartManager) {
          window.CartManager.addItem(item);
          window.CartManager.openDrawer();
          if (window.showToast) {
            window.showToast(`Custom 3D ${state.selectedColor.name} Tee added to bag!`);
          }
        }
      });
    }
  }

  function syncInputsWithCurrentView() {
    const cur = state[state.currentView];
    const textInput = document.getElementById("diy-text-input");
    const scaleSlider = document.getElementById("diy-scale-slider");
    const fontSelect = document.getElementById("diy-font-select");
    const viewLabel = document.getElementById("diy-active-view-label");

    if (textInput) textInput.value = cur.customText || "";
    if (scaleSlider) scaleSlider.value = cur.scale || 1.0;
    if (fontSelect) fontSelect.value = cur.font || "'Syne', sans-serif";
    if (viewLabel) viewLabel.textContent = state.currentView.toUpperCase();
  }

  function updatePreview() {
    const mockTee = document.getElementById("diy-tee-mockup");
    const graphicIcon = document.getElementById("diy-preview-icon");
    const graphicName = document.getElementById("diy-preview-name");
    const graphicText = document.getElementById("diy-preview-text");
    const graphicBox = document.getElementById("diy-preview-graphic-box");
    const customImgPreview = document.getElementById("diy-preview-custom-img");
    const presetImgPreview = document.getElementById("diy-preview-preset-img");
    const necklineDetail = document.getElementById("diy-neckline-detail");
    const viewBadge = document.getElementById("diy-mock-view-badge");
    const priceDisplay = document.getElementById("diy-final-price-display");

    const cur = state[state.currentView];
    const isPuff = state.printStyle === 'puff';

    if (mockTee) {
      mockTee.style.backgroundColor = state.selectedColor.hex;
      const isLight = state.selectedColor.hex === '#f8fafc';
      if (graphicBox) {
        graphicBox.style.color = isLight ? '#18181b' : '#ffffff';
      }
    }

    if (necklineDetail) {
      if (state.currentView === 'front') {
        necklineDetail.style.height = "26px";
        necklineDetail.style.borderRadius = "0 0 50% 50%";
      } else {
        necklineDetail.style.height = "12px";
        necklineDetail.style.borderRadius = "0 0 30% 30%";
      }
    }

    if (viewBadge) {
      viewBadge.textContent = `${state.currentView.toUpperCase()} VIEW • ${isPuff ? '3D PUFF INK' : 'FLAT DTG'}`;
    }

    // 3D Puff embossed drop shadow effect
    if (graphicBox) {
      const baseScale = state.currentView === 'front' ? 0.75 : 1.0;
      graphicBox.style.transform = `scale(${cur.scale * baseScale})`;
      if (isPuff) {
        graphicBox.style.filter = "drop-shadow(2px 3px 1px rgba(0, 0, 0, 0.85)) drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.4))";
      } else {
        graphicBox.style.filter = "none";
      }
    }

    // Images vs presets
    if (cur.userImage) {
      if (customImgPreview) {
        customImgPreview.src = cur.userImage;
        customImgPreview.classList.remove("hidden");
      }
      if (presetImgPreview) presetImgPreview.classList.add("hidden");
      if (graphicIcon) graphicIcon.classList.add("hidden");
      if (graphicName) graphicName.classList.add("hidden");
    } else if (cur.graphic && cur.graphic.imgSrc) {
      if (customImgPreview) customImgPreview.classList.add("hidden");
      if (presetImgPreview) {
        presetImgPreview.src = cur.graphic.imgSrc;
        presetImgPreview.classList.remove("hidden");
      }
      if (graphicIcon) graphicIcon.classList.add("hidden");
      if (graphicName) {
        graphicName.classList.remove("hidden");
        graphicName.textContent = cur.graphic.name;
      }
    } else {
      if (customImgPreview) customImgPreview.classList.add("hidden");
      if (presetImgPreview) presetImgPreview.classList.add("hidden");
      if (graphicIcon) {
        graphicIcon.classList.remove("hidden");
        graphicIcon.textContent = cur.graphic ? cur.graphic.icon : "⚡";
      }
      if (graphicName) {
        graphicName.classList.remove("hidden");
        graphicName.textContent = cur.graphic ? cur.graphic.name : "";
      }
    }

    if (graphicText) {
      graphicText.textContent = cur.customText;
      graphicText.style.display = cur.customText ? 'block' : 'none';
      graphicText.style.fontFamily = cur.font || "'Syne', sans-serif";
    }

    if (priceDisplay) {
      const finalPrice = isPuff ? (state.basePrice + state.puffAddon) : state.basePrice;
      priceDisplay.textContent = `₹${finalPrice}`;
    }
  }

  // Generate and download full PNG mockup
  function downloadMockup() {
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");

    const bgGrad = ctx.createLinearGradient(0, 0, 800, 1000);
    bgGrad.addColorStop(0, "#09090b");
    bgGrad.addColorStop(1, "#18181b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = "#2D8CE3";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("KODO.DIY", 40, 60);
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px monospace";
    ctx.fillText(`CUSTOM MOCKUP // ${state.currentView.toUpperCase()} VIEW (${state.printStyle.toUpperCase()})`, 40, 88);

    ctx.save();
    ctx.translate(400, 520);

    ctx.fillStyle = state.selectedColor.hex;
    ctx.beginPath();
    ctx.roundRect(-220, -320, 440, 640, 40);
    ctx.fill();

    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    if (state.currentView === 'front') {
      ctx.arc(0, -320, 70, 0, Math.PI);
    } else {
      ctx.ellipse(0, -320, 70, 25, 0, 0, Math.PI);
    }
    ctx.fill();

    const cur = state[state.currentView];
    const isLight = state.selectedColor.hex === '#f8fafc';
    ctx.fillStyle = isLight ? "#18181b" : "#ffffff";
    ctx.textAlign = "center";

    const yOffset = state.currentView === 'front' ? -120 : -40;

    const logoImg = new Image();
    logoImg.src = cur.graphic && cur.graphic.imgSrc ? cur.graphic.imgSrc : "assets/kodo-logo.png";
    logoImg.onload = () => {
      const w = 240 * cur.scale;
      const h = 80 * cur.scale;
      if (state.printStyle === 'puff') {
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
      }
      ctx.drawImage(logoImg, -w / 2, yOffset, w, h);

      if (cur.customText) {
        ctx.font = `bold ${Math.round(24 * cur.scale)}px sans-serif`;
        ctx.fillText(cur.customText, 0, yOffset + h + 30);
      }

      ctx.restore();

      ctx.fillStyle = "#71717a";
      ctx.font = "13px sans-serif";
      ctx.fillText(`Color: ${state.selectedColor.name} | Style: ${state.printStyle.toUpperCase()} | 260 GSM French Terry`, 40, 950);

      const link = document.createElement("a");
      link.download = `kodo-diy-mockup-${state.currentView}-${state.printStyle}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      if (window.showToast) {
        window.showToast("Mockup PNG downloaded successfully!");
      }
    };
    logoImg.onerror = () => {
      ctx.font = `${Math.round(70 * cur.scale)}px sans-serif`;
      ctx.fillText(cur.graphic ? cur.graphic.icon : "⚡", 0, yOffset);
      if (cur.customText) {
        ctx.font = `bold ${Math.round(24 * cur.scale)}px sans-serif`;
        ctx.fillText(cur.customText, 0, yOffset + 70);
      }
      ctx.restore();
      const link = document.createElement("a");
      link.download = `kodo-diy-mockup-${state.currentView}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  }

  window.initDiyStudio = initDiyStudio;
})();
