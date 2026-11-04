import os
import subprocess
from PIL import Image

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
SVG_PATH = os.path.join(PROJECT_DIR, 'public', 'assets', 'icon.svg')
TMP_HTML = '/tmp/render_icon.html'
TMP_1024 = '/tmp/icon_1024.png'

with open(SVG_PATH, 'r', encoding='utf-8') as f:
    svg_content = f.read()

html_content = f"""<!DOCTYPE html>
<html>
<head>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: 100vw; height: 100vh; overflow: hidden; background: transparent; }}
  svg {{ width: 100%; height: 100%; display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>
"""

with open(TMP_HTML, 'w', encoding='utf-8') as f:
    f.write(html_content)

brave_bin = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
cmd = [
    brave_bin,
    "--headless",
    "--disable-gpu",
    f"--screenshot={TMP_1024}",
    "--window-size=1024,1024",
    "--default-background-color=00000000",
    f"file://{TMP_HTML}"
]

print("Rendering 1024x1024 master icon via Brave headless...")
res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
if not os.path.exists(TMP_1024):
    print("Error rendering icon:", res.stderr.decode('utf-8'))
    exit(1)

print(f"Master icon rendered ({os.path.getsize(TMP_1024)} bytes). Generating sizes with PIL...")
img = Image.open(TMP_1024).convert("RGBA")

# 1. resources/icon.png (1024x1024)
res_icon_path = os.path.join(PROJECT_DIR, 'resources', 'icon.png')
img.save(res_icon_path, format="PNG")
print(f"Saved: {res_icon_path}")

# 2. public/assets sizes
targets = [
    ('icon-512.png', 512),
    ('icon-192.png', 192),
    ('apple-touch-icon.png', 180),
    ('favicon-32x32.png', 32),
    ('favicon-16x16.png', 16),
]

for filename, size in targets:
    out_path = os.path.join(PROJECT_DIR, 'public', 'assets', filename)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(out_path, format="PNG")
    print(f"Saved: {out_path} ({size}x{size})")

# 3. favicon.ico (multi-size 16, 32, 48)
ico_path = os.path.join(PROJECT_DIR, 'public', 'assets', 'favicon.ico')
img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print(f"Saved: {ico_path}")

print("All web and master assets generated successfully!")

