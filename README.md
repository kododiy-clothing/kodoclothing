# KODO STREETWEAR (KODO.DIY) ⚡

> **High-Performance Direct-to-Consumer (DTC) Urban Streetwear eCommerce Platform**  
> Inspired by contemporary Japanese street culture, Tokyo drift aesthetics, celestial lunar motifs, and heavyweight 280 GSM French Terry craftsmanship.

---

## 🌟 Overview & Key Features

- **🛍️ Complete Streetwear Catalog**: 42 curated oversized boxy graphic drops categorized into Men's, Women's, Unisex, Tokyo Drift, Celestial & Alpine series.
- **🎨 Interactive 4-Banner Hero Carousel**: Dynamic 16:9 responsive slider with autoplay, hover pause, and touch swipe gestures.
- **👕 "Pick Any 2 @ ₹999" Combo Builder**: Interactive bundle builder allowing customers to pair any two 280 GSM graphic tees at an exclusive discounted rate.
- **🪞 Virtual Drip Mirror (`tryon.html`)**: Multi-angle 4K Lookbook model viewport (Front, Back, Lifestyle, Fit) across all 42 drops, with live Webcam AR & photo upload Picture-in-Picture guides.
- **📦 Real-World Merchant Central (`admin.html`)**:
  - Live order tracking and dispatch status updates (`Confirmed` → `In Production` → `Dispatched` → `Delivered`).
  - Real-time stock unit editor and price manager with instant backend sync.
  - Automated Delhivery & BlueDart AWB generation, GST tax invoices, and courier packing slips.
  - Live customer CRM directory with VIP loyalty tiers and WhatsApp support integration.
- **⚡ Persistent REST Backend (`server.py`)**: Lightweight Python backend managing live orders, inventory deductions, SKU tracking, and sales analytics.

---

## 📂 Project Structure

```text
kodoclothing/
├── index.html                 # Main storefront with hero slider & catalog
├── admin.html                 # Merchant Admin Central & inventory controller
├── collection.html            # Dedicated multi-facet filter catalog
├── product.html               # High-res Product Detail Page (PDP)
├── tryon.html                 # Virtual Drip Mirror & AR studio
├── lookbook.html              # Street style visual lookbook
├── drops.html                 # Active capsule release countdowns
├── mystery-box.html           # Streetwear Mystery Box gamified unboxing
├── invoice.html               # Dynamic printable GST Tax Invoice
├── server.py                  # Real backend REST API server
├── api/dodo/checkout.js       # Vercel serverless Dodo checkout endpoint
├── data/
│   ├── orders.json            # Real-world customer orders database
│   └── auto_products.json     # 42 active streetwear drops with stock & SKUs
├── js/
│   ├── app.js                 # Storefront controller & checkout logic
│   ├── admin.js               # Admin panel & real inventory manager
│   ├── data.js                # Catalog data & categories definition
│   └── extras.js              # Header, navigation, and drawer utilities
└── assets/
    ├── banners/               # Custom high-res hero banners
    └── products/              # 4K multi-angle garment & model photography
```

---

## 🚀 Quickstart Guide

### 1. Clone the Repository
```bash
git clone https://github.com/kododiy-clothing/kodoclothing.git
cd kodoclothing
```

### 2. Launch Local Server
Run the built-in REST API server:
```bash
python3 server.py 8085
```

### 3. Configure Real Backend + Dodo Payments
Keep the API key in environment variables only. Do not paste it into frontend files.

```bash
export DODO_PAYMENTS_API_KEY="your_live_dodo_api_key"
export DODO_PRODUCT_ID_DEFAULT="pdt_your_dodo_product_id"
export PUBLIC_SITE_URL="https://your-live-store-url"
python3 server.py 8085
```

For exact product mapping, set `DODO_PRODUCT_MAP_JSON`:

```bash
export DODO_PRODUCT_MAP_JSON='{"kd-man-drop-01":"pdt_xxx","kd-woman-together-01":"pdt_yyy"}'
```

The backend provides:

- `GET /api/health`
- `GET /api/products`
- `POST /api/products/update`
- `GET /api/orders`
- `POST /api/orders`
- `POST /api/orders/update`
- `GET /api/analytics`
- `GET /api/customers`
- `POST /api/dodo/checkout`

The storefront posts to `/api/dodo/checkout`, the backend creates a Dodo payment link, and the customer is redirected to Dodo Checkout.

GitHub Pages cannot run this secret backend. Deploy `server.py` to Render, Railway, a VPS, or any Python web host using the included `Procfile` / `render.yaml`. After deployment, set `window.KODO_API_BASE_URL` in `js/backend-config.js`:

```js
window.KODO_API_BASE_URL = "https://your-kodo-backend.onrender.com";
```

Keep this value public-safe. Secret keys stay in backend environment variables only.

### 4. Open in Browser
- **Storefront**: [http://127.0.0.1:8085/](http://127.0.0.1:8085/)
- **Admin Panel**: [http://127.0.0.1:8085/admin.html](http://127.0.0.1:8085/admin.html)
- **Virtual Drip Mirror**: [http://127.0.0.1:8085/tryon.html](http://127.0.0.1:8085/tryon.html)

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Modern Vanilla JavaScript (ES6+), Tailwind CSS
- **Backend**: Python 3 REST Server (`SimpleHTTPRequestHandler` with custom routing)
- **Database**: Persistent JSON Storage (`data/orders.json`, `data/auto_products.json`)
- **Assets**: 4K UHD Multi-Angle Photography, WebP/JPG Optimized Textures

---

## 📄 License
All rights reserved © 2026 KODO Streetwear Atelier.
