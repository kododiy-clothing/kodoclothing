#!/usr/bin/env python3
"""
Production-Grade REST API Server for KODO.DIY Real-World E-Commerce & Merchant Central
Zero fake demo data. Real order persistence, real stock tracking, real analytics.
"""
import http.server
import socketserver
import os
import sys
import json
import urllib.parse
import urllib.request
import urllib.error
import time
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ORDERS_FILE = DATA_DIR / "orders.json"
PRODUCTS_FILE = DATA_DIR / "auto_products.json"
JS_DATA_FILE = BASE_DIR / "js" / "data.js"

DATA_DIR.mkdir(exist_ok=True)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8085))
DODO_API_BASE = os.environ.get("DODO_API_BASE", "https://live.dodopayments.com")
DODO_API_KEY = os.environ.get("DODO_PAYMENTS_API_KEY", "")
DODO_DEFAULT_PRODUCT_ID = os.environ.get("DODO_PRODUCT_ID_DEFAULT", "")
DODO_PRODUCT_MAP = os.environ.get("DODO_PRODUCT_MAP_JSON", "{}")
DODO_SEND_DYNAMIC_AMOUNTS = os.environ.get("DODO_SEND_DYNAMIC_AMOUNTS", "true").lower() != "false"
PUBLIC_SITE_URL = os.environ.get("PUBLIC_SITE_URL", "https://www.kodo.diy")
ADMIN_EMAIL = os.environ.get("KODO_ADMIN_EMAIL", "kododiy@gmail.com").strip().lower()
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        "ALLOWED_ORIGINS",
        "https://www.kodo.diy,https://kodo.diy,http://localhost:8085,http://127.0.0.1:8085"
    ).split(",")
    if origin.strip()
}

def normalize_phone(value):
    return "".join(ch for ch in str(value or "") if ch.isdigit())


def verify_google_admin_token(auth_header):
    if not auth_header or not auth_header.startswith("Bearer "):
        return False

    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        return False

    try:
        url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + urllib.parse.quote(token)
        with urllib.request.urlopen(url, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))

        email = str(payload.get("email") or "").strip().lower()
        email_verified = str(payload.get("email_verified") or "").lower() == "true"
        audience_ok = not GOOGLE_CLIENT_ID or payload.get("aud") == GOOGLE_CLIENT_ID
        exp = int(payload.get("exp") or 0)
        not_expired = exp > int(time.time())

        return email_verified and audience_ok and not_expired and email == ADMIN_EMAIL
    except Exception as exc:
        print(f"Admin token verification failed: {exc}")
        return False


def trusted_catalog_price(item, products):
    item_id = str(item.get("id") or "")
    product_id = str(item.get("productId") or "")

    if product_id == "kd-street-combo-999" or item_id.startswith("combo-"):
        return 999
    if product_id == "kd-diy-custom" or item_id.startswith("diy-"):
        return 799 if "PUFF" in str(item.get("printStyle") or "").upper() else 699
    if item_id.startswith("mystery-rookie-"):
        return 999
    if item_id.startswith("mystery-rebel-"):
        return 1799
    if item_id.startswith("mystery-kingpin-"):
        return 2999

    for product in products:
        catalog_id = str(product.get("id") or "")
        if product_id == catalog_id or item_id == catalog_id or item_id.startswith(catalog_id + "-"):
            price = int(product.get("price") or 0)
            if price <= 0:
                raise ValueError(f"Invalid catalog price for {catalog_id}")
            return price

    raise ValueError("One or more cart items are not available in the live catalog")


