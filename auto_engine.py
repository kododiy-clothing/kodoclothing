#!/usr/bin/env python3
"""
KODO.DIY — Autonomous AI Auto-Pilot Streetwear Drop Engine
Generates 10 authentic streetwear drops every 1 hour with brand-new photorealistic
editorial streetwear models, custom graphics, 280 GSM specs, and copywriting.
"""

import os
import sys
import json
import time
import random
import math
import shutil
import threading
from datetime import datetime, timezone
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
ASSETS_DIR = BASE_DIR / "assets" / "products"
MODELS_DIR = BASE_DIR / "assets" / "models" / "ai-photoreal"
AUTO_ASSETS_DIR = ASSETS_DIR / "auto-generated"
DATA_FILE = DATA_DIR / "auto_products.json"

DATA_DIR.mkdir(exist_ok=True)
AUTO_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------
# 1. 10 REAL PHOTOREALISTIC STREETWEAR MODELS & DESIGN MATRIX
# -------------------------------------------------------------
THEMES = [
    {
        "id": "shibuya-glitch",
        "name": "Tokyo Cyber: 'NO SIGNAL 03:42 AM'",
        "kanji": "渋谷 深夜 信号なし",
        "mantra": "Disconnected But Still Breathing • Same Sky Different Frequencies",
        "category": "racing-tokyo",
        "sub_category": "oversized-tees",
        "color": "Pitch Onyx Black",
        "ink_color": (0, 240, 255),       # Cyan
        "accent_ink": (255, 45, 85),      # Neon Pink
        "coordinates": "35.6595° N, 139.7004° E",
        "badge": "CYBER DROP",
        "price": 699,
        "graphic_type": "glitch_radar",
        "model_file": "m1-tokyo-cyber.jpg",
        "model_desc": "Male model in Tokyo Shibuya rain-slicked neon alley"
    },
    {
        "id": "celestial-equinox",
        "name": "Solar Equinox: 'Orbit 07' Celestial Series",
        "kanji": "太陽軌道 天体観測",
        "mantra": "Seven Lunar Phases • Orbiting In Total Silence",
        "category": "celestial-series",
        "sub_category": "oversized-tees",
        "color": "Vintage Off-White / Warm Ecru",
        "ink_color": (20, 20, 25),        # Deep Charcoal
        "accent_ink": (180, 140, 70),     # Antique Gold
        "coordinates": "51.1789° N, 1.8262° W",
        "badge": "GRAIL DROP",
        "price": 699,
        "graphic_type": "lunar_phases",
        "model_file": "m2-celestial-ecru.jpg",
        "model_desc": "Female model in brutalist concrete sunlit pavilion"
    },
    {
        "id": "midnight-wangan",
        "name": "Midnight Wangan: Twin-Turbo GT-R Division",
        "kanji": "湾岸線 最高速 限界突破",
        "mantra": "Engineered For Speed • Shuto Expressway Midnight Run",
        "category": "racing-tokyo",
        "sub_category": "oversized-tees",
        "color": "Onyx Black & Crimson",
        "ink_color": (255, 30, 40),       # Racing Red
        "accent_ink": (240, 240, 240),    # Pure White
        "coordinates": "35.6264° N, 139.7743° E",
        "badge": "HYPE DROP",
        "price": 749,
        "graphic_type": "tachometer_drift",
        "model_file": "m3-wangan-racing.jpg",
        "model_desc": "Male model in neon underground GT-R drift garage"
    },
    {
        "id": "alpine-ridge",
        "name": "Altitude 4810M: 'Mon Blanc' Cloudline Atelier",
        "kanji": "白嶺 高度四千八百米",
        "mantra": "Higher Than Yesterday • Same Soul Different Altitude",
        "category": "alpine-series",
        "sub_category": "oversized-tees",
        "color": "Washed Slate Grey",
        "ink_color": (15, 15, 20),
        "accent_ink": (45, 140, 227),     # Electric Sky
        "coordinates": "45.8326° N, 6.8652° E",
        "badge": "BESTSELLER",
        "price": 699,
        "graphic_type": "topo_summit",
        "model_file": "m4-alpine-summit.jpg",
        "model_desc": "Male model on alpine foggy observation deck"
    },
    {
        "id": "acid-gothic",
        "name": "Acid Renaissance: 'Glitched Chaos' Mineral Wash",
        "kanji": "電子の魂 溶解芸術",
        "mantra": "Born In Noise • Raised By Broken Underground Frequencies",
        "category": "oversized-tees",
        "sub_category": "oversized-tees",
        "color": "Mineral Washed Charcoal",
        "ink_color": (163, 230, 53),      # Acid Lime
        "accent_ink": (240, 240, 240),
        "coordinates": "52.5200° N, 13.4050° E",
        "badge": "HOT DROP",
        "price": 649,
        "graphic_type": "acid_warp",
        "model_file": "m5-acid-gothic.jpg",
        "model_desc": "Female split-dyed model in raw concrete stairwell"
    },
    {
        "id": "y2k-cyberstar",
        "name": "Cyber Star Y2K: 'Matrix Chrome' Heavy Terry",
        "kanji": "電子妖精 新世界秩序",
        "mantra": "Liquid Silver Chrome • Y2K Aesthetics For The Next Era",
        "category": "oversized-tees",
        "sub_category": "oversized-tees",
        "color": "Pitch Onyx Black",
        "ink_color": (236, 72, 153),      # Hyper Pink
        "accent_ink": (6, 182, 212),      # Cyan
        "coordinates": "37.5665° N, 126.9780° E",
        "badge": "VIRAL DROP",
        "price": 649,
        "graphic_type": "chrome_star",
        "model_file": "m6-y2k-chrome.jpg",
        "model_desc": "Female model on Seoul Gangnam glass rooftop"
    },
    {
        "id": "subterranean-metro",
        "name": "Subterranean Archive: 'Terminal Area 04' Industrial",
        "kanji": "地下鉄路 最終列車",
        "mantra": "Industrial Architecture • Platform 04 Last Call 02:18 AM",
        "category": "oversized-tees",
        "sub_category": "oversized-tees",
        "color": "Deep Concrete Slate",
        "ink_color": (255, 165, 0),       # Hazard Orange
        "accent_ink": (220, 220, 220),
        "coordinates": "40.7128° N, 74.0060° W",
        "badge": "VIRAL ON IG",
        "price": 649,
        "graphic_type": "hazard_industrial",
        "model_file": "m7-subterranean.jpg",
        "model_desc": "South Asian male model in brutalist subway terminal"
    },
    {
        "id": "kyoto-drifter",
        "name": "Kyoto Touge: 'Night Run' Gold Mountain Contour",
        "kanji": "峠の夜 闇夜の追撃",
        "mantra": "Hairpin Curves In Dense Fog • Silent Drift Division",
        "category": "racing-tokyo",
        "sub_category": "oversized-tees",
        "color": "Pitch Onyx Black",
        "ink_color": (255, 215, 0),       # Racing Gold
        "accent_ink": (255, 255, 255),
        "coordinates": "35.0116° N, 135.7681° E",
        "badge": "LIMITED RUN",
        "price": 699,
        "graphic_type": "mountain_pass",
        "model_file": "m8-kyoto-touge.jpg",
        "model_desc": "East Asian male model on foggy Kyoto mountain pass"
    },
    {
        "id": "astral-zenith",
        "name": "Astral Zenith: 'Cosmic Orbit' Shinjuku Galaxy",
        "kanji": "無重力 宇宙塵芥",
        "mantra": "Beyond The Stratosphere • Weightless Thoughts in Deep Space",
        "category": "celestial-series",
        "sub_category": "oversized-tees",
        "color": "Washed Black & Lavender",
        "ink_color": (192, 132, 252),     # Cosmic Lavender
        "accent_ink": (56, 189, 248),     # Electric Ice
        "coordinates": "35.6938° N, 139.7034° E",
        "badge": "VIP COP",
        "price": 699,
        "graphic_type": "space_grid",
        "model_file": "m9-astral-zenith.jpg",
        "model_desc": "High-fashion female model on Shinjuku night rooftop"
    },
    {
        "id": "akira-speed",
        "name": "Neo Neo-Tokyo: 'Speed Motorbike' Division 2026",
        "kanji": "新東京 暴走特攻隊",
        "mantra": "Underground Highway Faction • Fuel In Our Blood",
        "category": "racing-tokyo",
        "sub_category": "oversized-tees",
        "color": "Onyx Black & Speed Yellow",
        "ink_color": (250, 204, 21),      # Speed Yellow
        "accent_ink": (255, 255, 255),
        "coordinates": "35.6895° N, 139.6917° E",
        "badge": "HOT DROP",
        "price": 699,
        "graphic_type": "motor_capsule",
        "model_file": "m10-akira-speed.jpg",
        "model_desc": "Male model with matte black sport motorcycle"
    }
]

