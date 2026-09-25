#!/usr/bin/env python3
"""
Bulletproof automated ChatGPT DALL-E driver
Controls open ChatGPT tab in Google Chrome, sends prompt, extracts new generated image, and deploys to KODO.DIY.
"""
import time
import subprocess
import json
import base64
import os
import shutil
import random
import re
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "auto_products.json"
AUTO_DIR = BASE_DIR / "assets" / "products" / "auto-generated"

def run_chrome_js(js_code):
    escaped_js = js_code.replace('\\', '\\\\').replace('"', '\\"')
    ascript = f'''
    tell application "Google Chrome"
        repeat with w in windows
            repeat with t in tabs of w
                if URL of t contains "chatgpt.com" then
                    return (execute t javascript "{escaped_js}")
                end if
            end repeat
        end repeat
    end tell
    '''
    res = subprocess.run(['osascript', '-e', ascript], capture_output=True, text=True)
    return res.stdout.strip()

def get_current_file_ids():
    js = '''
    (() => {
        const imgs = Array.from(document.querySelectorAll("main img")).map(i => i.src);
        return JSON.stringify(imgs.filter(s => s.includes("id=file_")));
    })()
    '''
    out = run_chrome_js(js)
    try:
        urls = json.loads(out)
        file_ids = set()
        for u in urls:
            m = re.search(r"id=(file_[a-zA-Z0-9]+)", u)
            if m:
                file_ids.add(m.group(1))
        return file_ids
    except Exception:
        return set()

def generate_and_extract(prompt_text, max_wait=180):
    print(f"\n🚀 [CHATGPT DRIVER] Prompt: {prompt_text[:70]}...")
    
    # 1. Baseline known file IDs
    known_ids = get_current_file_ids()
    print(f"   Baseline known image IDs: {len(known_ids)}")
    
    # 2. Clear base64
    run_chrome_js("window.__img_b64 = null;")
    
    # 3. Enter text and dispatch input event
    escaped_prompt = prompt_text.replace('"', '\\"')
    js_submit = f'''
    (() => {{
        const el = document.querySelector("#prompt-textarea");
        if (!el) return "NO_INPUT";
        el.focus();
        document.execCommand("selectAll", false, null);
        document.execCommand("insertText", false, "{escaped_prompt}");
        el.dispatchEvent(new Event("input", {{ bubbles: true }}));
        
        const btn = document.querySelector("button[data-testid=send-button]") || document.querySelector("button.composer-submit-btn");
        if (!btn) return "NO_SEND_BTN";
        if (btn.disabled) return "BTN_DISABLED";
        btn.click();
        return "CLICKED_SEND";
    }})()
    '''
    sub_status = run_chrome_js(js_submit)
    print(f"   Submit status: {sub_status}")
    if "CLICKED_SEND" not in sub_status:
        # Retry with small delay
        time.sleep(1)
        sub_status = run_chrome_js(js_submit)
        print(f"   Retry submit status: {sub_status}")
        
    # 4. Poll for new file ID in DOM
    time.sleep(5)
    start_time = time.time()
    new_img_url = None
    
    print(f"   Waiting for new DALL-E generation...")
    while time.time() - start_time < max_wait:
        time.sleep(3)
        current_urls_raw = run_chrome_js('''
        (() => {
            const stopBtn = document.querySelector("button[data-testid=stop-button]");
            const imgs = Array.from(document.querySelectorAll("main img")).map(i => i.src);
            return JSON.stringify({
                isGenerating: !!stopBtn,
                urls: imgs.filter(s => s.includes("id=file_"))
            });
        })()
        ''')
        try:
            data = json.loads(current_urls_raw)
            urls = data.get("urls", [])
            for u in urls:
                m = re.search(r"id=(file_[a-zA-Z0-9]+)", u)
                if m and m.group(1) not in known_ids:
                    # Found new file ID!
                    if not data.get("isGenerating", False):
                        new_img_url = u
                        print(f"   🎉 New image generated! File ID: {m.group(1)}")
                        break
            if new_img_url:
                break
        except Exception:
            pass
            
    if not new_img_url:
        print("❌ Timeout waiting for new image generation.")
        return None
        
    # 5. Extract image blob as Base64 via Chrome
    time.sleep(2)
    escaped_url = new_img_url.replace('\\', '\\\\').replace('"', '\\"')
    extract_js = f'''
    (() => {{
        fetch("{escaped_url}")
            .then(r => r.blob())
            .then(blob => {{
                const reader = new FileReader();
                reader.onloadend = () => {{ window.__img_b64 = reader.result; }};
                reader.readAsDataURL(blob);
            }})
            .catch(e => {{ window.__img_b64 = "ERR: " + e.message; }});
        return "FETCH_SENT";
    }})()
    '''
    run_chrome_js(extract_js)
    
    # Wait for base64
    for _ in range(15):
        time.sleep(1)
        b64 = run_chrome_js("window.__img_b64 || ''")
        if b64.startswith("data:image"):
            header, encoded = b64.split(",", 1)
            img_bytes = base64.b64decode(encoded)
            print(f"   Successfully extracted image: {len(img_bytes)} bytes!")
            return img_bytes
            
    print("❌ Failed to decode base64 from Chrome.")
    return None

