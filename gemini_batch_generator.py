#!/usr/bin/env python3
"""
KODO.DIY — High-Resolution Streetwear Drop Generator powered by Google GenAI (Imagen 3)
Generates brand-new photoreal editorial models, matching back murals, and lifestyle angles.
"""
import os
import sys
import json
from pathlib import Path

# Native pure-python env loader
env_paths = [Path.home() / ".env", Path(__file__).resolve().parent / ".env"]
for ep in env_paths:
    if ep.exists():
        with open(ep) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip("'\""))

API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")

def check_available():
    if not API_KEY:
        return False, "GEMINI_API_KEY is not set in ~/.env"
    try:
        from google import genai
        return True, "Ready"
    except ImportError:
        return False, "google-genai is not installed"

def generate_streetwear_image(prompt, output_path, aspect_ratio="3:4"):
    from google import genai
    client = genai.Client(api_key=API_KEY)
    
    response = client.models.generate_images(
        model='imagen-3.0-generate-002',
        prompt=prompt,
        config={
            'number_of_images': 1,
            'aspect_ratio': aspect_ratio,
            'output_mime_type': 'image/jpeg',
            'person_generation': 'ALLOW_ADULT'
        }
    )
    for generated_image in response.generated_images:
        with open(output_path, "wb") as f:
            f.write(generated_image.image.image_bytes)
        return True
    return False

if __name__ == "__main__":
    ok, msg = check_available()
    print(f"Status: {ok}, Message: {msg}")