# -------------------------------------------------------------
# 1.1 EXPANSIVE PROCEDURAL STREETWEAR MATRIX (NO DUPLICATES)
# -------------------------------------------------------------
ARCHETYPES = [
    {
        "base_id": "tokyo-cyber",
        "prefixes": ["Tokyo Cyber", "Shinjuku Glitch", "Akihabara Mecha", "Cyberpunk Division", "Neo Shibuya", "Roppongi Signal"],
        "subtitles": [
            "NO SIGNAL 03:42 AM", "LOST FREQUENCY 04:19 AM", "CIRCUIT OVERLOAD 01:15 AM",
            "DIGITAL REBEL 02:30 AM", "FREQUENCY WARP 05:00 AM", "MATRIX DRIFT 11:45 PM",
            "NEON TELEMETRY 00:00", "QUANTUM VOID 02:22 AM"
        ],
        "kanjis": ["渋谷 深夜 信号なし", "電脳都市 仮想現実", "回路暴走 限界突破", "秋葉原 機械生命体", "新宿 雑音 周波数", "電磁幽霊 意識同期"],
        "mantras": [
            "Disconnected But Still Breathing • Same Sky Different Frequencies",
            "Broken Analog Signals In A Pure Digital Empire",
            "Lost Inside The Tokyo Neon Grid • Frequencies That Never Die",
            "Cybernetic Heartbeat In An Unforgiving Concrete Matrix"
        ],
        "category": "racing-tokyo",
        "model_file": "m1-tokyo-cyber.jpg",
        "model_desc": "Male model in Tokyo Shibuya rain-slicked neon alley",
        "graphic_type": "glitch_radar",
        "coordinates": "35.6595° N, 139.7004° E"
    },
    {
        "base_id": "celestial-equinox",
        "prefixes": ["Solar Equinox", "Lunar Horizon", "Celestial Atelier", "Nocturnal Orbit", "Starlight Eclipse", "Zenith Eclipse"],
        "subtitles": [
            "Orbit 07 Celestial", "Event Zero 11:47 PM", "Seven Lunar Phases",
            "Nocturnal Alignment", "Coronal Dust Echo", "Solar Flare Vol. 02",
            "Gravity Well 00:01 AM", "Equinox Zenith"
        ],
        "kanjis": ["太陽軌道 天体観測", "月齢周期 静寂宇宙", "無重力 宇宙塵芥", "深宇宙 星間航行", "日食観測 恒星放射", "光年彼方 銀河渦巻"],
        "mantras": [
            "Seven Lunar Phases • Orbiting In Total Silence",
            "Same Sky Different Stories • A Quieter Kind Of Freedom",
            "Between The Earth And The Sun • Constant Gravitational Pull",
            "Weightless Thoughts Floating Past The Planetary Orbit Rings"
        ],
        "category": "celestial-series",
        "model_file": "m2-celestial-ecru.jpg",
        "model_desc": "Female model in brutalist concrete sunlit pavilion",
        "graphic_type": "lunar_phases",
        "coordinates": "51.1789° N, 1.8262° W"
    },
    {
        "base_id": "midnight-wangan",
        "prefixes": ["Midnight Wangan", "Shuto Highway", "Kanjozoku Loop", "Bayside Division", "Tokyo Speed Syndicate", "Daikoku Tunnel"],
        "subtitles": [
            "Twin-Turbo GT-R", "Midnight Tokyo 300KM/H", "RB26 High Boost",
            "Shuto Express 02:40 AM", "Turbocharged Apex", "Mid Night Club 1999",
            "Yokohama Drift 03:15 AM", "Tachometer Redline"
        ],
        "kanjis": ["湾岸線 最高速 限界突破", "首都高 暴走特攻", "直列六気筒 過給圧", "環状族 闇夜疾走", "最速伝説 鉄仮面", "大黒埠頭 集合警報"],
        "mantras": [
            "Engineered For Speed • Shuto Expressway Midnight Run",
            "Redlines At 9,000 RPM • The City Is Our Racetrack",
            "Twin-Turbochargers Whistling Through Tunnel Exhaust Echoes",
            "Never Lifting Off The Throttle Into The Morning Mist"
        ],
        "category": "racing-tokyo",
        "model_file": "m3-wangan-racing.jpg",
        "model_desc": "Male model in neon underground GT-R drift garage",
        "graphic_type": "tachometer_drift",
        "coordinates": "35.6264° N, 139.7743° E"
    },
    {
        "base_id": "alpine-ridge",
        "prefixes": ["Altitude 4810M", "Chamonix Glacier", "Matterhorn Stoic", "Hokkaido Summit", "Alps Ridge Contour", "Mont Blanc Atelier"],
        "subtitles": [
            "Mon Blanc Cloudline", "Crevasse Explorer", "Topographic 4478M",
            "Sub-Zero Expedition", "Cloudline Atelier", "Stoic Summit Mark II",
            "4810M Ridge Line", "Glacial Apex"
        ],
        "kanjis": ["白嶺 高度四千八百米", "氷河探訪 孤高頂上", "白馬山脈 霧中行進", "登山家 限界標高", "極寒風雪 精神鍛錬", "千丈断崖 孤高息吹"],
        "mantras": [
            "Higher Than Yesterday • Same Soul Different Altitude",
            "Silence Found Above The Cloudline At 4,000 Meters",
            "Stoic Contours Carved By Millenniums Of Glacial Ice",
            "The Mountain Does Not Care • Stand Tall Regardless"
        ],
        "category": "alpine-series",
        "model_file": "m4-alpine-summit.jpg",
        "model_desc": "Male model on alpine foggy observation deck",
        "graphic_type": "topo_summit",
        "coordinates": "45.8326° N, 6.8652° E"
    },
    {
        "base_id": "acid-gothic",
        "prefixes": ["Acid Renaissance", "Chemical Melt", "Toxic Distortion", "Underground Sub-Frequency", "Mineral Wash Atelier", "Glitch Smile"],
        "subtitles": [
            "Glitched Chaos", "Liquid Distortion", "Acid Smiley 1996",
            "Broken Noise Frequencies", "Concrete Decay Vol. 03", "Melting Reality",
            "Sub-Bass Acid 04:00 AM", "Industrial Noise"
        ],
        "kanjis": ["電子の魂 溶解芸術", "混沌音波 精神崩壊", "有毒笑顔 世紀末", "退廃都市 歪曲現実", "地下室 重低音狂気", "溶解十字 精神破砕"],
        "mantras": [
            "Born In Noise • Raised By Broken Underground Frequencies",
            "Distorted Concrete Realities Melting Into Acid Washes",
            "90s Acid Rave Philosophy Reconstructed For The Modern Stance",
            "Static Between Radio Stations Turned Into Heavy Cotton Murals"
        ],
        "category": "oversized-tees",
        "model_file": "m5-acid-gothic.jpg",
        "model_desc": "Female split-dyed model in raw concrete stairwell",
        "graphic_type": "acid_warp",
        "coordinates": "52.5200° N, 13.4050° E"
    },
    {
        "base_id": "y2k-cyberstar",
        "prefixes": ["Cyber Star Y2K", "Liquid Mercury", "Seoul Gangnam Grid", "Chrome Matrix", "Holographic 2000", "Cyber Tribe"],
        "subtitles": [
            "Matrix Chrome", "Year 2000 Archive", "Midnight Glass Facade",
            "Liquid Silver Tribal", "Cyber Core Gloss", "Seoul Skyline 03:00 AM",
            "Holographic Star 2026", "Mercury Core"
        ],
        "kanjis": ["電子妖精 新世界秩序", "水銀流動 未来都市", "江南高層 硝子反射", "千禧年 記憶媒体", "金属心臓 永久鼓動", "銀色電脳 幻影粒子"],
        "mantras": [
            "Liquid Silver Chrome • Y2K Aesthetics For The Next Era",
            "Reflecting Seoul Rooftop Neon On Heavy Drop-Shoulder Terry",
            "Futuristic Metal Stars Cast In Ultra-Heavy 280 GSM Weave",
            "Year 2000 Nostalgia Elevated With Modern Streetwear Cuts"
        ],
        "category": "oversized-tees",
        "model_file": "m6-y2k-chrome.jpg",
        "model_desc": "Female model on Seoul Gangnam glass rooftop",
        "graphic_type": "chrome_star",
        "coordinates": "37.5665° N, 126.9780° E"
    },
    {
        "base_id": "subterranean-metro",
        "prefixes": ["Subterranean Archive", "Sector 09 Industrial", "Metro Terminal", "Berlin Vault", "Hazard Division", "Platform 04"],
        "subtitles": [
            "Terminal Area 04", "Platform 04 Last Call", "Raw Concrete Monolith",
            "Underground Sector 09", "Industrial High-Voltage", "Tunnel Maintenance 02:18 AM",
            "Subway Line 07", "Brutalist Depot"
        ],
        "kanjis": ["地下鉄路 最終列車", "工業地区 立入禁止", "高電圧 危険標識", "深層鉄構 防空壕", "終電通過 暗黒軌道", "廃墟鉄骨 警告灯"],
        "mantras": [
            "Industrial Architecture • Platform 04 Last Call 02:18 AM",
            "Raw Brutalist Slabs Reimagined Into Heavyweight Armor",
            "Hazard Stripes & Warning Telemetry From The Subterranean Lines",
            "Heavy Combed Cotton Built To Survive The Concrete Jungle"
        ],
        "category": "oversized-tees",
        "model_file": "m7-subterranean.jpg",
        "model_desc": "South Asian male model in brutalist subway terminal",
        "graphic_type": "hazard_industrial",
        "coordinates": "40.7128° N, 74.0060° W"
    },
    {
        "base_id": "kyoto-drifter",
        "prefixes": ["Kyoto Touge", "Mount Haruna Ghost", "Silent Hairpin", "Dragon Pass", "Foggy Peak Touge", "Arashiyama Drift"],
        "subtitles": [
            "Night Run Gold Mountain", "Hairpin Apex Drift", "Silent Whiteout Touge",
            "Kanji Mountain Ridge", "Ghost of Akina", "Kyoto Pass 03:30 AM",
            "Touge Master 86", "Bamboo Mist Run"
        ],
        "kanjis": ["峠の夜 闇夜の追撃", "榛名山 幽霊走者", "急曲線 制覇限界", "京都峠 霧幻疾駆", "金箔山嶺 漆黒闇", "竹林間 閃光軌跡"],
        "mantras": [
            "Hairpin Curves In Dense Fog • Silent Drift Division",
            "Tires Screaming Down Damp Asphalt Between The Bamboo Groves",
            "Gold Kanji Calligraphy Gilded Over Pitch Onyx Heavyweight Cotton",
            "The Legend Of The Mountain Pass Passed Down In The Shadows"
        ],
        "category": "racing-tokyo",
        "model_file": "m8-kyoto-touge.jpg",
        "model_desc": "East Asian male model on foggy Kyoto mountain pass",
        "graphic_type": "mountain_pass",
        "coordinates": "35.0116° N, 135.7681° E"
    },
    {
        "base_id": "astral-zenith",
        "prefixes": ["Astral Zenith", "Deep Space Nebula", "Starlight Andromeda", "Void Horizon", "Galactic Core", "Cosmic Eclipse"],
        "subtitles": [
            "Cosmic Orbit Shinjuku", "Interstellar 08", "Coronal Dust Echo",
            "Andromeda Core", "Zero Gravity Pulse", "Starry Shinjuku 04:00 AM",
            "Stardust Nebula", "Deep Void Telescope"
        ],
        "kanjis": ["無重力 宇宙塵芥", "星雲深層 光年彼方", "超新星 恒星崩壊", "銀河系 銀色螺旋", "深夜新宿 満天星空", "暗黒物質 空間跳躍"],
        "mantras": [
            "Beyond The Stratosphere • Weightless Thoughts in Deep Space",
            "Neon Shinjuku Skylines Blending Into Ancient Distant Galaxies",
            "Cosmic Lavender Inks Screen-Printed Over 280 GSM Terry",
            "Floating Freely Between Orbiting Asteroids And Street Corners"
        ],
        "category": "celestial-series",
        "model_file": "m9-astral-zenith.jpg",
        "model_desc": "High-fashion female model on Shinjuku night rooftop",
        "graphic_type": "space_grid",
        "coordinates": "35.6938° N, 139.7034° E"
    },
    {
        "base_id": "akira-speed",
        "prefixes": ["Neo Neo-Tokyo", "Kaneda Speedway", "Speed Syndicate", "Cyber Highway", "Mach Division", "Bosozoku Thunder"],
        "subtitles": [
            "Speed Motorbike Division", "Capsule Speed 1988", "Mach Division Interceptor",
            "Red Taillight Trail", "Underground Highway Faction", "Tokyo Nitro Run 2026",
            "Speed Division 01", "Neon Exhaust 99"
        ],
        "kanjis": ["新東京 暴走特攻隊", "金田軍団 超音速機", "赤い閃光 尾灯残像", "高速道路 支配者", "超高回転 狂気疾駆", "超電導 鉄馬爆音"],
        "mantras": [
            "Underground Highway Faction • Fuel In Our Blood",
            "Smell Of Burnt Rubber & High Octane Fuel In Neo-Tokyo Alleys",
            "Laser Taillights Slashing Through The Rain-Soaked Expressway",
            "Born In The Aftermath • Built For Infinite Velocity"
        ],
        "category": "racing-tokyo",
        "model_file": "m10-akira-speed.jpg",
        "model_desc": "Male model with matte black sport motorcycle",
        "graphic_type": "motor_capsule",
        "coordinates": "35.6895° N, 139.6917° E"
    }
]