def deploy_product(pid, title, theme, img_bytes):
    pdir = AUTO_DIR / pid
    pdir.mkdir(parents=True, exist_ok=True)
    
    temp_p = pdir / "temp.png"
    with open(temp_p, "wb") as f:
        f.write(img_bytes)
        
    src_im = Image.open(temp_p).convert("RGB")
    src_im.save(pdir / "model-front.jpg", "JPEG", quality=95)
    
    # Lifestyle crop
    w, h = src_im.size
    crop_box = (int(w * 0.08), int(h * 0.05), int(w * 0.92), int(h * 0.70))
    life_im = src_im.crop(crop_box)
    life_im.save(pdir / "model-lifestyle.jpg", "JPEG", quality=95)
    
    # Back template
    back_tmpl = BASE_DIR / "assets" / "products" / "racing-division-tee" / "back.jpg"
    if "ecru" in theme["color"].lower() or "white" in theme["color"].lower():
        back_tmpl = BASE_DIR / "assets" / "products" / "same-sky-tee" / "back.jpg"
    shutil.copy(back_tmpl, pdir / "model-back.jpg")
    
    temp_p.unlink(missing_ok=True)
    
    with open(DATA_FILE) as f:
        products = json.load(f)
        
    # Remove if exists
    products = [p for p in products if p['id'] != pid]
    
    prod = {
        'id': pid,
        'title': title,
        'category': theme['category'],
        'subCategory': 'oversized-tees',
        'gender': 'unisex',
        'badge': 'CHATGPT 4o DROP',
        'badgeColor': theme['badge_color'],
        'price': theme['price'],
        'comparePrice': 1499,
        'discount': f"{int(round((1499 - theme['price']) / 1499 * 100))}% OFF",
        'rating': 5.0,
        'reviewsCount': random.randint(130, 240),
        'images': [
            f'assets/products/auto-generated/{pid}/model-front.jpg',
            f'assets/products/auto-generated/{pid}/model-back.jpg',
            f'assets/products/auto-generated/{pid}/model-lifestyle.jpg'
        ],
        'fabric': '100% Super-Combed Heavyweight French Terry Cotton 280 GSM',
        'gsm': 280,
        'fit': 'Oversized Boxy Fit',
        'color': theme['color'],
        'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
        'offer': 'Buy 2 @ ₹1,199',
        'tags': ['Oversized Boxy Fit', '280 GSM', 'Unisex', 'ChatGPT Drop', theme['category'], 'Bestseller'],
        'description': f"Autonomous Drop generated directly via ChatGPT DALL-E 3. Cut from ultra-dense 280 GSM French Terry cotton with relaxed drop-shoulder drape. Features high-definition custom graphic with Japanese kanji calligraphy ('{theme['kanji']}') and {theme['mantra']}.",
        'care': 'Machine wash cold inside out with like colors. Do not bleach. Lay flat to dry.',
        'autoGenerated': True,
        'generatedAt': time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        'themeId': pid,
        'modelDesc': theme['desc']
    }
    
    products.insert(0, prod)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
        
    # Sync js/data.js
    with open('js/data.js', 'r', encoding='utf-8') as f:
        content = f.read()
    sp = content.find('const PRODUCTS = [')
    ep = content.find('];\n\nconst DIY_PRESETS = {', sp)
    if sp != -1 and ep != -1:
        new_js = 'const PRODUCTS = ' + json.dumps(products, indent=2, ensure_ascii=False)
        with open('js/data.js', 'w', encoding='utf-8') as f:
            f.write(content[:sp] + new_js + content[ep + 1:])
            
    print(f"🎉 Live Drop Deployed: {title} ({pid})!")
    return prod

if __name__ == "__main__":
    import sys
    prompt = sys.argv[1]
    pid = sys.argv[2]
    title = sys.argv[3]
    theme = json.loads(sys.argv[4])
    
    img_bytes = generate_and_extract(prompt)
    if img_bytes:
        deploy_product(pid, title, theme, img_bytes)
    else:
        print("❌ Generation failed.")