def compute_trusted_pricing(order):
    products = load_products()
    items = order.get("items") if isinstance(order.get("items"), list) else []
    if not items:
        raise ValueError("Cart is empty")

    trusted_items = []
    subtotal = 0

    for raw_item in items[:100]:
        item = dict(raw_item or {})
        quantity = int(item.get("quantity") or 1)
        if quantity < 1 or quantity > 10:
            raise ValueError("Invalid item quantity")

        unit_price = trusted_catalog_price(item, products)
        item["quantity"] = quantity
        item["price"] = unit_price
        trusted_items.append(item)
        subtotal += unit_price * quantity

    coupon_code = str(order.get("couponCode") or "").strip().upper()
    discount = round(subtotal * 0.15) if coupon_code == "KODO15" else 0
    shipping = 0 if subtotal >= 799 or coupon_code == "FREESHIP" else 99
    total = max(0, subtotal - discount + shipping)

    payment_mode = str(order.get("paymentMode") or "prepaid")
    if payment_mode == "cod_advance":
        gateway_amount = min(total, max(50, round(total * 0.25)))
    else:
        gateway_amount = total

    return {
        "items": trusted_items,
        "subtotal": subtotal,
        "discount": discount,
        "shipping": shipping,
        "total": total,
        "gatewayAmount": gateway_amount,
        "couponCode": coupon_code
    }