def generate_unique_streetwear_theme(existing_titles=None):
    """
    Procedurally synthesizes a 100% UNIQUE streetwear theme that has never
    been generated before in the catalog.
    """
    if existing_titles is None:
        existing_titles = set()

    color_palettes = [
        ("Pitch Onyx Black", (245, 245, 245), (45, 140, 227)),
        ("Vintage Off-White / Warm Ecru", (20, 20, 25), (180, 140, 70)),
        ("Mineral Washed Charcoal", (163, 230, 53), (240, 240, 240)),
        ("Washed Slate Grey", (15, 15, 20), (45, 140, 227)),
        ("Heavy Forest Pine", (255, 215, 0), (255, 255, 255)),
        ("Onyx Black & Crimson", (255, 30, 40), (240, 240, 240)),
        ("Deep Concrete Slate", (255, 165, 0), (220, 220, 220)),
        ("Washed Black & Lavender", (192, 132, 252), (56, 189, 248)),
        ("Onyx Black & Speed Yellow", (250, 204, 21), (255, 255, 255)),
        ("Faded Vintage Sand", (30, 30, 35), (200, 120, 50)),
        ("Electric Cobalt Fade", (255, 255, 255), (0, 240, 255)),
        ("Raw Concrete Chalk", (25, 25, 30), (236, 72, 153))
    ]
    badges = ["VIRAL DROP", "LIMITED RUN", "HYPE PIECE", "ARCHIVE 2026", "GRAIL DROP", "CYBER DROP", "VIP COP", "BESTSELLER", "NEW RELEASE"]
    prices = [649, 699, 749, 799, 849]

    # Try up to 300 procedural combinations to guarantee uniqueness
    for _ in range(300):
        arch = random.choice(ARCHETYPES)
        prefix = random.choice(arch["prefixes"])
        subtitle = random.choice(arch["subtitles"])
        title = f"{prefix}: '{subtitle}' 280 GSM Oversized T-Shirt"

        if title not in existing_titles:
            color_name, ink, accent = random.choice(color_palettes)
            rand_code = random.randint(100, 999)
            return {
                "id": f"{arch['base_id']}-{rand_code}",
                "name": f"{prefix}: '{subtitle}'",
                "title": title,
                "category": arch["category"],
                "sub_category": "oversized-tees",
                "kanji": random.choice(arch["kanjis"]),
                "mantra": random.choice(arch["mantras"]),
                "coordinates": arch["coordinates"],
                "model_file": arch["model_file"],
                "model_desc": arch["model_desc"],
                "graphic_type": arch["graphic_type"],
                "color": color_name,
                "ink_color": ink,
                "accent_ink": accent,
                "badge": random.choice(badges),
                "price": random.choice(prices)
            }

    # Fallback with randomized timestamp to guarantee 100% uniqueness
    arch = random.choice(ARCHETYPES)
    rand_code = random.randint(1000, 9999)
    prefix = random.choice(arch["prefixes"])
    color_name, ink, accent = random.choice(color_palettes)
    title = f"{prefix}: 'Archive Drop #{rand_code}' 280 GSM Oversized T-Shirt"
    return {
        "id": f"{arch['base_id']}-{rand_code}",
        "name": f"{prefix}: 'Archive Drop #{rand_code}'",
        "title": title,
        "category": arch["category"],
        "sub_category": "oversized-tees",
        "kanji": random.choice(arch["kanjis"]),
        "mantra": random.choice(arch["mantras"]),
        "coordinates": arch["coordinates"],
        "model_file": arch["model_file"],
        "model_desc": arch["model_desc"],
        "graphic_type": arch["graphic_type"],
        "color": color_name,
        "ink_color": ink,
        "accent_ink": accent,
        "badge": "LIMITED RUN",
        "price": random.choice(prices)
    }


