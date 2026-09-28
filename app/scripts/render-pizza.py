"""Re-render the pizza product art for the app from templates/figma/product-pizza-*.svg.

The print slot (viewBox -143.5 -232 287 464) crops the slice tip, which on the
magnet is intended. For the web the whole slice has to be visible, so this
renders the art only (no face slot, text or guides) with a viewBox that fits the
full triangle and sleeve, using headless Chrome, then converts to WebP.
Run: python3 scripts/render-pizza.py   (needs Google Chrome and cwebp)
"""
import os, re, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
FIGMA = os.path.join(APP, '../../../templates/figma')
OUT = os.path.join(APP, 'public/art')
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
VIEWBOX = (-160, -292, 320, 528)  # tip at y=-288, sleeve to +-155.64 / y=232
W = 340
H = round(W * VIEWBOX[3] / VIEWBOX[2])

def art_only(svg: str) -> str:
    svg = re.sub(r'<metadata>.*?</metadata>', '', svg, flags=re.S)
    svg = re.sub(r'<g id="FACE SLOT.*?</g>', '', svg, flags=re.S)
    svg = re.sub(r'<text id="(NAME|FAVOURITE).*?</text>', '', svg, flags=re.S)
    svg = re.sub(r'<g id="Guides.*?</g></g>', '</g>', svg, flags=re.S)
    svg = re.sub(r'<style>.*?</style>', '', svg, flags=re.S)
    svg = re.sub(r'width="[^"]*mm" height="[^"]*mm" viewBox="[^"]*"',
                 f'width="{W}" height="{H}" viewBox="{" ".join(map(str, VIEWBOX))}"', svg, count=1)
    return svg

with tempfile.TemporaryDirectory() as tmp:
    for f in sorted(os.listdir(FIGMA)):
        m = re.match(r'product-pizza-(.+)\.svg$', f)
        if not m:
            continue
        svg = art_only(open(os.path.join(FIGMA, f)).read())
        html = os.path.join(tmp, 'p.html')
        open(html, 'w').write(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        png = os.path.join(tmp, 'p.png')
        subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars',
                        f'--window-size={W},{H}', '--default-background-color=00000000',
                        f'--screenshot={png}', 'file://' + html], check=True, capture_output=True)
        dest = os.path.join(OUT, f'product-base-pizza-{m.group(1)}.webp')
        subprocess.run(['cwebp', '-quiet', '-q', '82', '-alpha_q', '90', png, '-o', dest], check=True)
        print('wrote', os.path.relpath(dest, APP))