def load_orders():
    if not ORDERS_FILE.exists():
        return []
    try:
        with open(ORDERS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading orders: {e}")
        return []

def save_orders(orders):
    with open(ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2, ensure_ascii=False)

def load_products():
    if not PRODUCTS_FILE.exists():
        return []
    try:
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading products: {e}")
        return []

def save_products(products):
    with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    # Sync with js/data.js
    try:
        with open(JS_DATA_FILE, "w", encoding="utf-8") as f:
            f.write("// Live Real-World Products Catalog\n")
            f.write("window.KODO_DATA = window.KODO_DATA || {};\n")
            f.write("window.KODO_DATA.PRODUCTS = " + json.dumps(products, indent=2, ensure_ascii=False) + ";\n")
            f.write("const PRODUCTS = window.KODO_DATA.PRODUCTS;\n")
    except Exception as e:
        print(f"Error syncing js/data.js: {e}")

def get_dodo_product_id(item):
    try:
        product_map = json.loads(DODO_PRODUCT_MAP) if DODO_PRODUCT_MAP else {}
    except Exception:
        product_map = {}
    local_id = item.get("productId") or item.get("id", "").split("-")[0]
    return item.get("dodoProductId") or product_map.get(local_id) or DODO_DEFAULT_PRODUCT_ID

def create_dodo_payment_link(order):
    if not DODO_API_KEY:
        raise ValueError("DODO_PAYMENTS_API_KEY is not configured on the backend")

    pricing = compute_trusted_pricing(order)
    items = pricing["items"]

    product_id = DODO_DEFAULT_PRODUCT_ID or get_dodo_product_id(items[0])
    if not product_id:
        raise ValueError("DODO_PRODUCT_ID_DEFAULT is required for checkout")

    gateway_amount = pricing["gatewayAmount"]
    if gateway_amount < 50:
        raise ValueError("Minimum online payment amount is ₹50")

    customer = order.get("customer", {})
    payload = {
        "billing": {
            "country": "IN",
            "city": customer.get("city") or "",
            "street": customer.get("address") or "",
            "zipcode": customer.get("pincode") or ""
        },
        "customer": {
            "email": customer.get("email") or f"{order.get('orderId', 'order').lower()}@kododiy.local",
            "name": customer.get("name") or "KODO Customer",
            "phone_number": customer.get("phone") or None
        },
        "product_cart": [{
            "product_id": product_id,
            "quantity": 1,
            "amount": max(1, int(round(gateway_amount * 100)))
        }],
        "payment_link": True,
        "require_phone_number": True,
        "billing_currency": "INR",
        "allowed_payment_method_types": ["upi_collect", "upi_intent", "credit", "debit"],
        "return_url": f"{PUBLIC_SITE_URL.rstrip('/')}/track.html?id={urllib.parse.quote(order.get('orderId', ''))}",
        "metadata": {
            "order_id": order.get("orderId", ""),
            "source": "kodo-web-checkout",
            "subtotal": str(pricing["subtotal"]),
            "discount": str(pricing["discount"]),
            "shipping": str(pricing["shipping"]),
            "total": str(pricing["total"]),
            "gateway_amount": str(pricing["gatewayAmount"]),
            "payment_mode": order.get("paymentMode", "prepaid"),
            "coupon_code": pricing["couponCode"]
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{DODO_API_BASE.rstrip('/')}/payments",
        data=data,
        headers={
            "Authorization": f"Bearer {DODO_API_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            result = json.loads(res.read().decode("utf-8"))
            result["_trusted_pricing"] = pricing
            return result
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Dodo Payments error {e.code}: {detail}") from e


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def require_admin(self):
        if verify_google_admin_token(self.headers.get("Authorization", "")):
            return True
        self.send_json({"error": "Admin authentication required"}, status_code=401)
        return False

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Never expose persisted customer data or server files as static assets.
        if path.startswith("/data/") or path.startswith("/.git") or path in {
            "/server.py", "/.env", "/.env.example", "/render.yaml", "/Procfile"
        }:
            self.send_json({"error": "Not found"}, status_code=404)
            return

        # 1. Public health check
        if path == "/api/health":
            self.send_json({
                "ok": True,
                "service": "kodo-backend",
                "time": datetime.now(timezone.utc).isoformat(),
                "orders": len(load_orders()),
                "products": len(load_products()),
                "dodoConfigured": bool(DODO_API_KEY)
            })
            return

        # Merchant-only order directory
        if path == "/api/orders":
            if not self.require_admin():
                return
            orders = load_orders()
            self.send_json(orders)
            return

        # 2. Real Products List
        elif path == "/api/products":
            prods = load_products()
            self.send_json(prods)
            return

        # 3. Real Store Analytics Computed From Actual Orders
        elif path == "/api/analytics":
            if not self.require_admin():
                return
            orders = load_orders()
            prods = load_products()
            
            total_revenue = sum(o.get("total", 0) for o in orders)
            total_orders = len(orders)
            aov = round(total_revenue / total_orders) if total_orders > 0 else 0

            status_counts = {}
            for o in orders:
                st = o.get("status", "Confirmed")
                status_counts[st] = status_counts.get(st, 0) + 1

            # Top selling products calculated from real order items
            item_sales = {}
            for o in orders:
                for it in o.get("items", []):
                    title = it.get("title", "Product")
                    item_sales[title] = item_sales.get(title, 0) + (it.get("quantity", 1))

            top_products = sorted(item_sales.items(), key=lambda x: x[1], reverse=True)[:5]

            self.send_json({
                "totalRevenue": total_revenue,
                "totalOrders": total_orders,
                "averageOrderValue": aov,
                "statusBreakdown": status_counts,
                "totalActiveProducts": len(prods),
                "topProducts": top_products
            })
            return

        # 4. Real Customers Directory Compiled From Orders
        elif path == "/api/customers":
            if not self.require_admin():
                return
            orders = load_orders()
            cust_map = {}
            for o in orders:
                c = o.get("customer", {})
                phone = c.get("phone") or c.get("email") or "Unknown"
                if phone not in cust_map:
                    cust_map[phone] = {
                        "name": c.get("name", "Guest"),
                        "phone": c.get("phone", ""),
                        "email": c.get("email", ""),
                        "city": c.get("city", ""),
                        "address": c.get("address", ""),
                        "ordersCount": 0,
                        "totalSpend": 0,
                        "lastOrderDate": o.get("date")
                    }
                cust_map[phone]["ordersCount"] += 1
                cust_map[phone]["totalSpend"] += o.get("total", 0)
                if o.get("date", "") > cust_map[phone]["lastOrderDate"]:
                    cust_map[phone]["lastOrderDate"] = o.get("date")

            self.send_json(list(cust_map.values()))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(length) if length > 0 else b'{}'
        try:
            body = json.loads(body_bytes.decode('utf-8'))
        except Exception:
            body = {}

        # Privacy-safe customer lookup: requires both order ID and checkout phone.
        if path == "/api/orders/lookup":
            order_id = str(body.get("orderId") or "").strip().lower()
            phone = normalize_phone(body.get("phone"))
            if not order_id or len(phone) < 8:
                self.send_json({"error": "Order ID and phone are required"}, status_code=400)
                return

            found = None
            for order in load_orders():
                if (
                    str(order.get("orderId") or "").strip().lower() == order_id
                    and normalize_phone(order.get("customer", {}).get("phone")) == phone
                ):
                    found = order
                    break

            if not found:
                self.send_json({"error": "Order not found"}, status_code=404)
                return

            self.send_json({"order": found})
            return

        # Create a payment link using server-calculated totals only.
        if path == "/api/dodo/checkout":
            order_id = body.get("orderId") or f"KD-{int(datetime.now().timestamp()) % 1000000:06d}"
            checkout_order = {
                "orderId": order_id,
                "date": body.get("date") or datetime.now(timezone.utc).isoformat(),
                "customer": body.get("customer", {}),
                "items": body.get("items", []),
                "subtotal": body.get("subtotal", 0),
                "discount": body.get("discount", 0),
                "shipping": body.get("shipping", 0),
                "total": body.get("total", 0)
            }
            try:
                payment = create_dodo_payment_link(checkout_order)
                pricing = payment.get("_trusted_pricing", {})
                self.send_json({
                    "success": True,
                    "orderId": order_id,
                    "paymentId": payment.get("payment_id"),
                    "paymentLink": payment.get("payment_link"),
                    "checkoutUrl": payment.get("payment_link"),
                    "pricing": {
                        "subtotal": pricing.get("subtotal"),
                        "discount": pricing.get("discount"),
                        "shipping": pricing.get("shipping"),
                        "total": pricing.get("total"),
                        "gatewayAmount": pricing.get("gatewayAmount")
                    }
                })
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, status_code=502)
            return

        # Store a newly-created checkout request with server-calculated pricing.
        if path == "/api/orders":
            orders = load_orders()
            order_id = str(body.get("orderId") or f"KD-{int(datetime.now().timestamp()) % 1000000:06d}").strip()

            if any(str(o.get("orderId") or "") == order_id for o in orders):
                self.send_json({"success": True, "order": next(o for o in orders if str(o.get("orderId") or "") == order_id)})
                return

            try:
                pricing = compute_trusted_pricing(body)
            except Exception as exc:
                self.send_json({"success": False, "error": str(exc)}, status_code=400)
                return

            new_order = {
                "orderId": order_id,
                "date": body.get("date") or datetime.now(timezone.utc).isoformat(),
                "customer": body.get("customer", {}),
                "items": pricing["items"],
                "subtotal": pricing["subtotal"],
                "discount": pricing["discount"],
                "shipping": pricing["shipping"],
                "total": pricing["total"],
                "couponCode": pricing["couponCode"],
                "paymentMethod": body.get("paymentMethod", "Secure Checkout"),
                "paymentStatus": "Awaiting payment confirmation",
                "status": "Awaiting Payment",
                "courier": "",
                "awb": "",
                "dodoPaymentId": body.get("dodoPaymentId", ""),
                "paymentLink": body.get("paymentLink", ""),
                "stockDeducted": False
            }

            orders.insert(0, new_order)
            save_orders(orders)
            self.send_json({"success": True, "order": new_order})
            return

        # Merchant-only order status updates.
        if path == "/api/orders/update":
            if not self.require_admin():
                return

            order_id = body.get("orderId")
            new_status = body.get("status")
            courier = body.get("courier")
            awb = body.get("awb")
            payment_status = body.get("paymentStatus")

            orders = load_orders()
            prods = load_products()
            updated_order = None

            for order in orders:
                if order.get("orderId") != order_id:
                    continue

                old_status = str(order.get("status") or "").lower()
                if new_status:
                    order["status"] = new_status
                if courier is not None:
                    order["courier"] = courier
                if awb is not None:
                    order["awb"] = awb
                if payment_status:
                    order["paymentStatus"] = payment_status

                status_text = str(order.get("status") or "").lower()
                should_deduct = any(word in status_text for word in ["confirm", "production", "pack", "dispatch", "transit", "deliver"])
                is_cancelled = "cancel" in status_text

                if should_deduct and not order.get("stockDeducted"):
                    for item in order.get("items", []):
                        item_id = str(item.get("productId") or item.get("id") or "")
                        qty = max(1, int(item.get("quantity") or 1))
                        for product in prods:
                            catalog_id = str(product.get("id") or "")
                            if item_id == catalog_id or item_id.startswith(catalog_id + "-"):
                                product["stock"] = max(0, int(product.get("stock", 0)) - qty)
                                product["salesCount"] = int(product.get("salesCount", 0)) + qty
                                break
                    order["stockDeducted"] = True

                if is_cancelled and order.get("stockDeducted") and "cancel" not in old_status:
                    for item in order.get("items", []):
                        item_id = str(item.get("productId") or item.get("id") or "")
                        qty = max(1, int(item.get("quantity") or 1))
                        for product in prods:
                            catalog_id = str(product.get("id") or "")
                            if item_id == catalog_id or item_id.startswith(catalog_id + "-"):
                                product["stock"] = int(product.get("stock", 0)) + qty
                                product["salesCount"] = max(0, int(product.get("salesCount", 0)) - qty)
                                break
                    order["stockDeducted"] = False

                updated_order = order
                break

            if updated_order:
                save_orders(orders)
                save_products(prods)
                self.send_json({"success": True, "order": updated_order})
            else:
                self.send_json({"error": "Order not found"}, status_code=404)
            return

        # 4. Delete Order
        elif path == "/api/orders/delete":
            if not self.require_admin():
                return
            order_id = body.get("orderId")
            orders = load_orders()
            next_orders = [o for o in orders if o.get("orderId") != order_id]

            if len(next_orders) != len(orders):
                save_orders(next_orders)
                self.send_json({"success": True, "orderId": order_id})
            else:
                self.send_json({"error": "Order not found"}, status_code=404)
            return

        # 5. Update Product (Price, Stock, Title, Category)
        elif path == "/api/products/update":
            if not self.require_admin():
                return
            prod_id = body.get("id")
            prods = load_products()
            updated_prod = None

            for p in prods:
                if p.get("id") == prod_id:
                    if "price" in body: p["price"] = int(body["price"])
                    if "comparePrice" in body: p["comparePrice"] = int(body["comparePrice"])
                    if "stock" in body: p["stock"] = int(body["stock"])
                    if "title" in body: p["title"] = body["title"]
                    if "category" in body: p["category"] = body["category"]
                    updated_prod = p
                    break

            if updated_prod:
                save_products(prods)
                self.send_json({"success": True, "product": updated_prod})
            else:
                self.send_json({"error": "Product not found"}, status_code=404)
            return

        self.send_json({"error": "Endpoint not found"}, status_code=404)

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = PORT
    for attempt in range(5):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", port), Handler) as httpd:
                print(f"==================================================")
                print(f"🚀 KODO.DIY Production Store & Merchant Server:")
                print(f"   http://localhost:{port}/")
                print(f"   http://127.0.0.1:{port}/")
                print(f"   Live Endpoints: /api/orders, /api/products, /api/analytics")
                print(f"==================================================")
                httpd.serve_forever()
        except OSError as e:
            if "Address already in use" in str(e):
                port += 1
            else:
                raise e

if __name__ == "__main__":
    run_server()