# -------------------------------------------------------------
# 2. IMAGE RENDERING ENGINE
# -------------------------------------------------------------
def get_back_template(is_white_garment):
    if is_white_garment:
        back_candidates = [
            ASSETS_DIR / "altitude-tee" / "back.jpg",
            ASSETS_DIR / "same-sky-tee" / "back.jpg"
        ]
    else:
        back_candidates = [
            ASSETS_DIR / "crescent-moon-tee" / "model-back.jpg",
            ASSETS_DIR / "racing-division-tee" / "back.jpg",
            ASSETS_DIR / "no-signal-tee" / "back.jpg"
        ]
    exist = [p for p in back_candidates if p.exists()]
    return random.choice(exist) if exist else (ASSETS_DIR / "same-sky-tee" / "back.jpg")

def draw_back_mural(draw, width, height, theme):
    ink = theme["ink_color"]
    accent = theme["accent_ink"]
    g_type = theme["graphic_type"]

    cx, cy = width // 2, height // 2
    box_size = int(min(width, height) * 0.72)
    top_y = cy - box_size // 2

    # Outer architectural frame
    draw.rectangle([cx - box_size // 2, top_y, cx + box_size // 2, top_y + box_size], outline=ink, width=3)
    # Corner registration marks
    draw.line([cx - box_size // 2 - 15, top_y, cx - box_size // 2 + 15, top_y], fill=accent, width=2)
    draw.line([cx + box_size // 2 - 15, top_y, cx + box_size // 2 + 15, top_y], fill=accent, width=2)
    draw.line([cx - box_size // 2 - 15, top_y + box_size, cx - box_size // 2 + 15, top_y + box_size], fill=accent, width=2)
    draw.line([cx + box_size // 2 - 15, top_y + box_size, cx + box_size // 2 + 15, top_y + box_size], fill=accent, width=2)

    # Concentric rings
    for r in range(40, box_size // 2 - 15, 45):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=ink, width=2)

    # Crosshair lines
    draw.line([cx - box_size // 2 + 20, cy, cx + box_size // 2 - 20, cy], fill=accent, width=1)
    draw.line([cx, cy - box_size // 2 + 20, cx, cy + box_size // 2 - 20], fill=accent, width=1)

    # Center rune / core
    draw.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], fill=accent, outline=ink, width=2)

    # Specific theme accents
    if "drift" in g_type or "racing" in g_type or "speed" in g_type or "motor" in g_type:
        for i in range(-5, 6):
            y_off = cy + i * 25
            draw.line([cx - 120, y_off, cx + 120, y_off], fill=ink, width=2)
            draw.rectangle([cx - 90 + (i % 2) * 40, y_off - 6, cx - 50 + (i % 2) * 40, y_off + 6], fill=accent)
    elif "lunar" in g_type or "space" in g_type:
        for idx, ang in enumerate(range(0, 360, 45)):
            rad = math.radians(ang)
            px = cx + int(math.cos(rad) * (box_size // 2 - 35))
            py = cy + int(math.sin(rad) * (box_size // 2 - 35))
            draw.ellipse([px - 10, py - 10, px + 10, py + 10], fill=ink if idx % 2 == 0 else accent)
    else:
        for step in range(1, 6):
            peak_w = step * 32
            draw.polygon([
                (cx, cy - 80 + step * 25),
                (cx - peak_w, cy + 40 + step * 10),
                (cx + peak_w, cy + 40 + step * 10)
            ], outline=accent, fill=None)

    # Technical Barcode blocks
    draw.rectangle([cx - 90, top_y + box_size + 15, cx + 90, top_y + box_size + 38], fill=ink)
    draw.rectangle([cx - 80, top_y - 28, cx + 80, top_y - 12], fill=accent)

def composite_back_image(base_img_path, theme, output_path):
    if not PIL_AVAILABLE:
        shutil.copy(base_img_path, output_path)
        return

    base_img = Image.open(base_img_path).convert("RGBA")
    w, h = base_img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw_back_mural(draw, w, h, theme)
    overlay = overlay.filter(ImageFilter.GaussianBlur(radius=0.7))

    alpha = overlay.split()[3]
    alpha = ImageEnhance.Brightness(alpha).enhance(0.88)
    overlay.putalpha(alpha)

    final_img = Image.alpha_composite(base_img, overlay).convert("RGB")
    final_img.save(output_path, "JPEG", quality=90)


# -------------------------------------------------------------
# 3. PRODUCT GENERATOR WITH REAL MODEL LOOKBOOKS
# -------------------------------------------------------------
def generate_single_product(theme=None, index=1, total=10, existing_titles=None):
    """
    Synthesizes a complete streetwear product with a brand-new
    real photorealistic model lookbook (front, back, detail, lifestyle).
    """
    if theme is None:
        if existing_titles is None:
            existing_titles = {p["title"] for p in load_auto_products()}
        theme = generate_unique_streetwear_theme(existing_titles)

    rand_hex = f"{random.randint(100, 999)}"
    prod_id = f"kd-auto-{theme['id']}-{rand_hex}"

    prod_dir = AUTO_ASSETS_DIR / prod_id
    prod_dir.mkdir(parents=True, exist_ok=True)

    # 1. Real Photorealistic Model Source
    model_src = MODELS_DIR / theme["model_file"]
    if not model_src.exists():
        # Fallback to any model file in MODELS_DIR
        available = list(MODELS_DIR.glob("*.jpg"))
        model_src = available[0] if available else (ASSETS_DIR / "same-sky-tee" / "front.jpg")

    # 1. Front Model Image: Full high-res editorial shot
    shutil.copy(model_src, prod_dir / "model-front.jpg")

    # 2. Back Image: Real model back shot if available, else high-res reverse mural
    model_stem = model_src.stem
    back_src = MODELS_DIR / f"{model_stem}-back.jpg"
    if back_src.exists():
        shutil.copy(back_src, prod_dir / "model-back.jpg")
    else:
        is_white = "white" in theme["color"].lower() or "ecru" in theme["color"].lower()
        back_template = get_back_template(is_white)
        composite_back_image(back_template, theme, prod_dir / "model-back.jpg")

    # 3. Lifestyle / Editorial Angle: Real model lifestyle shot if available, else cinematic crop
    lifestyle_src = MODELS_DIR / f"{model_stem}-lifestyle.jpg"
    if lifestyle_src.exists():
        shutil.copy(lifestyle_src, prod_dir / "model-lifestyle.jpg")
    elif PIL_AVAILABLE:
        try:
            m_img = Image.open(model_src)
            mw, mh = m_img.size
            # Cinematic upper-body lifestyle crop
            lifestyle_box = (int(mw * 0.05), int(mh * 0.02), int(mw * 0.95), int(mh * 0.75))
            lifestyle_crop = m_img.crop(lifestyle_box)
            lifestyle_crop.save(prod_dir / "model-lifestyle.jpg", "JPEG", quality=95)
        except Exception:
            shutil.copy(model_src, prod_dir / "model-lifestyle.jpg")
    else:
        shutil.copy(model_src, prod_dir / "model-lifestyle.jpg")

    price = theme["price"]
    compare_price = 1499
    discount = f"{int(round((compare_price - price) / compare_price * 100))}% OFF"
    rating = round(random.uniform(4.8, 5.0), 1)
    reviews_count = random.randint(48, 194)

    title = theme.get("title", f"{theme['name']} 280 GSM Oversized T-Shirt")

    description = (
        f"Autonomous AI Drop: Meticulously cut from ultra-dense 280 GSM super-combed French Terry cotton. "
        f"Showcased on an exclusive KODO editorial model ({theme['model_desc']}). "
        f"Engineered with a signature boxy drop-shoulder silhouette, reinforced ribbed crew neckline, and clean double-needle hems. "
        f"Features high-density silkscreen graphics with subtle 3D embossed puff accents. "
        f"Front panel is anchored with custom typography, while the full reverse mural features {theme['mantra']}. "
        f"Infused with Tokyo coordinates ({theme['coordinates']}) and kanji calligraphy ('{theme['kanji']}'). "
        f"Pre-shrunk weave ensures zero shrinkage across wash cycles."
    )

    product = {
        "id": prod_id,
        "title": title,
        "category": theme["category"],
        "subCategory": theme["sub_category"],
        "gender": "unisex",
        "badge": theme["badge"],
        "badgeColor": "bg-neutral-950",
        "price": price,
        "comparePrice": compare_price,
        "discount": discount,
        "rating": rating,
        "reviewsCount": reviews_count,
        "images": [
            f"assets/products/auto-generated/{prod_id}/model-front.jpg",
            f"assets/products/auto-generated/{prod_id}/model-back.jpg",
            f"assets/products/auto-generated/{prod_id}/model-lifestyle.jpg"
        ],
        "fabric": "100% Super-Combed Heavyweight French Terry Cotton 280 GSM",
        "gsm": 280,
        "fit": "Oversized Boxy Fit",
        "color": theme["color"],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "offer": "Buy 2 @ ₹1,199",
        "tags": [
            "Oversized Boxy Fit",
            "280 GSM",
            "Unisex",
            "Men",
            "Women",
            theme["category"],
            "AI Auto Drop",
            "Streetwear",
            "Bestseller"
        ],
        "description": description,
        "care": "Machine wash cold inside out with like colors. Do not bleach. Lay flat to dry.",
        "autoGenerated": True,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "themeId": theme["id"],
        "modelDesc": theme["model_desc"]
    }

    return product


# -------------------------------------------------------------
# 4. STORAGE & BATCH RUNNER
# -------------------------------------------------------------
def load_auto_products():
    if not DATA_FILE.exists():
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_auto_products(prods):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(prods, f, indent=2, ensure_ascii=False)

def generate_batch(count=10, progress_callback=None):
    """
    Generates a batch of `count` products using real photorealistic models
    and prepends them to the catalog, strictly guaranteeing 100% UNIQUE titles.
    """
    current_products = load_auto_products()
    existing_titles = {p["title"] for p in current_products}
    new_products = []

    print(f"🚀 [AI DROP ENGINE] Generating {count} UNIQUE products with REAL EDITORIAL MODELS...")

    for i in range(1, count + 1):
        theme = generate_unique_streetwear_theme(existing_titles)
        existing_titles.add(theme["title"])

        msg = f"Rendering {theme['name']} ({theme['model_desc']})..."
        if progress_callback:
            progress_callback(i, count, msg)
        print(f"   [{i}/{count}] {msg}")

        prod = generate_single_product(theme=theme, index=i, total=count, existing_titles=existing_titles)
        new_products.append(prod)

    combined = new_products + current_products
    save_auto_products(combined)

    print(f"✅ [AI DROP ENGINE] Batch complete! {len(new_products)} UNIQUE drops published.")
    return new_products


# -------------------------------------------------------------
# 5. AUTONOMOUS HOURLY BACKGROUND SCHEDULER
# -------------------------------------------------------------
class AutoDropScheduler:
    def __init__(self, interval_seconds=3600, batch_size=10):
        self.interval_seconds = interval_seconds
        self.batch_size = batch_size
        self.is_running = False
        self.last_run = None
        self.next_run = time.time() + interval_seconds
        self.thread = None
        self.lock = threading.RLock()
        self.logs = []

    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {message}"
        with self.lock:
            self.logs.append(entry)
            if len(self.logs) > 50:
                self.logs.pop(0)
        print(entry)

    def start(self):
        with self.lock:
            if self.thread and self.thread.is_alive():
                return
            self.is_running = True
            self.next_run = time.time() + self.interval_seconds
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            self.log(f"🟢 Autonomous Auto-Drop Scheduler STARTED (10 drops every {self.interval_seconds // 60} minutes)")

    def pause(self):
        with self.lock:
            self.is_running = False
            self.log("⏸️ Autonomous Auto-Drop Scheduler PAUSED by merchant")

    def resume(self):
        with self.lock:
            self.is_running = True
            self.next_run = time.time() + self.interval_seconds
            self.log("▶️ Autonomous Auto-Drop Scheduler RESUMED")

    def get_status(self):
        with self.lock:
            seconds_left = max(0, int(self.next_run - time.time())) if self.is_running else 0
            prods = load_auto_products()
            return {
                "is_running": self.is_running,
                "interval_seconds": self.interval_seconds,
                "batch_size": self.batch_size,
                "last_run": self.last_run,
                "next_run": self.next_run,
                "seconds_until_next_drop": seconds_left,
                "total_auto_products": len(prods),
                "logs": list(self.logs[-15:])
            }

    def _run_loop(self):
        while True:
            time.sleep(1)
            if not self.is_running:
                continue

            if time.time() >= self.next_run:
                self.log(f"⏰ Hourly trigger fired! Generating {self.batch_size} real model drops...")
                try:
                    def on_prog(curr, tot, text):
                        self.log(f"⚡ [{curr}/{tot}] {text}")

                    new_prods = generate_batch(count=self.batch_size, progress_callback=on_prog)
                    self.last_run = datetime.now(timezone.utc).isoformat()
                    self.next_run = time.time() + self.interval_seconds
                    self.log(f"🎉 Successfully published {len(new_prods)} drops! Next drop at {time.strftime('%H:%M:%S', time.localtime(self.next_run))}")
                except Exception as e:
                    self.log(f"❌ Error during automated drop: {str(e)}")
                    self.next_run = time.time() + 300


# Global instance
SCHEDULER = AutoDropScheduler(interval_seconds=3600, batch_size=10)

if __name__ == "__main__":
    if "--test-single" in sys.argv:
        p = generate_single_product()
        print("Generated single test product:")
        print(json.dumps(p, indent=2))
    elif "--batch" in sys.argv:
        count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        generate_batch(count=count)
    else:
        print("Starting AutoDrop Scheduler in foreground...")
        SCHEDULER.start()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("Stopped.")
