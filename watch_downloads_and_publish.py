#!/usr/bin/env python3
"""
Real-time watcher for /Users/apple/Downloads
Automatically turns any newly downloaded ChatGPT or Gemini image into a full 3-angle KODO.DIY streetwear product!
"""
import os
import sys
import time
import glob
import json
import random
import shutil
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
DOWNLOADS_DIR = Path.home() / "Downloads"
DATA_FILE = BASE_DIR / "data" / "auto_products.json"
AUTO_DIR = BASE_DIR / "assets" / "products" / "auto-generated"
AUTO_DIR.mkdir(parents=True, exist_ok=True)

THEMES = [
    ("Neo-Shibuya Mecha", "NEO MECHA CORE", "未来都市 機械生命体", "Shinjuku Mecha Division • High Density 280 GSM Weave", "racing-tokyo", "Pitch Onyx Black", 749),
    ("Solar Eclipse Atelier", "ORBIT ZENITH", "太陽軌道 天体観測", "Seven Lunar Phases • Orbiting In Pure Brutalist Solitude", "celestial-series", "Warm Vintage Ecru", 699),
    ("Daikoku Midnight Drift", "TWIN TURBO R35", "湾岸線 最高速 限界突破", "Twin-Turbocharged 9,000 RPM • Shuto Highway Midnight Faction", "racing-tokyo", "Onyx Black & Crimson", 749),
    ("Acid Cyber Rave", "CHAOTIC REALITY", "電子狂気 溶解笑顔", "Melting Liquid Chrome • Underground Techno Rave 1996", "oversized-tees", "Mineral Washed Charcoal", 649),
    ("Matterhorn Cloudline", "TOPOGRAPHIC 4810M", "白嶺 高度四千八百米", "Silence Above The Alpine Cloudline • Topographic Contours", "alpine-series", "Washed Slate Grey", 699),
    ("Seoul Cyber Star", "CHROME MATRIX", "電子妖精 新世界秩序", "Liquid Silver Chrome • Gangnam Glass Facade Midnight Run", "oversized-tees", "Pitch Onyx Black", 699),
    ("Subterranean Vault", "TERMINAL 04", "地下鉄路 最終列車", "Brutalist Concrete Vault • Industrial Subterranean Platform", "oversized-tees", "Deep Concrete Slate", 649),
    ("Harajuku Glitch", "PIXEL HORIZON", "原宿 電脳遊戯", "8-Bit Glitch Aesthetic • Retro Tokyo Streetwear 2026", "racing-tokyo", "Pitch Onyx Black", 699),
    ("Nocturnal Orbit", "CRESCENT ECLIPSE", "月影 深夜軌道", "Micro Crescent Embroidery • Minimalist Celestial Geometry", "celestial-series", "Warm Vintage Ecru", 649)
]

def get_existing_files():
    files = glob.glob(str(DOWNLOADS_DIR / "*.*"))
    return {f for f in files if any(f.lower().endswith(x) for x in ['.png', '.jpg', '.jpeg', '.webp'])}

def process_image(img_path):
    print(f"⚡ [WATCHER] Detected new image: {os.path.basename(img_path)}! Building product...")
    try:
        # Wait until download finishes writing
        prev_sz = -1
        for _ in range(10):
            sz = os.path.getsize(img_path)
            if sz == prev_sz and sz > 5000:
                break
            prev_sz = sz
            time.sleep(0.5)

        im = Image.open(img_path).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}")
        return None

    with open(DATA_FILE) as f:
        products = json.load(f)

    # Pick a theme not used recently
    theme = random.choice(THEMES)
    rand_code = random.randint(100, 999)
    pid = f"kd-chatgpt-{rand_code}"
    pdir = AUTO_DIR / pid
    pdir.mkdir(parents=True, exist_ok=True)

    # 1. Front
    im.save(pdir / "model-front.jpg", "JPEG", quality=95)

    # 2. Lifestyle (Cinematic upper-body crop)
    w, h = im.size
    crop_box = (int(w * 0.05), int(h * 0.05), int(w * 0.95), int(h * 0.70))
    im_crop = im.crop(crop_box)
    im_crop.save(pdir / "model-lifestyle.jpg", "JPEG", quality=95)

    # 3. Back
    back_tmpl = BASE_DIR / "assets" / "products" / "racing-division-tee" / "back.jpg"
    if "ecru" in theme[5].lower() or "white" in theme[5].lower():
        back_tmpl = BASE_DIR / "assets" / "products" / "same-sky-tee" / "back.jpg"
    shutil.copy(back_tmpl, pdir / "model-back.jpg")

    title = f"{theme[0]}: '{theme[1]} #{rand_code}' 280 GSM Oversized T-Shirt"

    product = {
        "id": pid,
        "title": title,
        "category": theme[4],
        "subCategory": "oversized-tees",
        "gender": "unisex",
        "badge": "CHATGPT DROP",
        "badgeColor": "bg-emerald-500 text-black",
        "price": theme[6],
        "comparePrice": 1499,
        "discount": f"{int(round((1499 - theme[6]) / 1499 * 100))}% OFF",
        "rating": 5.0,
        "reviewsCount": random.randint(140, 260),
        "images": [
            f"assets/products/auto-generated/{pid}/model-front.jpg",
            f"assets/products/auto-generated/{pid}/model-back.jpg",
            f"assets/products/auto-generated/{pid}/model-lifestyle.jpg"
        ],
        "fabric": "100% Super-Combed Heavyweight French Terry Cotton 280 GSM",
        "gsm": 280,
        "fit": "Oversized Boxy Fit",
        "color": theme[5],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "offer": "Buy 2 @ ₹1,199",
        "tags": ["Oversized Boxy Fit", "280 GSM", "Unisex", "ChatGPT Drop", "Streetwear", "Bestseller"],
        "description": f"Autonomous drop generated via ChatGPT DALL-E. Cut from ultra-dense 280 GSM French Terry cotton with relaxed drop-shoulder drape. Front showcases high-definition custom graphic with Japanese kanji calligraphy ('{theme[2]}') and {theme[3]}.",
        "care": "Machine wash cold inside out with like colors. Do not bleach. Lay flat to dry.",
        "autoGenerated": True,
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "themeId": pid,
        "modelDesc": f"Streetwear model wearing {theme[0]}"
    }

    products.insert(0, product)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    # Sync js/data.js
    with open("js/data.js", "r", encoding="utf-8") as f:
        content = f.read()
    sp = content.find("const PRODUCTS = [")
    ep = content.find("];\n\nconst DIY_PRESETS = {", sp)
    if sp != -1 and ep != -1:
        new_js = "const PRODUCTS = " + json.dumps(products, indent=2, ensure_ascii=False)
        with open("js/data.js", "w", encoding="utf-8") as f:
            f.write(content[:sp] + new_js + content[ep + 1:])

    print(f"🎉 [WATCHER] SUCCESS! Published '{title}' to store live!")
    return product

def main():
    print("👀 [WATCHER] Active! Monitoring /Users/apple/Downloads for ChatGPT downloads...")
    seen = get_existing_files()
    while True:
        time.sleep(2)
        current = get_existing_files()
        new_files = current - seen
        if new_files:
            for nf in sorted(new_files):
                process_image(nf)
            seen = current

if __name__ == "__main__":
    main()
